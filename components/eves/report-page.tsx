"use client";
import { useState, useMemo } from "react";
import {
  Download,
  ChevronDown,
  ArrowDownUp,
  ArrowUpRight,
  Activity,
  Zap,
  Clock3,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  PageActions,
  Metric,
  SearchInput,
  DataEmpty,
  TablePagination,
} from "./shared";
import { ColumnVisibilityControl } from "./column-visibility-control";
import { ReportChart } from "./report-chart";
import { ReportFilterControl } from "./report-filter-control";
import {
  reportConfig,
  emptyFilters,
  filterRows,
  metricsFor,
  num,
  timestampKey,
  type ReportFilters,
} from "@/lib/eves/report-config";
import type { ReportDataset, ReportKind } from "@/lib/eves/types";
import { downloadCsv } from "@/lib/eves/export";
import { downloadExcel } from "@/lib/eves/xlsx";
import datasets from "@/data/reference-reports.json";
import chargingPerformanceRows from "@/data/charging-performance.json";
import sitePerformanceRows from "@/data/site-performance.json";
import chargerPerformanceRows from "@/data/charger-performance.json";
import energyDemandRows from "@/data/energy-demand.json";
import tenantUptimeRows from "@/data/uptime-reliability.json";
import revenueTransactionRows from "@/data/revenue-transaction.json";
import { useDataSource } from "@/lib/eves/data-source";
import { toast } from "sonner";
import styles from "./report-page.module.css";

const referenceDatasets = Object.fromEntries(
  Object.entries(datasets).map(([kind, dataset]) => [
    kind,
    {
      headers: dataset.headers,
      rows: dataset.rows.map((row) =>
        row.map((value) =>
          typeof value === "boolean"
            ? value
              ? "Yes"
              : "No"
            : String(value ?? "—"),
        ),
      ),
    },
  ]),
) as Record<string, ReportDataset>;

const chargingPerformanceFields = [
  ["site_name", "Site name"],
  ["site_id", "Site ID"],
  ["evse_id", "EVSE ID"],
  ["port_id", "Port ID"],
  ["connector_type", "Connector type"],
  ["session_id", "Session ID"],
  ["session_start_datetime", "Session start"],
  ["session_end_datetime", "Session end"],
  ["session_duration", "Session duration"],
  ["energy_consumed_kwh", "Energy consumed (kWh)"],
  ["peak_demand_kw", "Peak demand (kW)"],
  ["average_demand_kw", "Average demand (kW)"],
  ["vehicle_type", "Vehicle type"],
  ["payment_method", "Payment method"],
  ["is_errored", "Error status"],
  ["error_type", "Error type"],
  ["total_transaction_amount", "Transaction amount"],
] as const;

const chargingPerformanceData: ReportDataset = {
  headers: chargingPerformanceFields.map(([, label]) => label),
  rows: chargingPerformanceRows.map((record) =>
    chargingPerformanceFields.map(([field]) => {
      const value = record[field as keyof typeof record];
      if (field === "is_errored") return value ? "Yes" : "No";
      return value === null ? "—" : String(value);
    }),
  ),
};

const sitePerformanceFields = [
  ["site_name", "Site name"],
  ["site_id", "Site ID"],
  ["city", "City"],
  ["state", "State"],
  ["evse_count", "EVSE count"],
  ["port_count", "Port count"],
  ["total_sessions", "Total sessions"],
  ["energy_delivered_kwh", "Energy delivered (kWh)"],
  ["average_energy_per_session_kwh", "Average energy/session (kWh)"],
  ["average_session_duration", "Average session duration"],
  ["peak_demand_kw", "Peak demand (kW)"],
  ["average_demand_kw", "Average demand (kW)"],
  ["utilization_percent", "Utilization (%)"],
  ["uptime_percent", "Uptime (%)"],
  ["total_revenue", "Total revenue"],
  ["total_transaction_amount", "Transaction amount"],
] as const;

