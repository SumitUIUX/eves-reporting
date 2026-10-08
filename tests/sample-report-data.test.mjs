import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({configFile:false, root, resolve:{alias:{'@':root}}, server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const { rollingSampleDataset } = await vite.ssrLoadModule('/lib/eves/sample-report-data.ts');
const { reportConfig, filterRows, defaultReportFilters } = await vite.ssrLoadModule('/lib/eves/report-config.ts');
const { default: snapshots } = await vite.ssrLoadModule('/data/reference-reports.json');
test('every master sample table has records under today or T-1 defaults, across year rollover',()=>{
 for(const now of [new Date('2026-10-07T12:00Z'),new Date('2027-01-01T12:00Z')]) for(const [kind,data] of Object.entries(snapshots)) {
  const before=JSON.stringify(data);
  const rolled=rollingSampleDataset(data,reportConfig[kind],now);
  const filtered=filterRows(rolled,reportConfig[kind],defaultReportFilters(reportConfig[kind],now));
  assert.ok(filtered.length>0,kind);
  assert.equal(JSON.stringify(data),before);
 }
});
test('dated performance fixtures populate current day and preserve genuine empty filter results',async()=>{
 for(const [kind,file,dateKey] of [['chargingPerformance','charging-performance','session_start_datetime'],['energyDemand','energy-demand','interval_start_datetime'],['revenueTransaction','revenue-transaction','session_start_datetime']]){
  const {default:records}=await vite.ssrLoadModule(`/data/${file}.json`);
  const headers=Object.keys(records[0]);
  const data={headers,rows:records.map(r=>headers.map(h=>String(r[h]??'')))};
  const config={...reportConfig[kind],dateColumn:headers.indexOf(dateKey)};
  const now=new Date('2027-01-01T12:00Z');
  const rolled=rollingSampleDataset(data,config,now);
  const defaults=defaultReportFilters(config,now);
  assert.equal(filterRows(rolled,config,defaults).length,records.length);
  assert.equal(filterRows(rolled,config,{...defaults,values:{0:['Nonexistent site']}}).length,0);
  assert.equal(filterRows(rolled,config,{...defaults,from:'2030-01-01',to:'2030-01-01'}).length,0);
 }
});
test('executive demo totals reconcile with current-day session fixtures and have multiple chart points',async()=>{
 const {filterExecutiveDashboard}=await vite.ssrLoadModule('/lib/eves/dashboard-filters.ts');
 const {default:base}=await vite.ssrLoadModule('/data/report-dashboard.json');
 const {default:sessions}=await vite.ssrLoadModule('/data/charging-performance.json');
 const now=new Date('2026-10-07T12:00Z');
 const result=filterExecutiveDashboard(base,defaultReportFilters(undefined,now),now);
 assert.equal(result.charging.sessions.value,sessions.length);
 assert.ok(result.business.revenue_trend.length>1);
 assert.equal(result.charging.revenue.value,sessions.reduce((sum,r)=>sum+r.total_transaction_amount,0));
});

test('Infrastructure sample throughput reconciles session counts and energy without altering inventory',()=>{
 const input=snapshots.throughput, before=JSON.stringify(input);
 const result=rollingSampleDataset(input,reportConfig.throughput);
 assert.equal(result.rows.length,input.rows.length);
 result.rows.forEach((row,i)=>{
  assert.deepEqual(row.slice(0,20),input.rows[i].slice(0,20));
  assert.ok(Number(row[24])>0);
  assert.ok(Number(row[22])>0);
  assert.ok(Math.abs(Number(row[22])-Number(row[24])*Number(row[25]))<0.01);
  assert.ok(Number(row[27])<=Math.min(Number(row[16]),Number(row[18])));
 });
 assert.equal(JSON.stringify(input),before);
});
