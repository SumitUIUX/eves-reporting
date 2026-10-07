import { comparisonPeriod } from './comparison-period';
export type UtilizationDay = { site_id: string; site_name: string; date: string; utilization: number };
const DAY = 86400000;
/** Clearly simulated daily history, used only in Sample Data. */
export function sampleUtilizationHistory(sites: {site_id:string;site_name:string;utilization_percent:number}[], now: Date): UtilizationDay[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return sites.flatMap((site, index) => Array.from({length:186}, (_, age) => ({
    site_id:site.site_id, site_name:site.site_name,
    date:new Date(today-age*DAY).toISOString().slice(0,10),
    utilization: Math.max(5, Math.min(95, site.utilization_percent + age * (index % 3 === 0 ? -0.10 : 0.14))),
  })));
}
export function compareUtilization(history: UtilizationDay[], from:string, to:string, sites:string[] = []) {
  const previous = comparisonPeriod(from,to);
  if (!previous) return {available:false, count:0, sites:[]};
  const days = Math.round((Date.parse(to)-Date.parse(from))/DAY)+1;
  const ids = [...new Set(history.filter(row=>!sites.length || sites.includes(row.site_name)).map(row=>row.site_id))];
  let compared = 0;
  const results = ids.flatMap(id=>{
    const rows = history.filter(row=>row.site_id === id);
    const current = rows.filter(row=>row.date>=from && row.date<=to);
    const prior = rows.filter(row=>row.date>=previous.from && row.date<=previous.to);
    if(new Set(current.map(row=>row.date)).size !== days || new Set(prior.map(row=>row.date)).size !== days) return [];
    compared++;
    const average = (values:UtilizationDay[])=>values.reduce((sum,row)=>sum+row.utilization,0)/values.length;
    const value=average(current), old=average(prior);
    return value<old ? [{site_id:id,site_name:rows[0].site_name,current_utilization_percent:value,previous_period_utilization_percent:old,change_percent:value-old}] : [];
  }).sort((a,b)=>a.change_percent-b.change_percent);
  return {available:compared>0,count:results.length,sites:results};
}
