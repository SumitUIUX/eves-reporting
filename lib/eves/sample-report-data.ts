import type { ReportDataset } from './types';
import { isoDate, type ReportConfig } from './report-config';

const DAY = 86400000;
/** Demo-only fixtures: repeat the supplied daily scenarios over the latest 93 days.
 * Keep durations, site relationships and source fixtures intact. Never use for workspace data.
 */
export function rollingSampleDataset(data: ReportDataset, config: ReportConfig, now = new Date()): ReportDataset {
  if (config.short === "Infrastructure") {
    // Illustrative sample throughput; preserve every inventory identifier and relationship.
    return {headers:data.headers,rows:data.rows.map((row,index)=>{
      if (Number(row[24]) > 0) return row;
      const copy=[...row], count=4+index%8, minutes=30+(index%5)*10;
      const capacity=Math.min(Number(row[16]),Number(row[18]));
      const averageEnergy=Number((capacity*0.55*minutes/60).toFixed(2));
      const clock=(total:number)=>`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}:00`;
      copy[22]=(averageEnergy*count).toFixed(2); copy[23]=clock(minutes*count); copy[24]=String(count);
      copy[25]=averageEnergy.toFixed(2); copy[26]=clock(minutes); copy[27]=(capacity*0.85).toFixed(2);
      return copy;
    })};
  }
  if (config.dateColumn === undefined) return data;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const idColumns = data.headers.map((h, i) => /^(session|interval|downtime event)[ _]?id$/i.test(h) ? i : -1).filter(i => i >= 0);
  const rows: string[][] = [];
  for (let offset = 0; offset < 93; offset++) {
    const target = today - offset * DAY;
    const dayKey = new Date(target).toISOString().slice(0, 10);
    for (const row of data.rows) {
      const original = isoDate(String(row[config.dateColumn]), config.dateStyle);
      const anchor = Date.parse(original + 'T00:00:00Z');
      if (!Number.isFinite(anchor)) continue;
      const delta = target - anchor;
      const shifted = row.map(value => {
        if (typeof value !== 'string') return value;
        if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) {
          const date = new Date(Date.parse(value.length === 10 ? value + 'T00:00:00Z' : value) + delta);
          return Number.isFinite(+date) ? (value.length === 10 ? date.toISOString().slice(0, 10) : date.toISOString()) : value;
        }
        const dmy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/);
        if (dmy) {
          const date = new Date(Date.parse(`${dmy[3]}-${dmy[2]}-${dmy[1]}T00:00:00Z`) + delta).toISOString().slice(0, 10);
          return `${date.slice(8)}/${date.slice(5,7)}/${date.slice(0,4)}${dmy[4]}`;
        }
        if (/^[A-Z][a-z]{2} \d{2}, \d{2}:\d{2}$/.test(value)) {
          const parsed = Date.parse(value.replace(', ', ', 2026 ') + ' UTC');
          return new Date(parsed + delta).toISOString();
        }
        if (/^[A-Z][a-z]{2} \d{2}, \d{4}$/.test(value)) {
          return new Date(Date.parse(value + ' UTC') + delta).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric', timeZone:'UTC'});
        }
        return value;
      });
      for (const column of idColumns) shifted[column] = `${row[column]}-DEMO-${dayKey}`;
      rows.push(shifted);
    }
  }
  return { headers: data.headers, rows };
}
