"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { num, isoDate } from "@/lib/eves/report-config";
import type { ReportKind } from "@/lib/eves/types";
export function ReportChart({
  kind,
  rows,
}: {
  kind: ReportKind;
  rows: string[][];
}) {
  if (!rows.length || kind === "throughput" || kind === "events") return null;
  const uptimeChart =
    kind === "uptime" ||
    kind === "sitePerformance" ||
    kind === "chargerPerformance" ||
    kind === "tenantUptime";
  const grouped = new Map<string, { value: number; count: number }>();
  for (const row of rows) {
    const key =
      kind === "revenueTransaction"
        ? isoDate(row[5])
        : kind === "tenantUptime"
        ? `${row[2]} / ${row[3]}`
        : kind === "energyDemand"
        ? row[5]
        : kind === "chargerPerformance"
        ? `${row[2]} / ${row[6]}`
        : kind === "chargingPerformance"
        ? isoDate(row[6])
        : kind === "sessions"
        ? isoDate(row[10], "dmy")
        : kind === "intervals"
          ? row[10]
          : row[0];
    const value = num(
      row[
        kind === "revenueTransaction"
          ? 14
          : kind === "tenantUptime"
          ? 5
          : kind === "energyDemand"
          ? 9
          : kind === "chargerPerformance"
          ? 16
          : kind === "chargingPerformance"
          ? 9
          : kind === "sessions"
            ? 19
            : kind === "intervals"
              ? 15
              : 13
      ],
    );
    const old = grouped.get(key) ?? { value: 0, count: 0 };
    grouped.set(key, { value: old.value + value, count: old.count + 1 });
  }
  const data = [...grouped]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, v]) => ({
      label:
        kind === "revenueTransaction"
          ? label.slice(5)
          : kind === "energyDemand"
          ? `${label.slice(5, 10)} ${label.slice(11, 16)}`
          : kind === "sessions" || kind === "chargingPerformance"
          ? label.slice(5)
          : label,
      value: Number(
        (
          kind === "sessions" ||
          kind === "chargingPerformance" ||
          kind === "revenueTransaction"
            ? v.value
            : v.value / v.count
        ).toFixed(2),
      ),
    }));
  const unit = uptimeChart
    ? "%"
    : kind === "revenueTransaction"
      ? "$"
      : kind === "intervals" || kind === "energyDemand"
      ? "kW"
      : "kWh";
  return (
    <div className="chart-box">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-sm font-semibold">
          {kind === "sessions" || kind === "chargingPerformance"
            ? "Energy delivered over time"
            : kind === "revenueTransaction"
              ? "Net revenue over time"
            : kind === "energyDemand"
              ? "Average demand by interval"
              : kind === "intervals"
              ? "Average power by interval"
              : kind === "chargerPerformance" || kind === "tenantUptime"
                ? "Average uptime by connector"
              : "Average uptime by site"}
        </h2>
        <span className="text-xs text-muted-foreground">
          {uptimeChart ? "SLA threshold: 95%" : "Reference snapshot"}
        </span>
      </div>
      <ChartContainer
        config={{ value: { label: unit, color: "var(--chart-1)" } }}
        className="h-[185px] w-full aspect-auto"
      >
        {uptimeChart ? (
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 5, left: 0, right: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => String(v).split(" ").slice(0, 2).join(" ")}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={35}
            />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <ReferenceLine y={95} stroke="var(--chart-4)" strokeDasharray="4 4" />
            <Bar
              dataKey="value"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={65}
            />
          </BarChart>
        ) : (
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ top: 5, left: 0, right: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`fill-${kind}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              minTickGap={25}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={40}
            />
            <Tooltip
              formatter={(value) =>
                kind === "revenueTransaction"
                  ? `$${value}`
                  : `${value} ${unit}`
              }
              contentStyle={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill={`url(#fill-${kind})`}
            />
          </AreaChart>
        )}
      </ChartContainer>
    </div>
  );
}
