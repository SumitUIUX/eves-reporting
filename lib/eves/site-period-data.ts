import sessions from '@/data/charging-performance.json';
import { rollingSampleDataset } from './sample-report-data';
import { filterRows, reportConfig, type ReportFilters } from './report-config';
import type { ReportDataset } from './types';

/** Build period totals from the same daily sample sessions used by Executive Overview. */
export function sitePeriodDataset(snapshot: ReportDataset, filters: ReportFilters, now = new Date()): ReportDataset {
  const keys = ['site_name','site_id','evse_id','port_id','connector_type','session_id','session_start_datetime','session_end_datetime','session_duration','energy_consumed_kwh','peak_demand_kw','average_demand_kw','vehicle_type','payment_method','is_errored','error_type','total_transaction_amount'] as const;
  const daily = rollingSampleDataset({headers:[...keys],rows:sessions.map(row=>keys.map(key=>String(row[key] ?? '')))}, reportConfig.chargingPerformance, now);
  const dated = filterRows(daily, reportConfig.chargingPerformance, {...filters,values:{},errors:false});
  if (!dated.length) return {...snapshot,rows:[]};
  const rows = snapshot.rows.map(original => {
    const row=[...original];
    const records=dated.filter(session=>session[1]===row[1]);
    const sum=(column:number)=>records.reduce((n,session)=>n+Number(session[column]),0);
    const totalSeconds=records.reduce((n,session)=>n+session[8].split(':').reduce((seconds,part)=>seconds*60+Number(part),0),0);
    const seconds=records.length ? Math.round(totalSeconds/records.length) : 0;
    row[6]=String(records.length);
    row[7]=sum(9).toFixed(2);
    row[8]=(records.length ? sum(9)/records.length : 0).toFixed(2);
    row[9]=[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(part=>String(part).padStart(2,'0')).join(':');
    row[10]=String(Math.max(0,...records.map(session=>Number(session[10]))));
    row[11]=(records.length ? sum(11)/records.length : 0).toFixed(2);
    row[14]=row[15]=sum(16).toFixed(2);
    return row;
  });
  return {...snapshot,rows};
}
