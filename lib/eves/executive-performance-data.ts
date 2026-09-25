import sessions from '@/data/charging-performance.json';
import sites from '@/data/site-performance.json';
import type { ReportDataset } from './types';
import { duration } from './report-config';

/** Uses recorded session facts, never the unrelated Executive Overview totals. */
export const executivePerformanceData: ReportDataset = {
  headers: ['Site name', 'Site ID', 'State', 'Reporting period (UTC)', 'Sessions', 'Energy delivered (kWh)', 'Revenue', 'Average duration (minutes)'],
  rows: sessions.map(row => [row.site_name, row.site_id, sites.find(site => site.site_id === row.site_id)?.state ?? '—', row.session_start_datetime, '1', String(row.energy_consumed_kwh), String(row.total_transaction_amount), String(duration(row.session_duration))]),
};
export function executiveSiteRows(rows: string[][], period: string) {
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    const prev = groups.get(row[1]) ?? [row[0], row[1], row[2], period, '0', '0', '0', '0'];
    for (const i of [4, 5, 6, 7]) prev[i] = String(Number(prev[i]) + Number(row[i]));
    groups.set(row[1], prev);
  }
  return [...groups.values()].map(row => row.map((v, i) => i === 7 ? (Number(v) / Number(row[4])).toFixed(2) : i === 5 || i === 6 ? Number(v).toFixed(2) : v));
}
