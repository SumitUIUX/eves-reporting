"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  Clock3,
  DollarSign,
  Gauge,
  PlugZap,
  RefreshCw,
  RotateCcw,
  Server,
  TrendingDown,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DataEmpty, DataError } from "@/components/eves/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  loadExecutiveDashboard,
  type DashboardMetric,
  type DashboardSite,
  type ExecutiveDashboardData,
} from "@/lib/eves/dashboard-data";
import { useDataSource } from "@/lib/eves/data-source";
import { useTenant } from "@/components/eves/tenant-context";
import { FilterPanel } from "./filter-panel";
import { DateRangeFilter } from "./report-filter-drawer";
import { ReportEntitySelector } from "./report-entity-selector";
import { dateRangeError } from "@/lib/eves/performance-filters";
import type { ReportFilters } from "@/lib/eves/report-config";
import filterStyles from "./report-filter-control.module.css";
import type { LucideIcon } from "lucide-react";

const integer = new Intl.NumberFormat("en-US");
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type LoadState =
  | { source: string; token: number; status: "loading" }
  | {
      source: string;
      token: number;
      status: "ready";
      data: ExecutiveDashboardData;
    }
  | { source: string; token: number; status: "empty" }
  | { source: string; token: number; status: "error" };

function date(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", options).format(
    new Date(`${value}T00:00:00`),
  );
}

