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
  PageHeading,
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
import datasets from "@/lib/eves/reference-data.json";
import { toast } from "sonner";
import styles from "./report-page.module.css";
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
  const data = datasets[kind] as ReportDataset;
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
        <PageHeading
          eyebrow="MASTER REPORTS"
          title={config.title}
          description={config.description}
        >
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
        </PageHeading>
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
                        {i === 17 && kind === "sessions" ? (
                          <span
                            className={`status ${row[i] === "Yes" ? "error" : ""}`}
                          >
                            {row[i] === "Yes" ? "Errored" : "No errors"}
                          </span>
                        ) : kind === "uptime" && i === 13 ? (
                          <span
                            className={`status ${num(row[i]) < 95 ? "error" : ""}`}
                          >
                            {row[i]}
                          </span>
                        ) : kind === "events" && i === 11 ? (
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
