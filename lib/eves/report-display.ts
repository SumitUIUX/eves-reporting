/** Format presentation only; exports, filtering and sorting retain the raw value. */
export function readableTimestamp(value:string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
  const date=new Date(/(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : value+'Z');
  if (!Number.isFinite(+date)) return null;
  return date.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'})+' UTC';
}
export function compactPeriod(from:string,to:string,includeYear=false) {
  const show=(s:string)=>new Date(s+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:includeYear?'numeric':undefined,timeZone:'UTC'});
  if (from===to) return show(from);
  if(from.slice(0,7)===to.slice(0,7) && !includeYear) return `${show(from)}–${Number(to.slice(8))}`;
  return `${show(from)}–${show(to)}`;
}