function Trend({ value }: { value: number }) {
  const rising = value >= 0;
  const Icon = rising ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        rising ? "text-emerald-700" : "text-destructive"
      }`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function MetricCard({
  label,
  value,
  metric,
  previous,
  icon: Icon,
}: {
  label: string;
  value: string;
  metric: DashboardMetric<number | string>;
  previous: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="gap-3 py-5 shadow-none">
      <CardHeader className="grid grid-cols-[1fr_auto] gap-3 px-5">
        <div className="space-y-2">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl tracking-tight tabular-nums">
            {value}
          </CardTitle>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-primary/8 text-primary">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 px-5 text-xs">
        <span className="text-muted-foreground">{previous}</span>
        <Trend value={metric.change_percent} />
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PanelLink({ href, label = "View report" }: { href: string; label?: string }) {
  return (
    <Button variant="ghost" size="sm" asChild className="text-primary">
      <Link href={href}>
        {label}
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </Button>
  );
}

function AttentionCard({ title, description, count, icon: Icon, href, children }: {
  title: string;
  description: string;
  count: number;
  icon: LucideIcon;
  href?: string;
  children: ReactNode;
}) {
  const badgeClass = "grid h-8 min-w-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/10 px-2 text-sm font-semibold tabular-nums text-primary";
  return (
    <Card className="h-full gap-0 overflow-hidden py-0 shadow-none">
      <div className="flex items-start gap-3 border-b bg-muted/20 px-5 py-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/10 bg-primary/5 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base leading-6">{title}</CardTitle>
          <CardDescription className="mt-1 text-xs leading-5">{description}</CardDescription>
        </div>
        {href ? <Link href={href} className={`${badgeClass} transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`} aria-label={`${count} ${title.toLowerCase()}; view report`}>{count}</Link> : <span className={badgeClass} aria-label={`${count} ${title.toLowerCase()}`}>{count}</span>}
      </div>
      <CardContent className="flex-1 divide-y px-5">{children}</CardContent>
      {href && <div className="flex justify-start border-t bg-muted/10 px-5 py-4"><PanelLink href={href} /></div>}
    </Card>
  );
}

function SiteRow({
  site,
  rank,
}: {
  site: DashboardSite;
  rank: number;
}) {
  return (
    <div className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-3">
      <span className="grid size-7 place-items-center rounded-full bg-primary/8 text-xs font-semibold text-primary">
        {rank}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{site.site_name}</p>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={site.utilization_percent} className="h-1.5" />
          <span className="w-11 text-right text-xs tabular-nums text-muted-foreground">
            {site.utilization_percent.toFixed(1)}%
          </span>
        </div>
      </div>
      <span className="text-sm font-semibold tabular-nums">
        {currency.format(site.revenue)}
      </span>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div aria-label="Loading dashboard" role="status" className="space-y-8">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-32" />
            ))}
          </div>
        </div>
      ))}
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

function DashboardContent({
  data,
  refreshing,
  refresh,
}: {
  data: ExecutiveDashboardData;
  refreshing: boolean;
  refresh: () => void;
}) {
  const defaults: ReportFilters = { values: {}, from: data.dashboard_period.start_date, to: data.dashboard_period.end_date, errors: false, preset: "custom" };
  const [applied, setApplied] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const selectedSites = Array.isArray(applied.values.site) ? applied.values.site : [];
  const fullPeriod = applied.from === defaults.from && applied.to === defaults.to;
  const scoped = selectedSites.length > 0 || !fullPeriod;
  const sites = [...new Set([
    ...data.business.top_performing_sites.map(s => s.site_name),
    ...data.business.underperforming_sites.map(s => s.site_name),
    ...data.alerts_attention_required.chargers_below_sla.chargers.map(s => s.site_name),
    ...data.alerts_attention_required.sites_with_declining_utilization.sites.map(s => s.site_name),
    ...data.alerts_attention_required.high_downtime.events.map(s => s.site_name),
  ])].sort();
  const matchingSites = [...data.business.top_performing_sites, ...data.business.underperforming_sites].filter(site => !selectedSites.length || selectedSites.includes(site.site_name));
  const scopedRevenue = data.business.revenue_trend.filter(point => point.date >= applied.from && point.date <= applied.to);
  const { active } = useTenant();
  const reportEnabled = (reportId: string) =>
    !!active.components["Reports/Analytics"] && !!active.reports[reportId];
  const { charging, infrastructure, business, alerts_attention_required: alerts } =
    data;
  const topSites = useMemo(
    () =>
      [...business.top_performing_sites]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    [business.top_performing_sites],
  );
  const underperforming = useMemo(
    () =>
      [...business.underperforming_sites].sort(
        (a, b) => a.utilization_percent - b.utilization_percent,
      ),
    [business.underperforming_sites],
  );
  const trend = useMemo(
    () =>
      business.revenue_trend.map((point) => ({
        ...point,
        label: date(point.date, { month: "short", day: "numeric" }),
      })),
    [business.revenue_trend],
  );

  return (
    <div className="space-y-9">
      <header className="flex justify-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <FilterPanel title="Report filters" open={filtersOpen} onOpenChange={open => { if (open) setDraft(applied); setFiltersOpen(open); }} activeCount={Number(selectedSites.length > 0) + Number(!fullPeriod)}>
            <form className={filterStyles.form} onSubmit={event => { event.preventDefault(); if (dateRangeError(draft)) return; setApplied(draft); setFiltersOpen(false); }}>
              <div className={filterStyles.fields}>
                <div className={filterStyles.field}>
                  <label htmlFor="executive-site">Site</label>
                  <ReportEntitySelector id="executive-site" label="Site" options={sites} selected={Array.isArray(draft.values.site) ? draft.values.site : []} onChange={site => setDraft(v => ({ ...v, values: { site } }))} />
                </div>
                <DateRangeFilter value={draft} onChange={setDraft} />
                <p className="col-span-full text-xs text-muted-foreground">Available snapshot: {defaults.from} – {defaults.to}. Site summaries cover this full period. Only network revenue has daily records; scoped network KPIs are unavailable.</p>
              </div>
              <div className={filterStyles.footer}>
                <Button type="button" variant="ghost" onClick={() => { setDraft(defaults); setApplied(defaults); }}><RotateCcw size={14} />Reset filters</Button>
                <Button type="submit" disabled={!!dateRangeError(draft)}>Apply filters</Button>
              </div>
            </form>
          </FilterPanel>
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </header>

      {scoped ? <div className="space-y-4">
        <p role="status" className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">{selectedSites.length ? selectedSites.join(", ") : "All sites"} · Network KPIs and comparisons are unavailable for this scope in the current aggregate snapshot.</p>
        {fullPeriod && matchingSites.length > 0 && <Card className="shadow-none"><CardHeader><CardTitle>Selected site summaries</CardTitle><CardDescription>Available site records for the full snapshot period</CardDescription></CardHeader><CardContent>{matchingSites.map((site, index) => <SiteRow key={site.site_id} site={site} rank={index + 1} />)}</CardContent></Card>}
        {!selectedSites.length && scopedRevenue.length > 0 && <Card className="shadow-none"><CardHeader><CardTitle>Revenue</CardTitle><CardDescription>All sites · Selected date range</CardDescription></CardHeader><CardContent><ChartContainer config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }} className="h-64 w-full"><AreaChart data={scopedRevenue}><CartesianGrid vertical={false} /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={value => currency.format(Number(value))} /><Area dataKey="revenue" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} /></AreaChart></ChartContainer></CardContent></Card>}
        {((selectedSites.length > 0 && (!fullPeriod || !matchingSites.length)) || (!selectedSites.length && !scopedRevenue.length)) && <DataEmpty><p>No data available for the selected filters.</p></DataEmpty>}
      </div> : <>
      <section aria-labelledby="charging-heading" className="space-y-4">
        <div id="charging-heading">
          <SectionHeading
            title="Charging"
            description="Charging activity compared with the previous week."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Sessions"
            value={integer.format(charging.sessions.value)}
            metric={charging.sessions}
            previous={`Previous: ${integer.format(charging.sessions.previous_period_value ?? 0)}`}
            icon={BatteryCharging}
          />
          <MetricCard
            label="Energy delivered"
            value={`${decimal.format(charging.energy_delivered_kwh.value)} kWh`}
            metric={charging.energy_delivered_kwh}
            previous={`Previous: ${decimal.format(charging.energy_delivered_kwh.previous_period_value ?? 0)} kWh`}
            icon={Zap}
          />
          <MetricCard
            label="Revenue"
            value={currency.format(charging.revenue.value)}
            metric={charging.revenue}
            previous={`Previous: ${currency.format(charging.revenue.previous_period_value ?? 0)}`}
            icon={DollarSign}
          />
          <MetricCard
            label="Avg session duration"
            value={charging.average_session_duration.value}
            metric={charging.average_session_duration}
            previous={`Previous: ${charging.average_session_duration.previous_period_value ?? "—"}`}
            icon={Clock3}
          />
        </div>
      </section>

      <section aria-labelledby="infrastructure-heading" className="space-y-4">
        <div id="infrastructure-heading">
          <SectionHeading
            title="Infrastructure"
            description="Availability and use compared with the previous week."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active chargers"
            value={`${infrastructure.active_chargers.value}/${infrastructure.active_chargers.total}`}
            metric={infrastructure.active_chargers}
            previous="Active / total chargers"
            icon={Server}
          />
          <MetricCard
            label="Connector count"
            value={`${infrastructure.connector_count.value}/${infrastructure.connector_count.total}`}
            metric={infrastructure.connector_count}
            previous="Active / total connectors"
            icon={PlugZap}
          />
          <MetricCard
            label="Utilization"
            value={`${infrastructure.utilization_percent.value.toFixed(1)}%`}
            metric={infrastructure.utilization_percent}
            previous={`Previous: ${infrastructure.utilization_percent.previous_period_value?.toFixed(1) ?? "—"}%`}
            icon={Gauge}
          />
          <MetricCard
            label="Uptime"
            value={`${infrastructure.uptime_percent.value.toFixed(1)}%`}
            metric={infrastructure.uptime_percent}
            previous={`Previous: ${infrastructure.uptime_percent.previous_period_value?.toFixed(1) ?? "—"}%`}
            icon={Activity}
          />
        </div>
      </section>

      <section aria-labelledby="business-heading" className="space-y-4">
        <div id="business-heading">
          <SectionHeading
            title="Business"
            description="Revenue movement and site-level performance."
          />
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Card className="gap-4 py-5 shadow-none">
            <CardHeader className="px-5">
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <CardDescription>Daily revenue during this period</CardDescription>
              {reportEnabled("revenue-financial") && (
                <CardAction>
                  <PanelLink href="/reports/revenue-transaction" />
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="px-3 sm:px-5">
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }}
                className="h-[280px] w-full aspect-auto"
              >
                <AreaChart
                  accessibilityLayer
                  data={trend}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dashboard-revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={58}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `$${integer.format(Number(value))}`}
                  />
                  <Tooltip
                    formatter={(value) => [currency.format(Number(value)), "Revenue"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date
                        ? date(String(payload[0].payload.date), {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""
                    }
                    contentStyle={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#dashboard-revenue)"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="gap-2 py-5 shadow-none">
            <CardHeader className="px-5">
              <CardTitle className="text-base">Top performing sites</CardTitle>
              <CardDescription>Ranked by revenue</CardDescription>
              {reportEnabled("site-performance") && (
                <CardAction>
                  <PanelLink href="/reports/site-performance" />
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="divide-y px-5">
              {topSites.map((site, index) => (
                <SiteRow key={site.site_id} site={site} rank={index + 1} />
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="gap-3 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle className="text-base">Underperforming sites</CardTitle>
            <CardDescription>Sites with the lowest utilization</CardDescription>
            {reportEnabled("site-performance") && (
              <CardAction>
                <PanelLink href="/reports/site-performance" />
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="grid gap-3 px-5 md:grid-cols-2 xl:grid-cols-5">
            {underperforming.map((site) => (
              <div key={site.site_id} className="rounded-lg border bg-muted/20 p-4">
                <p className="truncate text-sm font-medium">{site.site_name}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold tabular-nums">
                      {site.utilization_percent.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Utilization</p>
                  </div>
                  <TrendingDown className="size-5 text-destructive/70" aria-hidden="true" />
                </div>
                <div className="mt-4 flex justify-between border-t pt-3 text-xs">
                  <span className="text-muted-foreground">
                    {integer.format(site.sessions)} sessions
                  </span>
                  <span className="font-medium tabular-nums">
                    {currency.format(site.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="alerts-heading" className="space-y-4">
        <div id="alerts-heading">
          <SectionHeading
            title="Alerts / Attention required"
            description="Areas that may need operational follow-up."
          />
        </div>
        <div className="grid items-stretch gap-4 xl:grid-cols-3">
          <AttentionCard title="Chargers below SLA" description={`${alerts.chargers_below_sla.sla_threshold_percent}% minimum · Last 7 days`} count={alerts.chargers_below_sla.count} icon={AlertTriangle} href={reportEnabled("tenant-uptime-reliability") ? "/reports/tenant-uptime-reliability" : undefined}>

              {alerts.chargers_below_sla.chargers.map((charger) => (
                <div key={charger.evse_id} className="space-y-2 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{charger.evse_id}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {charger.site_name}
                    </p>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium tabular-nums">
                      {charger.uptime_percent.toFixed(1)}% uptime
                    </span>
                    <div className="shrink-0 text-right text-destructive">
                      <span
                        className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums"
                        title="Percentage points below the SLA minimum"
                        aria-label={`${Math.max(0, alerts.chargers_below_sla.sla_threshold_percent - charger.uptime_percent).toFixed(1)} percentage points below the SLA minimum`}
                      >
                        <span aria-hidden="true">↓</span>
                        {Math.max(
                          0,
                          alerts.chargers_below_sla.sla_threshold_percent -
                            charger.uptime_percent,
                        ).toFixed(1)}%
                      </span>
                      <p className="mt-0.5 text-xs">Below SLA</p>
                    </div>
                  </div>
                </div>
              ))}
          </AttentionCard>

          <AttentionCard title="Declining utilization" description={"Current vs previous week"} count={alerts.sites_with_declining_utilization.count} icon={TrendingDown} href={reportEnabled("site-performance") ? "/reports/site-performance" : undefined}>

              {alerts.sites_with_declining_utilization.sites.map((site) => (
                <div key={site.site_id} className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-5">{site.site_name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {site.current_utilization_percent.toFixed(1)}% current ·{" "}
                      {site.previous_period_utilization_percent.toFixed(1)}% previous
                    </p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-destructive">
                    {site.change_percent.toFixed(1)}%
                  </span>
                </div>
              ))}
          </AttentionCard>

          <AttentionCard title="High downtime" description={"Longest downtime durations"} count={alerts.high_downtime.count} icon={Clock3} href={reportEnabled("tenant-uptime-reliability") ? "/reports/tenant-uptime-reliability" : undefined}>

              {alerts.high_downtime.events.map((event) => (
                <div key={event.evse_id} className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{event.evse_id}</p>
                    <span className="text-sm font-semibold tabular-nums text-destructive">
                      {event.downtime_duration}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.site_name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.downtime_events} events · {event.primary_reason}
                  </p>
                </div>
              ))}
          </AttentionCard>

        </div>
      </section>
      </>}
    </div>
  );
}

export function ExecutiveDashboard() {
  const { source } = useDataSource();
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<LoadState>({
    source,
    token: 0,
    status: "loading",
  });
  const current =
    state.source === source
      ? state
      : ({ source, token: refreshToken, status: "loading" } as const);
  const refreshing =
    state.source === source &&
    state.status === "ready" &&
    state.token !== refreshToken;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void loadExecutiveDashboard(source)
        .then((data) => {
          if (cancelled) return;
          setState(
            data
              ? { source, token: refreshToken, status: "ready", data }
              : { source, token: refreshToken, status: "empty" },
          );
        })
        .catch(() => {
          if (!cancelled)
            setState({ source, token: refreshToken, status: "error" });
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, refreshToken]);

  if (current.status === "loading") return <DashboardLoading />;
  if (current.status === "error")
    return (
      <DataError
        message="The executive dashboard could not be loaded. Please try again."
        retry={() => setRefreshToken((token) => token + 1)}
      />
    );
  if (current.status === "empty")
    return (
      <Card className="shadow-none">
        <DataEmpty>
          <p className="text-sm text-muted-foreground">
            Dashboard data is not available for the selected data source.
          </p>
        </DataEmpty>
      </Card>
    );
  return (
    <DashboardContent
      data={current.data}
      refreshing={refreshing}
      refresh={() => setRefreshToken((token) => token + 1)}
    />
  );
}
