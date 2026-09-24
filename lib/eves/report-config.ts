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
    defaultColumns: [0, 1, 5, 6, 7, 9, 12, 29, 21, 22, 23, 24, 19],
    filters: [
      { label: "Site", column: 1 },
      { label: "Charger", column: 5 },
      { label: "Connector type", column: 9 },
      { label: "Session type", column: 32 },
      { label: "Payment method", column: 34 },
      { label: "Project tag", column: 33 },
    ],
    dateColumn: 12,
    dateStyle: "dmy",
    numeric: [10, 11, 21, 23, 27, 30, 31],
    chart: "energy",
  },
  intervals: {
    title: "Interval load profile",
    description:
      "Understand energy demand and power delivery, interval by interval.",
    short: "Intervals",
    defaultColumns: [0, 4, 5, 6, 8, 11, 12, 14, 15, 16, 17, 18],
    filters: [
      { label: "Site", column: 0 },
      { label: "Charger", column: 4 },
      { label: "Project tag", column: 19 },
    ],
    dateColumn: 11,
    dateStyle: "month",
    numeric: [7, 9, 15, 16, 17],
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
    defaultColumns: [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 16],
    filters: [
      { label: "Site", column: 0 },
      { label: "Charger", column: 3 },
      { label: "Project tag", column: 16 },
    ],
    numeric: [9, 10, 12, 15],
    chart: "uptime",
  },
  events: {
    title: "Uptime & reliability",
    description:
      "Monitor availability, identify downtime, and keep your network dependable.",
    short: "Downtime events",
    defaultColumns: [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    filters: [
      { label: "Site", column: 1 },
      { label: "Charger", column: 4 },
      { label: "Status", column: 14 },
    ],
    dateColumn: 11,
    dateStyle: "month",
    numeric: [],
  },
  chargingPerformance: {
    title: "Charging performance",
    description:
      "Track session activity, energy delivery, demand, and revenue across your charging network.",
    short: "Charging performance",
    defaultColumns: [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    filters: [
      { label: "Site", column: 0 },
      { label: "EVSE", column: 2 },
      { label: "Connector type", column: 4 },
      { label: "Vehicle type", column: 12 },
      { label: "Payment method", column: 13 },
      { label: "Error status", column: 14 },
      { label: "Error type", column: 15 },
    ],
    dateColumn: 6,
    numeric: [3, 9, 10, 11, 16],
    chart: "energy",
  },
  sitePerformance: {
    title: "Site performance",
    description:
      "Compare charging activity, utilization, uptime, demand, and revenue across sites.",
    short: "Site performance",
    defaultColumns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    filters: [
      { label: "Site", column: 0 },
      { label: "City", column: 2 },
      { label: "State", column: 3 },
    ],
    numeric: [4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15],
    chart: "uptime",
  },
  chargerPerformance: {
    title: "Charger performance",
    description:
      "Compare sessions, energy delivery, utilization, uptime, and revenue by charger and connector.",
    short: "Charger performance",
    defaultColumns: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
    ],
    filters: [
      { label: "Site", column: 0 },
      { label: "EVSE", column: 2 },
      { label: "Manufacturer", column: 3 },
      { label: "Model", column: 4 },
      { label: "Connector type", column: 7 },
    ],
    numeric: [5, 6, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18],
    chart: "uptime",
  },
  energyDemand: {
    title: "Energy & demand",
    description:
      "Review interval energy delivery, demand peaks, and charging utilization.",
    short: "Energy & demand",
    defaultColumns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    filters: [
      { label: "Site", column: 0 },
      { label: "EVSE", column: 2 },
      { label: "Port", column: 3 },
    ],
    dateColumn: 5,
    numeric: [3, 7, 8, 9, 11],
    chart: "power",
  },
  tenantUptime: {
    title: "Uptime & reliability",
    description:
      "Monitor connector uptime, downtime duration, event frequency, and SLA status.",
    short: "Uptime & reliability",
    defaultColumns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    filters: [
      { label: "Site", column: 0 },
      { label: "EVSE", column: 2 },
      { label: "Downtime reason", column: 8 },
      { label: "SLA status", column: 9 },
    ],
    numeric: [3, 4, 5, 7],
    chart: "uptime",
  },
  revenueTransaction: {
    title: "Revenue & transaction",
    description:
      "Review transaction value, fees, taxes, and revenue distribution by charging session.",
    short: "Revenue & transaction",
    defaultColumns: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    ],
    filters: [
      { label: "Site", column: 0 },
      { label: "EVSE", column: 2 },
      { label: "Payment method", column: 9 },
      { label: "Transaction status", column: 17 },
    ],
    dateColumn: 5,
    numeric: [3, 7, 8, 10, 11, 12, 13, 14, 15, 16],
    chart: "energy",
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
  values: Record<string, string | string[]>;
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
        ([column, value]) => {
          if (Array.isArray(value))
            return !value.length || value.includes(row[Number(column)]);
          return !value || value === "all" || row[Number(column)] === value;
        },
      ) &&
      (!filters.errors || row[19] === "Yes") &&
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
        value: f(sum(21)) + " kWh",
        note: "Total energy across sessions",
      },
      {
        label: "Average duration",
        value: rows.length
          ? displayDuration(
              rows.reduce((a, r) => a + duration(r[29]), 0) / rows.length,
            )
          : "—",
        note: "Mean session duration",
      },
      {
        label: "Total revenue",
        value: "$" + f(sum(23)),
        note: `${rows.filter((r) => r[19] === "Yes").length} sessions with errors`,
      },
    ];
  if (kind === "chargingPerformance")
    return [
      {
        label: "Total sessions",
        value: f(rows.length),
        note: "Sessions in this selection",
      },
      {
        label: "Energy delivered",
        value: f(sum(9)) + " kWh",
        note: "Total energy across sessions",
      },
      {
        label: "Average duration",
        value: rows.length
          ? displayDuration(
              rows.reduce((a, r) => a + duration(r[8]), 0) / rows.length,
            )
          : "—",
        note: "Mean session duration",
      },
      {
        label: "Total revenue",
        value: "$" + f(sum(16)),
        note: `Across ${f(unique(0))} sites`,
      },
    ];
  if (kind === "sitePerformance")
    return [
      {
        label: "Total sites",
        value: f(rows.length),
        note: "Sites in this selection",
      },
      {
        label: "Total sessions",
        value: f(sum(6)),
        note: "Sessions across selected sites",
      },
      {
        label: "Energy delivered",
        value: f(sum(7)) + " kWh",
        note: "Total energy across selected sites",
      },
      {
        label: "Average uptime",
        value: rows.length ? f(avg(15)) + "%" : "—",
        note: "Unweighted site average",
      },
    ];
  if (kind === "chargerPerformance")
    return [
      {
        label: "Total chargers",
        value: f(unique(2)),
        note: "Unique EVSEs in this selection",
      },
      {
        label: "Connectors",
        value: f(rows.length),
        note: "Connector ports in this selection",
      },
      {
        label: "Total sessions",
        value: f(sum(9)),
        note: "Sessions across selected connectors",
      },
      {
        label: "Average uptime",
        value: rows.length ? f(avg(16)) + "%" : "—",
        note: "Unweighted connector average",
      },
    ];
  if (kind === "energyDemand")
    return [
      {
        label: "Total intervals",
        value: f(rows.length),
        note: "Intervals in this selection",
      },
      {
        label: "Energy delivered",
        value: f(sum(7)) + " kWh",
        note: "Total interval energy",
      },
      {
        label: "Average demand",
        value: rows.length ? f(avg(9)) + " kW" : "—",
        note: "Mean interval demand",
      },
      {
        label: "Peak demand",
        value: rows.length
          ? f(Math.max(...rows.map((row) => num(row[8])))) + " kW"
          : "—",
        note: "Highest demand in this selection",
      },
    ];
  if (kind === "tenantUptime")
    return [
      {
        label: "Average uptime",
        value: rows.length ? f(avg(5)) + "%" : "—",
        note: "Unweighted connector average",
      },
      {
        label: "Downtime events",
        value: f(sum(7)),
        note: "Events across selected connectors",
      },
      {
        label: "Below SLA",
        value: f(rows.filter((row) => /below/i.test(row[9])).length),
        note: "Connectors below their SLA",
      },
      {
        label: "Connectors",
        value: f(rows.length),
        note: `Across ${f(unique(0))} sites`,
      },
    ];
  if (kind === "revenueTransaction")
    return [
      {
        label: "Transactions",
        value: f(rows.length),
        note: "Transactions in this selection",
      },
      {
        label: "Gross revenue",
        value: "$" + f(sum(13)),
        note: "Before fees and taxes",
      },
      {
        label: "Net revenue",
        value: "$" + f(sum(14)),
        note: "After fees and taxes",
      },
      {
        label: "Processing & platform fees",
        value: "$" + f(sum(10) + sum(11)),
        note: `Across ${f(unique(0))} sites`,
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
        value: f(sum(15)) + " kWh",
        note: "Sum of interval energy",
      },
      {
        label: "Average power",
        value: rows.length
          ? f(
              rows.reduce((a, r) => a + num(r[17]) * duration(r[18]), 0) /
                (rows.reduce((a, r) => a + duration(r[18]), 0) || 1),
            ) + " kW"
          : "—",
        note: "Weighted by interval duration",
      },
      {
        label: "Peak power",
        value: rows.length
          ? f(Math.max(...rows.map((r) => num(r[16])))) + " kW"
          : "—",
        note: `${rows.length ? f((rows.filter((r) => num(r[17]) === 0).length / rows.length) * 100) : 0}% idle intervals`,
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
        value: f(sum(10)),
        note: "Total connector event count",
      },
      {
        label: "Below SLA",
        value: f(rows.filter((r) => num(r[15]) < 95).length),
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
      value: f(rows.filter((r) => /open|active|ongoing/i.test(r[14])).length),
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
