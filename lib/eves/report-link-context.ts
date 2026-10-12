import type { ReportConfig, ReportFilters } from './report-config';
export type ReportLinkContext = { sites: string[]; from?: string; to?: string; preset?: string; selections: Record<string, string | string[]>; errors?: boolean; timeOfDay?: string; dayOfWeek?: string; alert?: string; scopeSites: string[]; scopeAssets: string[] };
export const alertLabels: Record<string,string> = { 'top-sites':'Top performing sites', 'below-target':'Sites below utilization target', 'below-sla':'Chargers below SLA', declining:'Declining utilization', downtime:'High downtime' };
const fieldKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^charger$/, 'evse');
/** Use semantic field names: column indexes differ between dedicated reports. */
export function reportLink(href: string, filters: ReportFilters, alert?: string, scopeSites: string[] = [], scopeAssets: string[] = [], config?: ReportConfig) {
  const query = new URLSearchParams({from:filters.from,to:filters.to,preset:filters.preset ?? 'custom'});
  for (const [key,value] of Object.entries(filters.values)) {
    const label = config?.filters.find(field => String(field.column) === key)?.label ?? key;
    const name = fieldKey(label);
    if (/^\d+$/.test(name)) continue;
    // JSON preserves both multi-selection and single-selection control types.
    query.set(`filter.${name}`, JSON.stringify(value));
    if (name === 'site') for (const site of Array.isArray(value) ? value : value && value !== 'all' ? [value] : []) query.append('site', site);
  }
  if (filters.errors) query.set('errors','true');
  if (filters.timeOfDay) query.set('timeOfDay',filters.timeOfDay);
  if (filters.dayOfWeek) query.set('dayOfWeek',filters.dayOfWeek);
  if (alert) query.set('alert',alert);
  scopeSites.forEach(site=>query.append('scopeSite',site));
  scopeAssets.forEach(asset=>query.append('scopeAsset',asset));
  return `${href}?${query}`;
}
export function readReportContext(query: URLSearchParams): ReportLinkContext {
  const from=query.get('from') ?? '', to=query.get('to') ?? '';
  const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s;
  const selections: ReportLinkContext['selections'] = {};
  query.forEach((raw,key) => {
    if (!key.startsWith('filter.')) return;
    try {
      const value: unknown = JSON.parse(raw);
      if (typeof value === 'string' || (Array.isArray(value) && value.every(item => typeof item === 'string'))) selections[fieldKey(key.slice(7))] = value;
    } catch { /* Ignore malformed URL filters. */ }
  });
  const preset=query.get('preset') ?? 'custom';
  return { sites:query.getAll('site'), selections, ...(valid(from)&&valid(to)&&from<=to ? {from,to,preset:['today','yesterday','last7','last30','thisMonth','lastMonth','custom'].includes(preset) ? preset : 'custom'}:{}), errors:query.get('errors')==='true', timeOfDay:query.get('timeOfDay') ?? undefined, dayOfWeek:query.get('dayOfWeek') ?? undefined, alert:alertLabels[query.get('alert') ?? ''] ? query.get('alert')! : undefined, scopeSites:query.getAll('scopeSite'), scopeAssets:query.getAll('scopeAsset') };
}
export function contextFilters(config:ReportConfig, defaults:ReportFilters, context:ReportLinkContext):ReportFilters {
  const values = {...defaults.values};
  for (const field of config.filters) {
    const value=context.selections[fieldKey(field.label)] ?? (field.label === 'Site' && context.sites.length ? context.sites : undefined);
    if (value !== undefined) values[field.column]=value;
  }
  return {...defaults,...(context.from ? {from:context.from,to:context.to!,preset:context.preset ?? 'custom'}:{}),values,errors:!!context.errors,...(config.dateColumn !== undefined ? {timeOfDay:context.timeOfDay,dayOfWeek:context.dayOfWeek} : {})};
}
/** Alert scope is the exact set shown by the originating executive card. */
export function scopeReportRows(rows:string[][], context:ReportLinkContext):string[][] {
  if (!context.alert) return rows;
  if (['below-sla','downtime'].includes(context.alert)) return rows.filter(row=>context.scopeAssets.includes(context.alert==='downtime' ? `${row[2]} / ${row[3]}` : row[2]));
  return rows.filter(row=>context.scopeSites.includes(row[0]));
}
