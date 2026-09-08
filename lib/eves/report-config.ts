import type { ReportKind, ReportDataset } from "./types";
export interface FilterDefinition {
  label: string;
  column: number;
}
export interface ReportConfig {
  title: string;
  description: string;
  short: string;
  defaultColumns: number[];
  filters: FilterDefinition[];
  dateColumn?: number;
  dateStyle?: "dmy" | "month";
  numeric: number[];
  chart?: "energy" | "power" | "uptime";
}
export const reportConfig: Record<ReportKind, ReportConfig> = {
  sessions: {
    title: "Charging sessions",
    description:
      "A clearer view of every session, from connection to completion.",
    short: "Sessions",
    defaultColumns: [0, 1, 5, 7, 10, 25, 19, 20, 17],
    filters: [
      { label: "Site", column: 1 },
      { label: "Charger", column: 5 },
      { label: "Connector type", column: 7 },
      { label: "Session type", column: 28 },
      { label: "Payment method", column: 30 },
      { label: "Project tag", column: 29 },
    ],
    dateColumn: 10,
    dateStyle: "dmy",
    numeric: [8, 9, 19, 20, 23, 26, 27],
    chart: "energy",
  },
  intervals: {
    title: "Interval load profile",
    description:
      "Understand energy demand and power delivery, interval by interval.",
    short: "Intervals",
    defaultColumns: [0, 4, 6, 9, 10, 12, 13, 14, 15, 16],
    filters: [
      { label: "Site", column: 0 },
      { label: "Charger", column: 4 },
      { label: "Project tag", column: 17 },
    ],
    dateColumn: 9,
    dateStyle: "month",
    numeric: [5, 7, 13, 14, 15],
    chart: "power",
  },
  throughput: {
    title: "Infrastructure & throughput",
    description:
      "Your charging assets and their performance, together in one report.",
    short: "Infrastructure",
    defaultColumns: [0, 11, 12, 14, 15, 16, 19, 22, 24, 31],
    filters: [
      { label: "Site", column: 0 },
      { label: "Charger", column: 11 },
      { label: "Manufacturer", column: 12 },
      { label: "Model", column: 14 },
      { label: "Power level", column: 15 },
      { label: "Connector type", column: 19 },
      { label: "Project tag", column: 31 },
    ],
    numeric: [8, 9, 16, 18, 22, 24, 25, 27, 29],
  },
  uptime: {
    title: "Uptime & reliability",
    description:
      "Monitor availability, identify downtime, and keep your network dependable.",
    short: "Uptime",
    defaultColumns: [0, 3, 4, 5, 6, 7, 8, 9, 11, 13, 14],
    filters: [
      { label: "Site", column: 0 },
      { label: "Site area", column: 2 },
      { label: "Charger", column: 3 },
      { label: "Project tag", column: 14 },
    ],
    numeric: [7, 8, 10, 13],
    chart: "uptime",
  },
  events: {
    title: "Uptime & reliability",
    description:
      "Monitor availability, identify downtime, and keep your network dependable.",
    short: "Downtime events",
    defaultColumns: [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    filters: [
      { label: "Site", column: 1 },
      { label: "Site area", column: 3 },
      { label: "Charger", column: 4 },
      { label: "Status", column: 11 },
    ],
    dateColumn: 8,
    dateStyle: "month",
    numeric: [],
  },
};
export function num(value: string | undefined) {
  if (!value || value === "-" || value === "—") return 0;
  return Number(value.replace(/[$,%]/g, "")) || 0;
}
export function duration(value: string) {
  if (/^\d+:\d+:\d+$/.test(value)) {
    const [h, m, s] = value.split(":").map(Number);
    return h * 60 + m + s / 60;
  }
  let total = 0;
  for (const [, n, u] of value.matchAll(/(\d+(?:\.\d+)?)\s*(d|h|m)/g))
    total += Number(n) * (u === "d" ? 1440 : u === "h" ? 60 : 1);
  return total;
}
export function displayDuration(minutes: number) {
  const rounded = Math.round(minutes);
  return `${Math.floor(rounded / 60)}h ${rounded % 60}m`;
}
/** A wall-clock key preserves time ordering without inventing a timezone. */
export function timestampKey(value: string, style?: "dmy" | "month") {
  const date = isoDate(value, style);
  const time = value.match(/\b(\d{2}:\d{2}(?::\d{2})?)\b/)?.[1] ?? "00:00:00";
  return date ? `${date}T${time.length === 5 ? time + ":00" : time}` : "";
}
export function isoDate(value: string, style?: "dmy" | "month") {
  if (style === "dmy") {
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  }
  const normalized = /^[A-Z][a-z]{2} \d{2}, \d{2}:\d{2}$/.test(value)
    ? value.replace(", ", ", 2026 ")
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf())
    ? ""
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export interface ReportFilters {
  values: Record<string, string>;
  from: string;
  to: string;
  errors: boolean;
}
export const emptyFilters: ReportFilters = {
  values: {},
  from: "",
  to: "",
  errors: false,
};
export function filterRows(
  dataset: ReportDataset,
  config: ReportConfig,
  filters: ReportFilters,
  search = "",
) {
  return dataset.rows.filter(
    (row) =>
      Object.entries(filters.values).every(
        ([column, value]) =>
          !value || value === "all" || row[Number(column)] === value,
      ) &&
      (!filters.errors || row[17] === "Yes") &&
      (!search || row.join(" ").toLowerCase().includes(search.toLowerCase())) &&
      ((!filters.from && !filters.to) ||
        config.dateColumn === undefined ||
        (() => {
          const date = isoDate(row[config.dateColumn!], config.dateStyle);
          return (
            !!date &&
            (!filters.from || date >= filters.from) &&
            (!filters.to || date <= filters.to)
          );
        })()),
  );
}
export function metricsFor(kind: ReportKind, rows: string[][]) {
  const sum = (i: number) => rows.reduce((a, r) => a + num(r[i]), 0),
    unique = (i: number) => new Set(rows.map((r) => r[i])).size;
  const avg = (i: number) => (rows.length ? sum(i) / rows.length : 0);
  const f = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (kind === "sessions")
    return [
      {
        label: "Total sessions",
        value: f(rows.length),
        note: "Sessions in this selection",
      },
      {
        label: "Energy delivered",
        value: f(sum(19)) + " kWh",
        note: "Total energy across sessions",
      },
      {
        label: "Average duration",
        value: rows.length
          ? displayDuration(
              rows.reduce((a, r) => a + duration(r[25]), 0) / rows.length,
            )
          : "—",
        note: "Mean session duration",
      },
      {
        label: "Total revenue",
        value: "$" + f(sum(20)),
        note: `${rows.filter((r) => r[17] === "Yes").length} sessions with errors`,
      },
    ];
  if (kind === "intervals")
    return [
      {
        label: "Total intervals",
        value: f(rows.length),
        note: "Intervals in this selection",
      },
      {
        label: "Energy delivered",
        value: f(sum(13)) + " kWh",
        note: "Sum of interval energy",
      },
      {
        label: "Average power",
        value: rows.length
          ? f(
              rows.reduce((a, r) => a + num(r[15]) * duration(r[16]), 0) /
                (rows.reduce((a, r) => a + duration(r[16]), 0) || 1),
            ) + " kW"
          : "—",
        note: "Weighted by interval duration",
      },
      {
        label: "Peak power",
        value: rows.length
          ? f(Math.max(...rows.map((r) => num(r[14])))) + " kW"
          : "—",
        note: `${rows.length ? f((rows.filter((r) => num(r[15]) === 0).length / rows.length) * 100) : 0}% idle intervals`,
      },
    ];
  if (kind === "throughput")
    return [
      {
        label: "Chargers",
        value: f(unique(11)),
        note: "Unique charging assets",
      },
      {
        label: "Connectors",
        value: f(new Set(rows.map((r) => r[11] + "|" + r[17])).size),
        note: "Across selected chargers",
      },
      {
        label: "Total sessions",
        value: f(sum(24)),
        note: "Sep 1–7, 2026 snapshot",
      },
      {
        label: "Energy delivered",
        value: f(sum(22)) + " kWh",
        note: "Sep 1–7, 2026 snapshot",
      },
    ];
  if (kind === "uptime")
    return [
      {
        label: "Average uptime",
        value: rows.length ? f(avg(13)) + "%" : "—",
        note: "Unweighted connector average",
      },
      {
        label: "Downtime events",
        value: f(sum(8)),
        note: "Total connector event count",
      },
      {
        label: "Below SLA",
        value: f(rows.filter((r) => num(r[13]) < 95).length),
        note: "Connectors below 95% uptime",
      },
      {
        label: "Connectors",
        value: f(rows.length),
        note: `Across ${unique(0)} sites`,
      },
    ];
  return [
    {
      label: "Downtime events",
      value: f(rows.length),
      note: "Events in this selection",
    },
    {
      label: "Open events",
      value: f(rows.filter((r) => /open|active|ongoing/i.test(r[11])).length),
      note: "Unresolved events",
    },
    {
      label: "Affected sites",
      value: f(unique(1)),
      note: "Sites with reported events",
    },
    {
      label: "Affected chargers",
      value: f(unique(4)),
      note: "Chargers with reported events",
    },
  ];
}
