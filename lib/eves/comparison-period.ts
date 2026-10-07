/** Full calendar months compare with the preceding month; other ranges use equal days. */
export function comparisonPeriod(from: string, to: string) {
  const start = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  const day = 86400000;
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end < start) return null;
  const wholeMonth = start.getUTCDate() === 1 && start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear() && end.getUTCDate() === new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth()+1, 0)).getUTCDate();
  const previousEnd = new Date(+start-day);
  const previousStart = wholeMonth ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth()-1, 1)) : new Date(+start-(Math.round((+end-+start)/day)+1)*day);
  return { from: previousStart.toISOString().slice(0,10), to: previousEnd.toISOString().slice(0,10) };
}
