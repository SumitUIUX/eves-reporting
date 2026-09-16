export type ReportingPeriod = "Quarter" | "Months" | "Custom range";
export interface ReportRange {
  from: string;
  to: string;
}

const DAY_MS = 86_400_000;
export const MAX_DOWNLOAD_DAYS = 31;
export const MAX_REPORT_DAYS = 93;

export function getReportRanges({
  period,
  quarters,
  months,
  from,
  to,
}: {
  period: ReportingPeriod;
  quarters: string[];
  months: string[];
  from: string;
  to: string;
}): ReportRange[] {
  if (period === "Custom range") return [{ from, to }];
  return (period === "Quarter" ? quarters : months).map((value) => {
    const match =
      period === "Quarter"
        ? /^(\d{4})-Q([1-4])$/.exec(value)
        : /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    if (!match) return { from: "", to: "" };
    const year = Number(match[1]);
    const start =
      period === "Quarter" ? (Number(match[2]) - 1) * 3 + 1 : Number(match[2]);
    const end = period === "Quarter" ? start + 2 : start;
    const lastDay = new Date(Date.UTC(year, end, 0)).getUTCDate();
    return {
      from: `${match[1]}-${String(start).padStart(2, "0")}-01`,
      to: `${match[1]}-${String(end).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  });
}

function dayNumber(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  )
    return null;
  return timestamp / DAY_MS;
}

export type ReportDelivery =
  | { valid: false; days: number; spanDays: number; error: string }
  | {
      valid: true;
      days: number;
      spanDays: number;
      delivery: "download" | "email";
    };

// Count unique calendar days inclusively, independent of timezone and DST.
// The full span is capped too, so disjoint selections cannot bypass the limit.
export function evaluateReportDelivery(
  ranges: ReportRange[],
  period: ReportingPeriod,
): ReportDelivery {
  const invalid = (error: string, days = 0, spanDays = 0): ReportDelivery => ({
    valid: false,
    days,
    spanDays,
    error,
  });
  if (!ranges.length) return invalid("Select at least one reporting period.");
  const intervals: { start: number; end: number }[] = [];
  for (const range of ranges) {
    const start = dayNumber(range.from),
      end = dayNumber(range.to);
    if (start === null || end === null)
      return invalid("Choose valid start and end dates.");
    if (end < start)
      return invalid("The end date must be on or after the start date.");
    intervals.push({ start, end });
  }
  intervals.sort((a, b) => a.start - b.start);
  const merged: typeof intervals = [];
  for (const interval of intervals) {
    const previous = merged.at(-1);
    if (previous && interval.start <= previous.end + 1)
      previous.end = Math.max(previous.end, interval.end);
    else merged.push({ ...interval });
  }
  const days = merged.reduce(
    (total, range) => total + range.end - range.start + 1,
    0,
  );
  const spanDays = merged.at(-1)!.end - merged[0].start + 1;
  if (spanDays > MAX_REPORT_DAYS)
    return invalid(
      `Choose a reporting span of ${MAX_REPORT_DAYS} days or less. Your selection spans ${spanDays} days.`,
      days,
      spanDays,
    );
  const firstMonth = new Date(merged[0].start * DAY_MS)
    .toISOString()
    .slice(0, 7);
  const lastMonth = new Date(merged.at(-1)!.end * DAY_MS)
    .toISOString()
    .slice(0, 7);
  return {
    valid: true,
    days,
    spanDays,
    delivery:
      period === "Quarter" ||
      firstMonth !== lastMonth ||
      days > MAX_DOWNLOAD_DAYS
        ? "email"
        : "download",
  };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
// Preserve the existing reporting years, now included in each choice.
const REPORT_YEARS = [2026, 2025, 2027];
export const quarterOptions = REPORT_YEARS.flatMap((year) =>
  [4, 3, 2, 1].map((quarter) => ({
    value: `${year}-Q${quarter}`,
    label: `Q${quarter} - ${year}`,
  })),
);
export const monthOptions = REPORT_YEARS.flatMap((year) =>
  MONTH_NAMES.map((name, index) => ({
    value: `${year}-${String(index + 1).padStart(2, "0")}`,
    label: `${name} ${year}`,
  })).reverse(),
);
