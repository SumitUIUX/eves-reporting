import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ configFile: false, appType: 'custom', root, resolve: { alias: { '@': root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const f = await vite.ssrLoadModule('/lib/eves/performance-filters.ts');
const { reportConfig, filterRows, metricsFor } = await vite.ssrLoadModule('/lib/eves/report-config.ts');
const { default: sessions } = await vite.ssrLoadModule('/data/charging-performance.json');
const sessionData = { headers: [], rows: sessions.map(r => [r.site_name, r.site_id, r.evse_id, String(r.port_id), r.connector_type, r.session_id, r.session_start_datetime, r.session_end_datetime, r.session_duration, String(r.energy_consumed_kwh), String(r.peak_demand_kw), String(r.average_demand_kw), r.vehicle_type, r.payment_method, r.is_errored ? 'Yes' : 'No', r.error_type ?? '—', String(r.total_transaction_amount)]) };
const scope = { values: {}, errors: false, from: '2026-09-01', to: '2026-09-01', preset: 'custom' };

test('UTC presets include full previous days and cross month/year boundaries', () => {
  assert.deepEqual(f.presetRange('last7', new Date('2026-09-25T16:00:00Z')), { from: '2026-09-18', to: '2026-09-24' });
  assert.deepEqual(f.presetRange('lastMonth', new Date('2026-01-02T00:00Z')), { from: '2025-12-01', to: '2025-12-31' });
  assert.deepEqual(f.presetRange('lastMonth', new Date('2024-03-01T00:00Z')), { from: '2024-02-01', to: '2024-02-29' });
  assert.equal(f.dateRangeError(scope), '');
  assert.match(f.dateRangeError({ ...scope, from: '2026-09-02' }), /after/);
  assert.match(f.dateRangeError({ ...scope, to: '' }), /both/);
  assert.match(f.dateRangeError({ ...scope, to: '2026-02-30' }), /valid/);
});
test('one selected reporting period drives actual records, aggregate KPIs, and table totals', () => {
  const filtered = filterRows(sessionData, reportConfig.chargingPerformance, scope);
  assert.equal(filtered.length, 2);
  assert.equal(metricsFor('chargingPerformance', filtered)[1].value, '93.9 kWh');
  assert.equal(filterRows(sessionData, reportConfig.chargingPerformance, { ...scope, from: '2026-10-01', to: '2026-10-02' }).length, 0);
});
test('hierarchy options and stale selections respect Site → EVSE → Port', () => {
  const config = { filters: [{ label: 'Site', column: 0 }, { label: 'EVSE', column: 1 }, { label: 'Port', column: 2 }] };
  const data = { headers: ['Site', 'EVSE', 'Port'], rows: [['A','EVSE-A','1'],['A','EVSE-A','2'],['B','EVSE-B','3']] };
  const selected = { ...scope, values: { 0: ['A'], 1: ['EVSE-A'], 2: ['2'] } };
  assert.deepEqual(f.dependentOptions(data, config, 1, selected), ['EVSE-A']);
  assert.deepEqual(f.dependentOptions(data, config, 2, selected), ['1','2']);
  const changed = f.changeFilter(data, config, selected, 0, ['B']);
  assert.deepEqual(changed.values[1], []);
  assert.deepEqual(changed.values[2], []);
  assert.deepEqual(f.dependentOptions(data, config, 2, changed), ['3']);
});
test('time of day and weekday filter actual UTC interval starts', () => {
  const data = { headers: ['Time'], rows: [['2026-09-07T08:00:00Z'], ['2026-09-07T18:00:00Z'], ['2026-09-08T08:00:00Z']] };
  const config = { filters: [], dateColumn: 0 };
  const filtered = filterRows(data, config, { ...scope, from: '2026-09-07', to: '2026-09-08', timeOfDay: 'Morning', dayOfWeek: '1' });
  assert.deepEqual(filtered, [['2026-09-07T08:00:00Z']]);
});
test('date is one active filter and defaults do not count; unsupported snapshots remain undated', () => {
  const defaults = f.defaultPerformanceFilters(reportConfig.chargingPerformance, new Date('2026-09-25'));
  assert.equal(f.filterCount(defaults, defaults), 0);
  assert.equal(f.filterCount({ ...scope, values: { 0: ['A','B'] } }, defaults), 2);
  const undated = f.defaultPerformanceFilters(reportConfig.tenantUptime);
  assert.equal(undated.from, '');
  assert.match(f.periodLabel(undated), /unavailable/);
  assert.equal(reportConfig.energyDemand.filters.some(x => x.label === 'EVSE'), false);
});
test('charts group hourly, daily, weekly, or monthly without losing year context', () => {
  const t = '2026-09-07T08:15:00Z';
  assert.equal(f.timeBucket(t, '2026-09-07', '2026-09-07'), '2026-09-07T08:00');
  assert.equal(f.timeBucket(t, '2026-09-01', '2026-09-07'), '2026-09-07');
  assert.equal(f.timeBucket(t, '2026-08-01', '2026-09-07'), '2026-09-07');
  assert.equal(f.timeBucket(t, '2026-01-01', '2026-09-07'), '2026-09');
});

 test('sample defaults retain all Charging and Energy records regardless of the current date', async () => {
  const { default: energy } = await vite.ssrLoadModule('/data/energy-demand.json');
  const energyData = { headers: [], rows: energy.map(r => [r.site_name, r.site_id, r.evse_id, String(r.port_id), r.interval_id, r.interval_start_datetime, r.interval_end_datetime, String(r.energy_delivered_kwh), String(r.peak_demand_kw), String(r.average_demand_kw), r.interval_duration, String(r.utilization_percent)]) };
  for (const [kind, data] of [['chargingPerformance', sessionData], ['energyDemand', energyData]]) {
    const config = reportConfig[kind];
    const defaults = f.defaultPerformanceFilters(config, new Date('2030-01-01'), data);
    assert.equal(defaults.preset, 'custom');
    const rows = filterRows(data, config, defaults);
    assert.equal(rows.length, data.rows.length);
    assert.ok(rows.length > 0);
    assert.ok(metricsFor(kind, rows).length > 0);
    assert.equal(filterRows(data, config, { ...defaults, from: '2030-01-01', to: '2030-01-02' }).length, 0);
    assert.equal(f.defaultPerformanceFilters(config, new Date('2030-01-01')).preset, 'last7');
  }
});

test('every report filter targets supplied data and selects the matching rows', async () => {
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../components/eves/report-page.tsx', import.meta.url), 'utf8');
  const reference = JSON.parse(await readFile(new URL('../data/reference-reports.json', import.meta.url), 'utf8'));
  const files = { chargingPerformance: 'charging-performance', sitePerformance: 'site-performance', chargerPerformance: 'charger-performance', energyDemand: 'energy-demand', tenantUptime: 'uptime-reliability', revenueTransaction: 'revenue-transaction' };
  for (const [kind, config] of Object.entries(reportConfig)) {
    let data = reference[kind];
    if (files[kind]) {
      const records = JSON.parse(await readFile(new URL(`../data/${files[kind]}.json`, import.meta.url), 'utf8'));
      const block = page.match(new RegExp(`const ${kind}Fields = \\[([\\s\\S]*?)\\] as const`))[1];
      const fields = [...block.matchAll(/\["([^"]+)",/g)].map(m => m[1]);
      data = { headers: fields, rows: records.map(r => fields.map(k => typeof r[k] === 'boolean' ? r[k] ? 'Yes' : 'No' : String(r[k] ?? '—'))) };
    } else data = { ...data, rows: data.rows.map(row => row.map(v => typeof v === 'boolean' ? v ? 'Yes' : 'No' : String(v ?? '—'))) };
    for (const field of config.filters) {
      assert.ok(field.column >= 0 && field.column < data.headers.length, `${kind}: ${field.label} has a real column`);
      assert.equal(field.unavailable, undefined);
      const value = data.rows.map(r => r[field.column]).find(v => v && v !== '—' && v !== '-');
      assert.ok(value, `${kind}: ${field.label} has options`);
      const filtered = filterRows(data, config, { values: { [field.column]: [value] }, from: '', to: '', errors: false });
      assert.deepEqual(filtered, data.rows.filter(row => row[field.column] === value), `${kind}: ${field.label}`);
    }
  }
});
