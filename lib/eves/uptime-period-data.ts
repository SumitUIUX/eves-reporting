import type { ReportDataset } from './types';
import type { ReportFilters } from './report-config';

const DAY = 86400000;
/** Illustrative daily uptime for Sample Data only; never substitute for workspace telemetry.
 * Repeat each fixture's availability rate over the same rolling 93-day demo coverage.
 * Durations and event counts accumulate over the selected days, percentages remain rates.
 */
export function uptimePeriodDataset(snapshot: ReportDataset, filters: ReportFilters, now = new Date()): ReportDataset {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const from = Date.parse(`${filters.from}T00:00:00Z`);
  const to = Date.parse(`${filters.to}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return {...snapshot,rows:[]};
  const days = Array.from({length:93},(_,age)=>today-age*DAY).filter(day=>day>=from && day<=to);
  if (!days.length) return {...snapshot,rows:[]};
  return {...snapshot,rows:snapshot.rows.map(original=>{
    const row=[...original];
    const availability=Math.min(100,Math.max(0,Number(row[5])));
    const dailySeconds=Math.round(DAY/1000*(1-availability/100));
    const seconds=dailySeconds*days.length;
    row[6]=[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(part=>String(part).padStart(2,'0')).join(':');
    row[7]=String((dailySeconds ? Math.max(1,Math.ceil(dailySeconds/1800)) : 0)*days.length);
    row[8]=dailySeconds ? row[8] : '—';
    row[9]=availability>=95 ? 'Meeting SLA' : 'Below SLA';
    return row;
  })};
}