const sitePerformanceData: ReportDataset = {
  headers: sitePerformanceFields.map(([, label]) => label),
  rows: sitePerformanceRows.map((record) =>
    sitePerformanceFields.map(([field]) =>
      String(record[field as keyof typeof record]),
    ),
  ),
};

const chargerPerformanceFields = [
  ["site_name", "Site name"],
  ["site_id", "Site ID"],
  ["evse_id", "EVSE ID"],
  ["evse_manufacturer", "EVSE manufacturer"],
  ["evse_model", "EVSE model"],
  ["evse_maximum_power_kw", "EVSE maximum power (kW)"],
  ["port_id", "Port ID"],
  ["connector_type", "Connector type"],
  ["port_maximum_power_kw", "Port maximum power (kW)"],
  ["total_sessions", "Total sessions"],
  ["energy_delivered_kwh", "Energy delivered (kWh)"],
  ["average_energy_per_session_kwh", "Average energy/session (kWh)"],
  ["average_session_duration", "Average session duration"],
  ["peak_demand_kw", "Peak demand (kW)"],
  ["average_demand_kw", "Average demand (kW)"],
  ["utilization_percent", "Utilization (%)"],
  ["uptime_percent", "Uptime (%)"],
  ["downtime_events", "Downtime events"],
  ["total_revenue", "Total revenue"],
] as const;

const chargerPerformanceData: ReportDataset = {
  headers: chargerPerformanceFields.map(([, label]) => label),
  rows: chargerPerformanceRows.map((record) =>
    chargerPerformanceFields.map(([field]) =>
      String(record[field as keyof typeof record]),
    ),
  ),
};

const energyDemandFields = [
  ["site_name", "Site name"],
  ["site_id", "Site ID"],
  ["evse_id", "EVSE ID"],
  ["port_id", "Port ID"],
  ["interval_id", "Interval ID"],
  ["interval_start_datetime", "Interval start"],
  ["interval_end_datetime", "Interval end"],
  ["energy_delivered_kwh", "Energy delivered (kWh)"],
  ["peak_demand_kw", "Peak demand (kW)"],
  ["average_demand_kw", "Average demand (kW)"],
  ["interval_duration", "Interval duration"],
  ["utilization_percent", "Utilization (%)"],
] as const;

const energyDemandData: ReportDataset = {
  headers: energyDemandFields.map(([, label]) => label),
  rows: energyDemandRows.map((record) =>
    energyDemandFields.map(([field]) =>
      String(record[field as keyof typeof record]),
    ),
  ),
};

const tenantUptimeFields = [
  ["site_name", "Site name"],
  ["site_id", "Site ID"],
  ["evse_id", "EVSE ID"],
  ["port_id", "Port ID"],
  ["port_maximum_power_kw", "Port maximum power (kW)"],
  ["uptime_percent", "Uptime (%)"],
  ["total_downtime_duration", "Total downtime duration"],
  ["downtime_event_count", "Downtime event count"],
  ["most_common_downtime_reason", "Most common downtime reason"],
  ["sla_status", "SLA status"],
] as const;

const tenantUptimeData: ReportDataset = {
  headers: tenantUptimeFields.map(([, label]) => label),
  rows: tenantUptimeRows.map((record) =>
    tenantUptimeFields.map(([field]) =>
      String(record[field as keyof typeof record]),
    ),
  ),
};

const revenueTransactionFields = [
  ["site_name", "Site name"],
  ["site_id", "Site ID"],
  ["evse_id", "EVSE ID"],
  ["port_id", "Port ID"],
  ["session_id", "Session ID"],
  ["session_start_datetime", "Session start"],
  ["session_end_datetime", "Session end"],
  ["energy_delivered_kwh", "Energy delivered (kWh)"],
  ["total_transaction_amount", "Transaction amount"],
  ["payment_method", "Payment method"],
  ["payment_processing_fee", "Processing fee"],
  ["platform_fee", "Platform fee"],
  ["tax", "Tax"],
  ["gross_revenue", "Gross revenue"],
  ["net_revenue", "Net revenue"],
  ["cpo_revenue", "CPO revenue"],
  ["site_owner_revenue", "Site owner revenue"],
  ["transaction_status", "Transaction status"],
] as const;

