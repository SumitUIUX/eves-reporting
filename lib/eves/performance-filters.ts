import type { ReportDataset, ReportKind } from './types';
import type { ReportConfig, ReportFilters } from './report-config';

export const performanceKinds = ['executivePerformance', 'chargingPerformance', 'sitePerformance', 'chargerPerformance', 'energyDemand', 'tenantUptime'] as const;
export function isPerformanceReport(kind: ReportKind) {
  return (performanceKinds as readonly string[]).includes(kind);
}
export const datePresets = [
  { value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' }, { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' }, { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];
const day = 86400000;
export function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
/** The source timestamps use UTC. All calendar boundaries and labels use UTC too. */
export function presetRange(preset: string, now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let from = today, to = today;
  if (preset === 'yesterday') from = to = new Date(+today - day);
  if (preset === 'last7' || preset === 'last30') {
    to = new Date(+today - day);
    from = new Date(+today - (preset === 'last7' ? 7 : 30) * day);
  }
  if (preset === 'thisMonth') from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  if (preset === 'lastMonth') {
    from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
  }
  return { from: dateKey(from), to: dateKey(to) };
}
export function defaultPerformanceFilters(config: ReportConfig, now = new Date()): ReportFilters {
  return { values: {}, errors: false, from: '', to: '', ...(config.dateColumn !== undefined ? { ...presetRange('last7', now), preset: 'last7' } : {}) };
}
export function dateRangeError(filters: ReportFilters) {
  if (!filters.from || !filters.to) return 'Select both a From and To date.';
  const valid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && dateKey(new Date(s)) === s;
  if (!valid(filters.from) || !valid(filters.to)) return 'Enter a valid date range.';
  return filters.from > filters.to ? 'From date cannot be after To date.' : '';
}
export function periodLabel(filters: ReportFilters) {
  if (!filters.from || !filters.to) return 'Undated snapshot · Date filtering unavailable';
  const format = (s: string) => new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${format(filters.from)} – ${format(filters.to)} · UTC`;
}
export function dateChanged(filters: ReportFilters, defaults: ReportFilters) {
  return filters.from !== defaults.from || filters.to !== defaults.to;
}
export function filterCount(filters: ReportFilters, defaults: ReportFilters) {
  return Object.values(filters.values).filter(v => Array.isArray(v) ? v.length : v && v !== 'all').length + Number(dateChanged(filters, defaults)) + Number(!!filters.timeOfDay && filters.timeOfDay !== 'all') + Number(!!filters.dayOfWeek && filters.dayOfWeek !== 'all');
}
export function matchesValue(value: string, selected: string | string[] | undefined) {
  return !selected || selected === 'all' || (Array.isArray(selected) ? !selected.length || selected.includes(value) : selected === value);
}
/** Site constrains EVSE; Site + EVSE constrain ports. IDs remain scoped to their parent. */
export function dependentOptions(data: ReportDataset, config: ReportConfig, column: number, filters: ReportFilters) {
  const definition = config.filters.find(f => f.column === column);
  const parents = definition?.label === 'EVSE' ? ['Site'] : definition?.label === 'Port' ? ['Site', 'EVSE'] : [];
  const parentColumns = config.filters.filter(f => parents.includes(f.label)).map(f => f.column);
  return [...new Set(data.rows.filter(row => parentColumns.every(c => matchesValue(row[c], filters.values[c]))).map(row => row[column]))].filter(v => v && v !== '—' && v !== '-').sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
}
export function changeFilter(data: ReportDataset, config: ReportConfig, filters: ReportFilters, column: number, value: string | string[]) {
  const next: ReportFilters = { ...filters, values: { ...filters.values, [column]: value } };
  for (const label of ['EVSE', 'Port']) {
    const field = config.filters.find(f => f.label === label);
    if (!field) continue;
    const valid = dependentOptions(data, config, field.column, next);
    const selected = next.values[field.column];
    if (Array.isArray(selected)) next.values[field.column] = selected.filter(v => valid.includes(v));
    else if (selected && selected !== 'all' && !valid.includes(selected)) next.values[field.column] = 'all';
  }
  return next;
}
export function timeBucket(timestamp: string, from: string, to: string) {
  const days = Math.round((Date.parse(to) - Date.parse(from)) / day) + 1;
  const date = new Date(timestamp);
  if (!Number.isFinite(+date)) return '';
  if (days <= 1) return date.toISOString().slice(0, 13) + ':00';
  if (days <= 30) return dateKey(date);
  if (days <= 90) {
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return dateKey(date);
  }
  return date.toISOString().slice(0, 7);
}
export function granularityLabel(from: string, to: string) {
  const days = (Date.parse(to) - Date.parse(from)) / day + 1;
  return days <= 1 ? 'Hourly' : days <= 30 ? 'Daily' : days <= 90 ? 'Weekly' : 'Monthly';
}
