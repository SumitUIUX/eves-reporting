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
test('date is one active filter and every Performance drawer defaults to custom range', () => {
  const defaults = f.defaultPerformanceFilters(reportConfig.chargingPerformance, new Date('2026-09-25'));
  assert.equal(f.filterCount(defaults, defaults), 0);
  assert.equal(f.filterCount({ ...scope, values: { 0: ['A','B'] } }, defaults), 2);
  const undated = f.defaultPerformanceFilters(reportConfig.tenantUptime);
  assert.equal(undated.preset, 'custom');
  assert.equal(f.dateRangeError(undated), '');
  for (const kind of ['sitePerformance', 'chargerPerformance', 'tenantUptime', 'revenueTransaction']) {
    assert.equal(f.isPerformanceReport(kind), true);
    assert.equal(f.defaultPerformanceFilters(reportConfig[kind]).preset, 'custom');
  }
  assert.equal(reportConfig.energyDemand.filters.some(x => x.label === 'EVSE'), false);
});
test('charts group hourly, daily, weekly, or monthly without losing year context', () => {
  const t = '2026-09-07T08:15:00Z';
  assert.equal(f.timeBucket(t, '2026-09-07', '2026-09-07'), '2026-09-07T08:00');
  assert.equal(f.timeBucket(t, '2026-09-01', '2026-09-07'), '2026-09-07');
  assert.equal(f.timeBucket(t, '2026-08-01', '2026-09-07'), '2026-09-07');
  assert.equal(f.timeBucket(t, '2026-01-01', '2026-09-07'), '2026-09');
});

 test('sample defaults use the current date without substituting historical records', async () => {
  const { default: energy } = await vite.ssrLoadModule('/data/energy-demand.json');
  const energyData = { headers: [], rows: energy.map(r => [r.site_name, r.site_id, r.evse_id, String(r.port_id), r.interval_id, r.interval_start_datetime, r.interval_end_datetime, String(r.energy_delivered_kwh), String(r.peak_demand_kw), String(r.average_demand_kw), r.interval_duration, String(r.utilization_percent)]) };
  for (const [kind, data] of [['chargingPerformance', sessionData], ['energyDemand', energyData]]) {
    const config = reportConfig[kind];
    const defaults = f.defaultPerformanceFilters(config, new Date('2030-01-01'), data);
    assert.equal(defaults.preset, 'custom');
    const rows = filterRows(data, config, defaults);
    assert.equal(rows.length, 0);
    assert.equal(filterRows(data, config, { ...defaults, from: '2030-01-01', to: '2030-01-02' }).length, 0);
    assert.equal(f.defaultPerformanceFilters(config, new Date('2030-01-01')).preset, 'custom');
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

test('executive site filtering retains every dashboard section with scoped session totals', async () => {
  const { filterExecutiveDashboard, executiveSites } = await vite.ssrLoadModule('/lib/eves/dashboard-filters.ts');
  const { default: base } = await vite.ssrLoadModule('/data/report-dashboard.json');
  const defaults = { ...scope, from: base.dashboard_period.start_date, to: base.dashboard_period.end_date, values: {} };
  const allSites = filterExecutiveDashboard(base, defaults);
  assert.equal(allSites.charging.sessions.value, sessions.length);
  assert.equal(allSites.charging.revenue.value, sessions.reduce((sum, row) => sum + row.total_transaction_amount, 0));
  assert.equal(allSites.alerts_attention_required.sites_with_declining_utilization.sites.length, 0);
  for (const site of executiveSites) {
    const result = filterExecutiveDashboard(base, { ...defaults, values: { site: [site] } });
    const matching = sessions.filter(r => r.site_name === site);
    assert.equal(result.charging.sessions.value, matching.length);
    assert.equal(result.charging.revenue.value, matching.reduce((n,r)=>n+r.total_transaction_amount,0));
    assert.ok(result.infrastructure && result.business && result.alerts_attention_required);
    for (const list of [result.business.top_performing_sites,result.business.underperforming_sites,result.alerts_attention_required.chargers_below_sla.chargers,result.alerts_attention_required.high_downtime.events]) assert.ok(list.every(r=>r.site_name === site));
    assert.ok(Number.isNaN(result.charging.sessions.change_percent), 'Do not invent previous-period comparisons');
  }
  const single = filterExecutiveDashboard(base, { ...defaults, from:'2026-09-01',to:'2026-09-01',values:{site:['Downtown EV Charging Hub']} });
  assert.equal(single.charging.sessions.value,2);
  assert.equal(single.charging.energy_delivered_kwh.value,93.9);
  assert.ok(single.business.revenue_trend.every(p=>p.date === '2026-09-01'));
  assert.equal(single.infrastructure.uptime_percent.note,'Asset snapshot');
  const empty = filterExecutiveDashboard(base,{...defaults,from:'2030-01-01',to:'2030-01-02'});
  assert.equal(empty.charging.sessions.value,0);
  assert.equal(empty.business.revenue_trend.length,0);
  assert.ok(empty.infrastructure && empty.alerts_attention_required);
});

test('Revenue uses custom sample coverage and inclusive transaction date filtering', async () => {
  const { default: records } = await vite.ssrLoadModule('/data/revenue-transaction.json');
  const data = { headers: [], rows: records.map(r => [r.site_name, r.site_id, r.evse_id, String(r.port_id), r.session_id, r.session_start_datetime]) };
  const config = reportConfig.revenueTransaction;
  const defaults = f.defaultPerformanceFilters(config, new Date('2030-01-01'), data);
  assert.equal(defaults.preset, 'custom');
  assert.equal(filterRows(data, config, defaults).length, 0);
  const oneDay = filterRows(data, config, { ...defaults, from: "2026-09-10", to: "2026-09-10" });
  assert.ok(oneDay.length > 0);
  assert.ok(oneDay.every(row => row[5].startsWith("2026-09-10")));
  assert.equal(filterRows(data, config, { ...defaults, from: '2030-01-01', to: '2030-01-02' }).length, 0);
});

 test('report defaults roll over UTC day, month and year with uptime at T-1', () => {
  for (const config of Object.values(reportConfig)) {
    const defaults = f.defaultPerformanceFilters(config, new Date('2030-01-01'), { headers: [], rows: [] });
    assert.equal(defaults.from, defaults.to);
    assert.equal(defaults.to, config.defaultDayOffset === -1 ? '2029-12-31' : '2030-01-01');
    assert.equal(defaults.preset, 'custom');
  }
});

test('empty workspace dashboard retains every section without sample metrics or records', async () => {
  const { emptyExecutiveDashboard } = await vite.ssrLoadModule('/lib/eves/dashboard-data.ts');
  const data = emptyExecutiveDashboard();
  for (const group of [data.charging, data.infrastructure]) {
    assert.equal(Object.keys(group).length, 4);
    for (const metric of Object.values(group)) {
      assert.equal(metric.available, false);
      assert.ok(Number.isNaN(metric.change_percent));
      assert.equal(metric.previous_period_value, undefined);
    }
  }
  for (const rows of Object.values(data.business)) assert.deepEqual(rows, []);
  assert.deepEqual(data.alerts_attention_required.chargers_below_sla.chargers, []);
  assert.deepEqual(data.alerts_attention_required.sites_with_declining_utilization.sites, []);
  assert.deepEqual(data.alerts_attention_required.high_downtime.events, []);
});

 test('comparison windows always use preceding equal-length days', async () => {
  const { comparisonPeriod } = await vite.ssrLoadModule('/lib/eves/comparison-period.ts');
  assert.deepEqual(comparisonPeriod('2026-09-01', '2026-09-30'), { from: '2026-08-02', to: '2026-08-31' });
  assert.deepEqual(comparisonPeriod('2026-01-01', '2026-01-31'), { from: '2025-12-01', to: '2025-12-31' });
  assert.deepEqual(comparisonPeriod('2026-09-10', '2026-09-16'), { from: '2026-09-03', to: '2026-09-09' });
});


test('utilization compares complete two-day and seven-day windows, scopes sites, and handles missing history', async () => {
  const { comparisonPeriod } = await vite.ssrLoadModule('/lib/eves/comparison-period.ts');
  const { compareUtilization, sampleUtilizationHistory } = await vite.ssrLoadModule('/lib/eves/utilization-comparison.ts');
  assert.deepEqual(comparisonPeriod('2026-10-06','2026-10-07'),{from:'2026-10-04',to:'2026-10-05'});
  assert.deepEqual(comparisonPeriod('2026-10-01','2026-10-07'),{from:'2026-09-24',to:'2026-09-30'});
  const history=[60,60,50,50].map((utilization,i)=>({site_id:'a',site_name:'Site A',date:`2026-10-0${i+4}`,utilization}));
  const result=compareUtilization(history,'2026-10-06','2026-10-07');
  assert.equal(result.available,true);
  assert.equal(result.sites[0].change_percent,-10);
  assert.equal(compareUtilization(history.slice(1),'2026-10-06','2026-10-07').available,false);
  assert.equal(compareUtilization(history,'2026-10-06','2026-10-07',['Other site']).count,0);
  const growing=history.map(row=>({...row,utilization:100-row.utilization}));
  assert.deepEqual(compareUtilization(growing,'2026-10-06','2026-10-07'),{available:true,count:0,sites:[]});
  const demo=sampleUtilizationHistory([{site_id:'a',site_name:'A',utilization_percent:60},{site_id:'b',site_name:'B',utilization_percent:55}],new Date('2026-10-07T12:00Z'));
  assert.ok(compareUtilization(demo,'2026-10-01','2026-10-07',['B']).count>0);
  assert.equal(compareUtilization([], '2026-10-06','2026-10-07').available,false);
});

test('Executive charging comparisons use complete preceding periods and identical site scope', async () => {
  const { filterExecutiveDashboard } = await vite.ssrLoadModule('/lib/eves/dashboard-filters.ts');
  const { default: base } = await vite.ssrLoadModule('/data/report-dashboard.json');
  const now = new Date('2026-10-08T12:00:00Z');
  const filters = { values: { site: ['Downtown EV Charging Hub'] }, errors:false, from:'2026-10-06', to:'2026-10-07' };
  const result = filterExecutiveDashboard(base, filters, now);
  assert.equal(result.charging.sessions.value, 6);
  assert.equal(result.charging.sessions.previous_period_value, 6);
  assert.equal(result.charging.sessions.change_percent, 0);
  assert.equal(result.charging.average_session_duration.previous_period_value, result.charging.average_session_duration.value);
  assert.equal(result.infrastructure.active_chargers.previous_period_value, 1);
  assert.ok(Number.isNaN(result.infrastructure.uptime_percent.change_percent), 'Do not fabricate snapshot history');
  const unavailable = filterExecutiveDashboard(base, {...filters,from:'2026-07-08',to:'2026-07-08'},now);
  assert.equal(unavailable.charging.sessions.previous_period_value, undefined);
  assert.ok(Number.isNaN(unavailable.charging.sessions.change_percent));
});

test('Master uptime averages percentage values, never excluded downtime durations', async () => {
  const { metricsFor } = await vite.ssrLoadModule('/lib/eves/report-config.ts');
  const rows = [90,96].map(value => {const row=Array(35).fill('0'); row[13]='3h 6m'; row[15]=`${value}%`;return row;});
  assert.equal(metricsFor('uptime', rows)[0].value, '93%');
  assert.equal(metricsFor('uptime', [])[0].value, '—');
});