const revenueTransactionData: ReportDataset = {
  headers: revenueTransactionFields.map(([, label]) => label),
  rows: revenueTransactionRows.map((record) =>
    revenueTransactionFields.map(([field]) =>
      String(record[field as keyof typeof record]),
    ),
  ),
};

export function ReportPage({ kind: initialKind }: { kind: ReportKind }) {
  const [view, setView] = useState("summary");
  const kind =
    initialKind === "uptime" && view === "events" ? "events" : initialKind;
  return (
    <ReportView
      key={kind}
      kind={kind}
      view={view}
      setView={setView}
      showTabs={initialKind === "uptime"}
    />
  );
}
function ReportView({
  kind,
  view,
  setView,
  showTabs,
}: {
  kind: ReportKind;
  view: string;
  setView: (v: string) => void;
  showTabs: boolean;
}) {
  const { source } = useDataSource();
  const snapshot =
    kind === "chargingPerformance"
      ? chargingPerformanceData
      : kind === "sitePerformance"
        ? sitePerformanceData
        : kind === "chargerPerformance"
          ? chargerPerformanceData
          : kind === "energyDemand"
            ? energyDemandData
            : kind === "tenantUptime"
              ? tenantUptimeData
              : kind === "revenueTransaction"
                ? revenueTransactionData
              : referenceDatasets[kind];
  const data = useMemo(
    () =>
      source === "sample"
        ? snapshot
        : { headers: snapshot.headers, rows: [] },
    [source, snapshot],
  );
  const config = reportConfig[kind];
  const [applied, setApplied] = useState<ReportFilters>(emptyFilters),
    [search, setSearch] = useState(""),
    [columns, setColumns] = useState<number[]>(() =>
      data.headers.map((_, index) => index),
    ),
    [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [sort, setSort] = useState<{ column: number; asc: boolean } | null>(null),
    [detail, setDetail] = useState<string[] | null>(null);
  const rows = useMemo(() => {
    const filtered = filterRows(data, config, applied, search);
    if (sort)
      filtered.sort((a, b) => {
        let result = 0;
        if (config.numeric.includes(sort.column))
          result = num(a[sort.column]) - num(b[sort.column]);
        else if (sort.column === config.dateColumn)
          result = timestampKey(a[sort.column], config.dateStyle).localeCompare(
            timestampKey(b[sort.column], config.dateStyle),
          );
        else
          result = a[sort.column].localeCompare(b[sort.column], undefined, {
            numeric: true,
          });
        return result * (sort.asc ? 1 : -1);
      });
    return filtered;
  }, [data, config, applied, search, sort]);
  const stats = metricsFor(kind, rows);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  function apply(filters: ReportFilters) {
    setApplied(filters);
    setPage(1);
  }
  function reset() {
    apply(emptyFilters);
  }
  function exportReport(format: "csv" | "xlsx") {
    const d = { headers: data.headers, rows };
    if (format === "csv") downloadCsv(d, `eves-${kind}-reference`);
    else
      downloadExcel(
        [{ name: config.short, data: d }],
        `eves-${kind}-reference`,
      );
    toast.success(`${rows.length} reference records exported`);
  }
  return (
    <>
      <div className={styles.header}>
        <PageActions>
          <ReportFilterControl
            kind={kind}
            config={config}
            data={data}
            applied={applied}
            onApply={apply}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={!rows.length}>
                <Download size={15} />
                Export report
                <ChevronDown size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                Export all {rows.length} matching rows
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => exportReport("csv")}>
                CSV spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportReport("xlsx")}>
                Excel workbook (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PageActions>
      </div>
      <div className="metrics report-metrics">
        {stats.map((s, i) => (
          <Metric
            key={s.label}
            {...s}
            icon={[Activity, Zap, Clock3, Building2][i]}
          />
        ))}
      </div>
      {showTabs && (
        <div className="panel-tabs mb-5 rounded-lg border">
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="events">Event details</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      <ReportChart kind={kind} rows={rows} />
      <section className="panel">
        <div className="table-toolbar">
          <div className="toolbar-left">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder={`Search ${config.short.toLowerCase()}…`}
            />
          </div>
          <div className="toolbar-right">
            <ColumnVisibilityControl
              labels={data.headers}
              columns={columns}
              onChange={setColumns}
              compactColumns={config.defaultColumns}
            />
          </div>
        </div>
        {rows.length ? (
          <Table className="eves-table report-table">
            <TableHeader>
              <TableRow>
                {columns.map((i) => (
                  <TableHead
                    key={i}
                    aria-sort={
                      sort?.column === i
                        ? sort.asc
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      onClick={() =>
                        setSort((p) => ({
                          column: i,
                          asc: p?.column === i ? !p.asc : true,
                        }))
                      }
                    >
                      {data.headers[i]}
                      <ArrowDownUp size={11} />
                    </button>
                  </TableHead>
                ))}
                <TableHead>
                  <span className="sr-only">Details</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows
                .slice((current - 1) * size, current * size)
                .map((row, n) => (
                  <TableRow key={row.join("|") + "|" + n}>
                    {columns.map((i) => (
                      <TableCell
                        key={i}
                        className={
                          config.numeric.includes(i)
                            ? "tabular-nums text-right"
                            : ""
                        }
                      >
                        {(kind === "sessions" && i === 19) ||
                        (kind === "chargingPerformance" && i === 14) ? (
                          <span
                            className={`status ${row[i] === "Yes" ? "error" : ""}`}
                          >
                            {row[i] === "Yes" ? "Errored" : "No errors"}
                          </span>
                        ) : (kind === "uptime" && i === 15) ||
                          (kind === "sitePerformance" && i === 13) ||
                          (kind === "chargerPerformance" && i === 16) ||
                          (kind === "tenantUptime" && i === 5) ? (
                          <span
                            className={`status ${num(row[i]) < 95 ? "error" : ""}`}
                          >
                            {row[i]}
                          </span>
                        ) : kind === "tenantUptime" && i === 9 ? (
                          <span
                            className={`status ${/below/i.test(row[i]) ? "error" : ""}`}
                          >
                            {row[i]}
                          </span>
                        ) : kind === "events" && i === 14 ? (
                          <span
                            className={`status ${/open|active|ongoing/i.test(row[i]) ? "error" : ""}`}
                          >
                            {row[i]}
                          </span>
                        ) : (
                          row[i]
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7"
                        onClick={() => setDetail(row)}
                        aria-label={`View record ${row[0]}`}
                      >
                        <ArrowUpRight size={15} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <DataEmpty>
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          </DataEmpty>
        )}
        <TablePagination
          total={rows.length}
          page={current}
          size={size}
          setPage={setPage}
          setSize={setSize}
        />
      </section>
      <Sheet
        open={!!detail}
        onOpenChange={(v) => {
          if (!v) setDetail(null);
        }}
      >
        <SheetContent className="sm:max-w-[580px] w-full overflow-auto p-7">
          <SheetHeader className="p-0 mb-8">
            <SheetTitle>Record details</SheetTitle>
            <SheetDescription>
              All available fields · reference data
            </SheetDescription>
          </SheetHeader>
          <dl className="detail-grid">
            {detail &&
              data.headers.map((h, i) => (
                <div key={i}>
                  <dt>{h}</dt>
                  <dd>{detail[i] || "—"}</dd>
                </div>
              ))}
          </dl>
        </SheetContent>
      </Sheet>
    </>
  );
}
