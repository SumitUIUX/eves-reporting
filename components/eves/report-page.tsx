"use client";
import { useState, useMemo } from "react";
import {
  Download,
  SlidersHorizontal,
  ChevronDown,
  ArrowDownUp,
  Columns3,
  ArrowUpRight,
  Activity,
  Zap,
  Clock3,
  Building2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PageHeading,
  Metric,
  Choice,
  SearchInput,
  DataEmpty,
  TablePagination,
  ReferenceNote,
} from "./shared";
import { ReportChart } from "./report-chart";
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
  const [draft, setDraft] = useState<ReportFilters>(emptyFilters),
    [applied, setApplied] = useState<ReportFilters>(emptyFilters),
    [search, setSearch] = useState(""),
    [columns, setColumns] = useState(config.defaultColumns),
    [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [sort, setSort] = useState<{ column: number; asc: boolean } | null>(null),
    [filterOpen, setFilterOpen] = useState(false),
    [mobileFilter, setMobileFilter] = useState(false),
    [error, setError] = useState(""),
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
  const activeCount =
    Object.values(applied.values).filter((v) => v !== "all").length +
    Number(!!applied.from) +
    Number(!!applied.to) +
    Number(applied.errors);
  function apply() {
    if (draft.from && draft.to && draft.from > draft.to) {
      setError("The end date must be on or after the start date.");
      return;
    }
    setError("");
    setApplied(draft);
    setPage(1);
    setMobileFilter(false);
  }
  function reset() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
    setError("");
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
  const filters = (
    <>
      <div className="filter-grid">
        {config.filters.map((f) => (
          <div className="form-field" key={f.column}>
            <label htmlFor={`filter-${f.column}`}>{f.label}</label>
            <Choice
              id={`filter-${f.column}`}
              label={f.label}
              value={draft.values[f.column] ?? "all"}
              onChange={(v) =>
                setDraft((p) => ({
                  ...p,
                  values: { ...p.values, [f.column]: v },
                }))
              }
              options={[
                {
                  value: "all",
                  label: `All ${f.label.toLowerCase()}${f.label.endsWith("s") ? "" : "s"}`,
                },
                ...[...new Set(data.rows.map((r) => r[f.column]))]
                  .filter((v) => v && v !== "-" && v !== "—")
                  .sort(),
              ]}
              className="w-full"
            />
          </div>
        ))}
        {config.dateColumn !== undefined && (
          <>
            <div className="form-field">
              <label htmlFor="date-from">From date</label>
              <Input
                id="date-from"
                type="date"
                value={draft.from}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, from: e.target.value }))
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="date-to">To date</label>
              <Input
                id="date-to"
                type="date"
                value={draft.to}
                min={draft.from || undefined}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, to: e.target.value }))
                }
              />
            </div>
          </>
        )}
        {kind === "sessions" && (
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={draft.errors}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, errors: v }))}
              aria-label="Only sessions with errors"
            />
            Only sessions with errors
          </label>
        )}
      </div>
      {error && (
        <p className="form-error mx-5 mb-4" role="alert">
          {error}
        </p>
      )}
      <div className="filter-actions">
        <Button variant="outline" onClick={reset}>
          <RotateCcw size={14} />
          Reset filters
        </Button>
        <Button onClick={apply}>Apply filters</Button>
      </div>
    </>
  );
  return (
    <>
      <PageHeading
        eyebrow="MASTER REPORTS"
        title={config.title}
        description={config.description}
      >
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
      <Collapsible
        open={filterOpen}
        onOpenChange={setFilterOpen}
        className="panel desktop-filter mb-6"
      >
        <div className="panel-header">
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={17} className="text-muted-foreground" />
            <h2 className="text-sm!">Report filters</h2>
            {activeCount > 0 && (
              <span className="filter-pill">{activeCount} applied</span>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="h-7! text-muted-foreground">
              {filterOpen ? "Hide filters" : "Refine report"}
              <ChevronDown
                size={14}
                className={filterOpen ? "rotate-180" : ""}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>{filters}</CollapsibleContent>
      </Collapsible>
      <Button
        variant="outline"
        className="mobile-filter-trigger mb-5"
        onClick={() => setMobileFilter(true)}
      >
        <SlidersHorizontal size={16} />
        Filters {activeCount > 0 ? `(${activeCount})` : ""}
      </Button>
      <Sheet open={mobileFilter} onOpenChange={setMobileFilter}>
        <SheetContent className="p-6 overflow-auto">
          <SheetHeader className="p-0 mb-5">
            <SheetTitle>Report filters</SheetTitle>
            <SheetDescription>
              Choose a scope, then apply your filters.
            </SheetDescription>
          </SheetHeader>
          {mobileFilter && filters}
        </SheetContent>
      </Sheet>
      <div className="metrics report-metrics">
        {stats.map((s, i) => (
          <Metric
            key={s.label}
            {...s}
            icon={[Activity, Zap, Clock3, Building2][i]}
            accent={i === 0}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Columns3 size={15} />
                  Columns<span className="count-pill">{columns.length}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-[60vh] overflow-auto w-64"
              >
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => setColumns(config.defaultColumns)}
                >
                  Restore default columns
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setColumns(data.headers.map((_, i) => i))}
                >
                  Show all columns
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {data.headers.map((h, i) => (
                  <DropdownMenuCheckboxItem
                    key={i}
                    checked={columns.includes(i)}
                    disabled={columns.length === 1 && columns[0] === i}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(v) =>
                      setColumns((prev) =>
                        v
                          ? [...prev, i].sort((a, b) => a - b)
                          : prev.filter((c) => c !== i),
                      )
                    }
                  >
                    {h}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
      <ReferenceNote>
        {kind === "intervals"
          ? "Reference snapshot from the original dashboard. Energy is labeled kWh; the original column was labeled kW. Values are preserved."
          : kind === "throughput"
            ? "Infrastructure performance is a fixed Sep 1–7, 2026 snapshot. Zero values are preserved from the source."
            : "Reference snapshot from the original dashboard. Filters, charts, and metrics use only the records in this snapshot."}
      </ReferenceNote>
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
