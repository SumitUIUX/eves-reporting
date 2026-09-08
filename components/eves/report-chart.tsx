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
  const grouped = new Map<string, { value: number; count: number }>();
  for (const row of rows) {
    const key =
      kind === "sessions"
        ? isoDate(row[10], "dmy")
        : kind === "intervals"
          ? row[10]
          : row[0];
    const value = num(
      row[kind === "sessions" ? 19 : kind === "intervals" ? 15 : 13],
    );
    const old = grouped.get(key) ?? { value: 0, count: 0 };
    grouped.set(key, { value: old.value + value, count: old.count + 1 });
  }
  const data = [...grouped]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, v]) => ({
      label: kind === "sessions" ? label.slice(5) : label,
      value: Number(
        (kind === "sessions" ? v.value : v.value / v.count).toFixed(2),
      ),
    }));
  const unit = kind === "uptime" ? "%" : kind === "intervals" ? "kW" : "kWh";
  return (
    <div className="chart-box">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-sm font-semibold">
          {kind === "sessions"
            ? "Energy delivered over time"
            : kind === "intervals"
              ? "Average power by interval"
              : "Average uptime by site"}
        </h2>
        <span className="text-xs text-muted-foreground">
          {kind === "uptime" ? "SLA threshold: 95%" : "Reference snapshot"}
        </span>
      </div>
      <ChartContainer
        config={{ value: { label: unit, color: "#6259d9" } }}
        className="h-[185px] w-full aspect-auto"
      >
        {kind === "uptime" ? (
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 5, left: 0, right: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#eef0f5" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#959bad" }}
              tickFormatter={(v) => String(v).split(" ").slice(0, 2).join(" ")}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#959bad" }}
              width={35}
            />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                border: "1px solid #e7e9f0",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <ReferenceLine y={95} stroke="#c9a569" strokeDasharray="4 4" />
            <Bar
              dataKey="value"
              fill="#938be7"
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
                <stop offset="0%" stopColor="#7770df" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#7770df" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eef0f5" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#959bad" }}
              minTickGap={25}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#959bad" }}
              width={40}
            />
            <Tooltip
              formatter={(value) => `${value} ${unit}`}
              contentStyle={{
                border: "1px solid #e7e9f0",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7468d9"
              strokeWidth={2}
              fill={`url(#fill-${kind})`}
            />
          </AreaChart>
        )}
      </ChartContainer>
    </div>
  );
}
