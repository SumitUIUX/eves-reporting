import type { ReportConfig, ReportFilters } from './report-config';
export type ReportLinkContext = { sites: string[]; from?: string; to?: string; alert?: string; scopeSites: string[]; scopeAssets: string[] };
export const alertLabels: Record<string,string> = { 'top-sites':'Top performing sites', 'below-target':'Sites below utilization target', 'below-sla':'Chargers below SLA', declining:'Declining utilization', downtime:'High downtime' };
export function reportLink(href: string, filters: ReportFilters, alert?: string, scopeSites: string[] = [], scopeAssets: string[] = []) {
  const query = new URLSearchParams({from:filters.from,to:filters.to});
  for (const site of Array.isArray(filters.values.site) ? filters.values.site : []) query.append('site',site);
  if (alert) query.set('alert',alert);
  scopeSites.forEach(site=>query.append('scopeSite',site));
  scopeAssets.forEach(asset=>query.append('scopeAsset',asset));
  return `${href}?${query}`;
}
export function readReportContext(query: URLSearchParams): ReportLinkContext {
  const from=query.get('from') ?? '', to=query.get('to') ?? '';
  const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s;
  return { sites:query.getAll('site'), ...(valid(from)&&valid(to)&&from<=to ? {from,to}:{}), alert:alertLabels[query.get('alert') ?? ''] ? query.get('alert')! : undefined, scopeSites:query.getAll('scopeSite'), scopeAssets:query.getAll('scopeAsset') };
}
export function contextFilters(config:ReportConfig, defaults:ReportFilters, context:ReportLinkContext):ReportFilters {
  const site=config.filters.find(field=>field.label==='Site');
  return {...defaults,...(context.from ? {from:context.from,to:context.to!,preset:'custom'}:{}),values:site&&context.sites.length ? {[site.column]:context.sites} : {}};
}
/** Alert scope is the exact set shown by the originating executive card. */
export function scopeReportRows(rows:string[][], context:ReportLinkContext):string[][] {
  if (!context.alert) return rows;
  if (['below-sla','downtime'].includes(context.alert)) return rows.filter(row=>context.scopeAssets.includes(context.alert==='downtime' ? `${row[2]} / ${row[3]}` : row[2]));
  return rows.filter(row=>context.scopeSites.includes(row[0]));
}
