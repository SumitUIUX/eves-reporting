import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ configFile: false, appType: 'custom', root, resolve: { alias: { '@': root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const f = await vite.ssrLoadModule('/lib/eves/performance-filters.ts');
const { reportConfig, filterRows, metricsFor } = await vite.ssrLoadModule('/lib/eves/report-config.ts');
const { executivePerformanceData, executiveSiteRows } = await vite.ssrLoadModule('/lib/eves/executive-performance-data.ts');
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
  const filtered = filterRows(executivePerformanceData, reportConfig.executivePerformance, scope);
  assert.equal(filtered.length, 2);
  const table = executiveSiteRows(filtered, f.periodLabel(scope));
  assert.equal(table.length, 1);
  assert.equal(table[0][4], '2');
  assert.equal(table[0][5], '93.90');
  assert.equal(metricsFor('executivePerformance', table)[1].value, '93.9 kWh');
  assert.equal(filterRows(executivePerformanceData, reportConfig.executivePerformance, { ...scope, from: '2026-10-01', to: '2026-10-02' }).length, 0);
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
