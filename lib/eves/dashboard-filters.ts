import sessions from '@/data/charging-performance.json';
import assets from '@/data/charger-performance.json';
import siteRecords from '@/data/site-performance.json';
import uptime from '@/data/uptime-reliability.json';
import type { ExecutiveDashboardData, DashboardMetric } from './dashboard-data';
import type { ReportFilters } from './report-config';

export const executiveSites = [...new Set([...siteRecords, ...sessions, ...assets].map(r => r.site_name))].sort();
const seconds = (value: string) => value.split(':').reduce((n, v) => n * 60 + Number(v), 0);
const duration = (value: number) => [Math.floor(value / 3600), Math.floor(value / 60) % 60, Math.round(value) % 60].map(v => String(v).padStart(2, '0')).join(':');
const avg = (values: number[]) => values.length ? values.reduce((a,b) => a+b, 0) / values.length : 0;
const metric = (value: number, note?: string, available = true): DashboardMetric => ({ value, change_percent: NaN, note, available });

/** Dated charging measures use session records; undated asset measures remain explicitly labelled snapshots. */
export function filterExecutiveDashboard(base: ExecutiveDashboardData, filters: ReportFilters): ExecutiveDashboardData {
  const selected = Array.isArray(filters.values.site) ? filters.values.site : [];
  const match = (r: {site_name: string}) => !selected.length || selected.includes(r.site_name);
  const rows = sessions.filter(r => match(r) && r.session_start_datetime.slice(0,10) >= filters.from && r.session_start_datetime.slice(0,10) <= filters.to);
  const scopedAssets = assets.filter(match);
  const scopedUptime = uptime.filter(match);
  const siteSummaries = siteRecords.filter(match).map(site => {
    const records = rows.filter(r => r.site_id === site.site_id);
    return {site_id: site.site_id, site_name: site.site_name, sessions: records.length, energy_delivered_kwh: records.reduce((n,r)=>n+r.energy_consumed_kwh,0), revenue: records.reduce((n,r)=>n+r.total_transaction_amount,0), utilization_percent: site.utilization_percent};
  });
  const revenue = new Map<string, number>();
  for (const r of rows) { const day = r.session_start_datetime.slice(0,10); revenue.set(day, (revenue.get(day) ?? 0) + r.total_transaction_amount); }
  const below = scopedUptime.filter(r=>r.uptime_percent < base.alerts_attention_required.chargers_below_sla.sla_threshold_percent);
  const byEvse = [...new Set(below.map(r=>r.evse_id))].map(id=>{const ports = scopedUptime.filter(r=>r.evse_id === id); return {evse_id:id,site_name:ports[0].site_name,uptime_percent:avg(ports.map(r=>r.uptime_percent))};}).filter(r=>r.uptime_percent < base.alerts_attention_required.chargers_below_sla.sla_threshold_percent);
  const declining: ExecutiveDashboardData["alerts_attention_required"]["sites_with_declining_utilization"]["sites"] = [];
  const downtime = scopedUptime.filter(r=>r.downtime_event_count > 0).sort((a,b)=>seconds(b.total_downtime_duration)-seconds(a.total_downtime_duration)).slice(0,3).map(r=>({evse_id:`${r.evse_id} / ${r.port_id}`,site_name:r.site_name,downtime_duration:r.total_downtime_duration,downtime_events:r.downtime_event_count,primary_reason:r.most_common_downtime_reason}));
  return {
    dashboard_period:{start_date:filters.from,end_date:filters.to},
    charging:{sessions:metric(rows.length),energy_delivered_kwh:metric(rows.reduce((n,r)=>n+r.energy_consumed_kwh,0)),revenue:metric(rows.reduce((n,r)=>n+r.total_transaction_amount,0)),average_session_duration:{value:rows.length ? duration(avg(rows.map(r=>seconds(r.session_duration)))) : '—',change_percent:NaN}},
    infrastructure:{
      active_chargers:{...metric(new Set(rows.map(r=>r.evse_id)).size,'Chargers with sessions / inventory'),total:new Set(scopedAssets.map(r=>r.evse_id)).size},
      connector_count:{...metric(new Set(scopedAssets.map(r=>`${r.evse_id}/${r.port_id}`)).size,'Inventory snapshot'),total:new Set(scopedAssets.map(r=>`${r.evse_id}/${r.port_id}`)).size},
      utilization_percent:metric(avg(scopedAssets.map(r=>r.utilization_percent)),'Asset snapshot',!!scopedAssets.length),
      uptime_percent:metric(avg(scopedUptime.map(r=>r.uptime_percent)),'Asset snapshot',!!scopedUptime.length),
    },
    business:{revenue_trend:[...revenue].sort(([a],[b])=>a.localeCompare(b)).map(([date,revenue])=>({date,revenue})),top_performing_sites:siteSummaries.filter(s=>s.sessions > 0).sort((a,b)=>b.revenue-a.revenue).slice(0,5),underperforming_sites:siteSummaries.filter(s=>s.utilization_percent < 60).sort((a,b)=>a.utilization_percent-b.utilization_percent).slice(0,5)},
    alerts_attention_required:{chargers_below_sla:{count:byEvse.length,sla_threshold_percent:base.alerts_attention_required.chargers_below_sla.sla_threshold_percent,chargers:byEvse},sites_with_declining_utilization:{count:declining.length,sites:declining},high_downtime:{count:downtime.length,events:downtime}},
  };
}
