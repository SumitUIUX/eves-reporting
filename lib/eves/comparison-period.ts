/** Compare inclusive dates with the immediately preceding equal-length period. */
export function comparisonPeriod(from: string, to: string) {
  const start = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  const day = 86400000;
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end < start) return null;
  const previousEnd = new Date(+start-day);
  const previousStart = new Date(+start-(Math.round((+end-+start)/day)+1)*day);
  return { from: previousStart.toISOString().slice(0,10), to: previousEnd.toISOString().slice(0,10) };
}
