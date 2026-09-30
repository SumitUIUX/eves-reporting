"use client";
import { useMemo, useState } from "react";
import {
  Download,
  RotateCcw,
  Check,
  Info,
  Mail,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Choice, DataEmpty } from "./shared";
import { ReportMultiSelect } from "./report-multi-select";
import { ReportDatePicker } from "./report-date-picker";
import { ReportEmailDialog } from "./report-email-dialog";
import { ReportingReference } from "./reporting-reference";
import {
  getReportRanges,
  evaluateReportDelivery,
  monthOptions,
  quarterOptions,
  type ReportingPeriod,
} from "@/lib/eves/report-period";
import styles from "./regulatory.module.css";
import filterStyles from "./report-filter-control.module.css";
import { FilterPanel } from "./filter-panel";
import { useTags } from "@/lib/eves/use-tags";
import { useDataSource } from "@/lib/eves/data-source";
import { resolveFundingTags } from "@/lib/eves/funding-tags";
import { reportConfig, isoDate } from "@/lib/eves/report-config";
import type { ReportDataset, ReportKind } from "@/lib/eves/types";
import datasets from "@/data/reference-reports.json";
import { createWorkbook, createZip } from "@/lib/eves/xlsx";
import { csvText, downloadBlob } from "@/lib/eves/export";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTenant } from "./tenant-context";
import { ExportHistory } from "./export-history";
import { saveExport } from "@/lib/eves/export-history";
import { unmappedFundingSites } from "@/lib/eves/funding-coverage";
import { FundingMappingAlert } from "./funding-mapping-alert";
const definitions: Record<
  string,
  { name: string; kind: ReportKind; excluded?: boolean }[]
> = {
  CIC: [
    { name: "Charging Infrastructure Deployment", kind: "throughput" },
    { name: "Charging Sessions", kind: "sessions" },
    { name: "Interval Load Profile", kind: "intervals" },
    { name: "Uptime & Reliability", kind: "uptime" },
  ],
  CEC: [
    { name: "Charger Usage & Throughput", kind: "throughput" },
    { name: "Uptime Reporting", kind: "uptime" },
    { name: "Excluded Downtime", kind: "events", excluded: true },
    { name: "Contact Information & Inventory", kind: "throughput" },
    { name: "Utilization Session", kind: "sessions" },
    { name: "Utilization Interval", kind: "intervals" },
    { name: "Reliability Downtime", kind: "events" },
    { name: "Reliability Uptime", kind: "uptime" },
    { name: "Utilization Inventory", kind: "throughput" },
  ],
  "Cal-EvIP": [
    { name: "Sites / Stations", kind: "throughput" },
    { name: "Charging Sessions", kind: "sessions" },
    { name: "Charger Interval Report", kind: "intervals" },
    { name: "Downtime Events", kind: "events" },
  ],
};
export function Regulatory() {
  const [agency, setAgency] = useState("CIC"),
    [selected, setSelected] = useState<string[]>(["Charging Sessions"]),
    [funding, setFunding] = useState<string[]>([]),
    [period, setPeriod] = useState<ReportingPeriod>("Quarter"),
    [quarters, setQuarters] = useState<string[]>(["2026-Q3"]),
    [selectedMonths, setMonths] = useState<string[]>(["2026-09"]),
    [from, setFrom] = useState("2026-09-01"),
    [to, setTo] = useState("2026-09-07"),
    [format, setFormat] = useState("xlsx"),
    [busy, setBusy] = useState(false),
    [emailOpen, setEmailOpen] = useState(false),
    [error, setError] = useState(""),
    [lastExport, setLastExport] = useState("");
  const { active, tenantView } = useTenant();
  const [tab, setTab] = useState("reports");
  const [historyRevision, setHistoryRevision] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ funding, period, quarters, selectedMonths, from, to });
  const draftPeriodOptions = draft.period === "Quarter" ? quarterOptions : monthOptions;
  const draftSelectedPeriods = draft.period === "Quarter" ? draft.quarters : draft.selectedMonths;
  const draftDelivery = evaluateReportDelivery(getReportRanges({ period: draft.period, quarters: draft.quarters, months: draft.selectedMonths, from: draft.from, to: draft.to }), draft.period);
  function applyScope(scope: typeof draft) {
    changed(() => { setFunding(scope.funding); setPeriod(scope.period); setQuarters(scope.quarters); setMonths(scope.selectedMonths); setFrom(scope.from); setTo(scope.to); });
  }
  const { source } = useDataSource();
  const tagState = useTags();
  const loading = source === "workspace" && tagState.loading;
  const { reload } = tagState;
  const { tags, error: tagError } = resolveFundingTags(
    source === "sample"
      ? { tags: [], error: "", errorCode: "TAG_STORAGE_NOT_CONFIGURED" }
      : tagState.error
        ? { tags: [], error: tagState.error, errorCode: tagState.errorCode }
        : tagState,
  );
  const reports = definitions[agency];
  const eligibleTags = tags.filter((t) => t.agency === agency);
  const ranges = useMemo(
    () =>
      getReportRanges({ period, quarters, months: selectedMonths, from, to }),
    [period, quarters, selectedMonths, from, to],
  );
  const delivery = evaluateReportDelivery(ranges, period);
  const periodOptions = period === "Quarter" ? quarterOptions : monthOptions;
  const selectedPeriods = period === "Quarter" ? quarters : selectedMonths;
  const periodLabel =
    period === "Custom range"
      ? `${from} to ${to}`
      : selectedPeriods
          .map(
            (value) =>
              periodOptions.find((option) => option.value === value)?.label ??
              value,
          )
          .join(", ");
  function changed(action: () => void) {
    action();
    setError("");
    setLastExport("");
  }
  function buildReport(report: (typeof reports)[number], ignoreFunding = false) {
    const snapshot =
      datasets[report.kind as keyof typeof datasets] as ReportDataset;
    const data =
      source === "sample" ? snapshot : { headers: snapshot.headers, rows: [] };
    const config = reportConfig[report.kind];
    const fundedSites = new Set(
      tags
        .filter((t) => funding.includes(t.id))
        .flatMap((t) => Object.keys(t.mappings)),
    );
    const rows = data.rows.filter((row) => {
      if (report.excluded && row[0] !== "Excluded") return false;
      if (funding.length && !ignoreFunding) {
        const siteIndex =
          report.kind === "sessions" || report.kind === "events" ? 1 : 0;
        const chosen = tags.filter((t) => funding.includes(t.id));
        const tagIndex =
          report.kind === "sessions"
            ? 33
            : report.kind === "intervals"
              ? 19
              : report.kind === "throughput"
                ? 31
                : report.kind === "uptime"
                  ? 16
                  : -1;
        const matchesTag =
          tagIndex >= 0 && chosen.some((t) => t.name === row[tagIndex]);
        if (!matchesTag && !fundedSites.has(row[siteIndex])) return false;
      }
      if (config.dateColumn !== undefined) {
        const date = isoDate(row[config.dateColumn], config.dateStyle);
        return ranges.some((r) => date >= r.from && date <= r.to);
      }
      return ranges.some((r) => r.from <= "2026-09-01" && r.to >= "2026-09-07");
    });
    return { name: report.name, data: { headers: data.headers, rows } };
  }
  const prepared = reports
    .filter((r) => selected.includes(r.name))
    .map(report => buildReport(report));
  const rowCount = prepared.reduce((n, s) => n + s.data.rows.length, 0);
  const historyScope = `${source}:${active.id}`;
  const canManageTags = !tenantView || (!!active.components["Reports/Analytics"] && !!active.reports["project-tagging"]);
  const affectedSites = unmappedFundingSites(reports.filter(report => selected.includes(report.name)).map(report => buildReport(report, true).data), eligibleTags);
  const deliveryLabel = !delivery.valid ? "Choose a valid period" : delivery.delivery === "email" ? "Email required · service not connected" : "Direct download";
  async function generate() {
    setError("");
    if (!selected.length) {
      setError("Select at least one report.");
      return;
    }
    if (!delivery.valid) {
      setError(delivery.error);
      return;
    }
    if (!rowCount) return;
    if (delivery.delivery === "email") {
      setEmailOpen(true);
      return;
    }
    setBusy(true);
    try {
      const manifest = {
        name: "Read me",
        data: {
          headers: ["Field", "Value"],
          rows: [
            ["Workspace", "EVES reference workspace"],
            ["Agency", agency],
            [
              "Funding scope",
              "Selected reference tag names and mapped sites. Individual charger labels cannot be matched to live device IDs.",
            ],
            ["Periods", ranges.map((r) => r.from + " to " + r.to).join("; ")],
            [
              "Data source",
              "Snapshot of original EVES reporting UI, captured September 7, 2026",
            ],
            [
              "Submission status",
              "Working export only. Not validated against agency submission templates.",
            ],
            [
              "Summary period",
              "Throughput and uptime are fixed reference summaries. Included only when the entire Sep 1–7, 2026 period is selected.",
            ],
            [
              "Contact information",
              "No contact records were available in the original interface. Inventory fields only.",
            ],
            ["Delivery", "Downloaded to this device. No email was sent."],
          ],
        },
      };
      let blob: Blob;
      let filename: string;
      const baseName = `eves-${agency.toLowerCase()}-reference`;
      if (format === "xlsx") {
        const bytes = createWorkbook([...prepared, manifest]);
        blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        filename = `${baseName}.xlsx`;
      } else if (prepared.length === 1) {
        blob = new Blob([csvText(prepared[0].data)], { type: "text/csv;charset=utf-8" });
        filename = `${baseName}-${prepared[0].name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.csv`;
      } else {
        const files: Record<string, string> = { "README.csv": csvText(manifest.data) };
        prepared.forEach(sheet => { files[sheet.name.replace(/[^a-zA-Z0-9]/g, "-") + ".csv"] = csvText(sheet.data); });
        const bytes = createZip(files);
        blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" });
        filename = `${baseName}.zip`;
      }
      downloadBlob(blob, filename);
      try {
        await saveExport({ id: crypto.randomUUID(), scope: historyScope, createdAt: new Date().toISOString(), agency, period: periodLabel, reports: prepared.map(report => report.name), records: rowCount, filename, blob, source, generatedBy: "You (this browser)" });
        setHistoryRevision(value => value + 1);
      } catch {
        toast.warning("Report downloaded, but history could not be saved. Check browser storage availability.");
      }
      setLastExport(
        `${prepared.length} ${prepared.length === 1 ? "report" : "reports"} · ${rowCount} records exported`,
      );
      toast.success("Reference report downloaded");
    } catch {
      setError("The export could not be created. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5" aria-label="Regulatory reporting workspace">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>
        <TabsContent value="reports">

      <div className="mb-6 flex justify-end">
        <FilterPanel title="Report filters" open={filtersOpen} onOpenChange={open => { if (open) setDraft({ funding, period, quarters, selectedMonths, from, to }); setFiltersOpen(open); }} activeCount={Number(funding.length > 0) + 1}>
          <form className={filterStyles.form} onSubmit={event => { event.preventDefault(); if (!draftDelivery.valid) return; applyScope(draft); setFiltersOpen(false); }}>
            <div className={filterStyles.fields}>
          <div className={filterStyles.field}>
            <label htmlFor="report-funding">Funding ID (optional)</label>
            <ReportMultiSelect
              id="report-funding"
              label="Funding IDs"
              options={eligibleTags.map((tag) => ({
                value: tag.id,
                label: tag.awardId || tag.name,
              }))}
              selected={draft.funding}
              onChange={(value) => (setDraft(v => ({ ...v, funding: value })))}
              placeholder="All funding IDs"
              searchPlaceholder="Search funding IDs…"
              disabled={loading || !!tagError}
            />
            {tagError && (
              <p className={styles.fieldError}>
                Funding tags unavailable.{" "}
                <button type="button" onClick={() => void reload()}>
                  Retry
                </button>
              </p>
            )}
          </div>
          <div className={filterStyles.field}>
            <label htmlFor="period-type">Reporting period</label>
            <Choice
              id="period-type"
              value={draft.period}
              label="Reporting period"
              options={["Quarter", "Months", "Custom range"]}
              onChange={(value) =>
                (setDraft(v => ({ ...v, period: value as ReportingPeriod })))
              }
            />
          </div>
          {draft.period === "Custom range" ? (
            <>
              <div className={filterStyles.field}>
                <label htmlFor="custom-from">Date from</label>
                <ReportDatePicker
                  id="custom-from"
                  label="Date from"
                  value={draft.from}
                  onChange={(value) => (setDraft(v => ({ ...v, from: value })))}
                />
              </div>
              <div className={filterStyles.field}>
                <label htmlFor="custom-to">Date to</label>
                <ReportDatePicker
                  id="custom-to"
                  label="Date to"
                  value={draft.to}
                  min={draft.from}
                  onChange={(value) => (setDraft(v => ({ ...v, to: value })))}
                />
              </div>
            </>
          ) : (
            <div className={filterStyles.field}>
              <label htmlFor="selected-report-periods">
                {draft.period === "Quarter" ? "Select quarter(s)" : "Select month(s)"}
              </label>
              <ReportMultiSelect
                id="selected-report-periods"
                label={
                  draft.period === "Quarter" ? "Select quarters" : "Select months"
                }
                options={draftPeriodOptions}
                selected={draftSelectedPeriods}
                onChange={(value) =>
                  (
                    draft.period === "Quarter"
                      ? setDraft(v => ({ ...v, quarters: value }))
                      : setDraft(v => ({ ...v, selectedMonths: value }))
                  )
                }
                placeholder={
                  draft.period === "Quarter" ? "Select quarter(s)" : "Select month(s)"
                }
                searchPlaceholder={
                  draft.period === "Quarter" ? "Search quarters…" : "Search months…"
                }
              />
            </div>
          )}
              {!draftDelivery.valid && <p role="alert" className="col-span-full text-sm text-destructive">{draftDelivery.error}</p>}
            </div>
            <div className={filterStyles.footer}>
              <Button type="button" variant="ghost" onClick={() => { const defaults = { funding: [], period: "Quarter" as ReportingPeriod, quarters: ["2026-Q3"], selectedMonths: ["2026-09"], from: "2026-09-01", to: "2026-09-07" }; setDraft(defaults); applyScope(defaults); }}><RotateCcw size={14} />Reset filters</Button>
              <Button type="submit" disabled={!draftDelivery.valid}>Apply filters</Button>
            </div>
          </form>
        </FilterPanel>
      </div>
      {tagError ? <div role="alert" className="mb-5 rounded-xl border p-5"><h2 className="font-semibold">Funding mappings unavailable</h2><p className="mt-1 text-sm text-muted-foreground">We could not check funding coverage. Reload project tags before generating a funding-scoped report.</p><Button className="mt-3" variant="outline" onClick={() => void reload()}>Retry mapping check</Button></div> : !loading && delivery.valid && <FundingMappingAlert sites={affectedSites} agency={agency} canManage={canManageTags} />}
      <section className={styles.builder} aria-label="Build your report">
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="report-agency">Select agency</label>
            <Choice
              id="report-agency"
              value={agency}
              label="Reporting agency"
              options={["CIC", "CEC", "Cal-EvIP"]}
              onChange={(value) =>
                changed(() => {
                  setAgency(value);
                  setSelected([]);
                  setFunding([]);
                })
              }
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="report-selection">Select reports</label>
            <ReportMultiSelect
              id="report-selection"
              label="Select reports"
              options={reports.map((report) => ({
                value: report.name,
                label: report.name,
              }))}
              selected={selected}
              onChange={(value) => changed(() => setSelected(value))}
              placeholder="Select one or more reports"
              searchPlaceholder="Search reports…"
            />
          </div>
          <fieldset className={styles.field}>
            <legend>Export type</legend>
            <div className={styles.formatOptions} aria-label="Export type">
              <button
                type="button"
                aria-pressed={format === "xlsx"}
                onClick={() => changed(() => setFormat("xlsx"))}
              >
                Excel
              </button>
              <button
                type="button"
                aria-pressed={format === "csv"}
                onClick={() => changed(() => setFormat("csv"))}
              >
                CSV
              </button>
            </div>
          </fieldset>
        </div>
        <div
          className={styles.periodSummary}
          data-invalid={!delivery.valid}
          role={delivery.valid ? "status" : "alert"}
        >
          {delivery.valid && delivery.delivery === "email" ? (
            <Mail size={15} aria-hidden="true" />
          ) : (
            <Info size={15} aria-hidden="true" />
          )}
          <span>
            {delivery.valid ? (
              <>
                Period: <strong>{periodLabel}</strong> · Selected range:{" "}
                <strong>
                  {delivery.days} {delivery.days === 1 ? "day" : "days"}
                </strong>
                .{" "}
                {delivery.delivery === "download"
                  ? "Instant download is enabled."
                  : "Email delivery to your registered email is required."}
              </>
            ) : (
              delivery.error
            )}
          </span>
        </div>
        {selected.length > 0 && !rowCount && <DataEmpty />}
        {error && (
          <p className={`form-error ${styles.exportError}`} role="alert">
            {error}
          </p>
        )}
        <div className={styles.footer}>
          <p>
            {prepared.length} {prepared.length === 1 ? "report" : "reports"} ·{" "}
            {rowCount} matching records
            {format === "csv" && selected.length > 1
              ? " · Multiple CSV reports are packaged as ZIP."
              : ""}
          </p>
          <Button
            onClick={generate}
            disabled={busy || !selected.length || !delivery.valid || !rowCount || (funding.length > 0 && (loading || !!tagError))}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" size={15} />
            ) : delivery.valid && delivery.delivery === "email" ? (
              <Mail size={15} />
            ) : (
              <Download size={15} />
            )}
            {busy ? "Generating…" : "Generate & export"}
          </Button>
        </div>
        {lastExport && (
          <p role="status" className={styles.success}>
            <Check size={16} />
            {lastExport}
          </p>
        )}
      </section>
      <div className="mt-5"><ReportingReference agency={agency} period={periodLabel} delivery={deliveryLabel} onView={() => setTab("requirements")} /></div>
        </TabsContent>
        <TabsContent value="history"><ExportHistory key={historyScope} scope={historyScope} revision={historyRevision} onCreate={() => setTab("reports")} /></TabsContent>
        <TabsContent value="requirements">
          <div className="mb-5 max-w-xs"><label className="mb-2 block text-sm font-medium" htmlFor="requirements-agency">Agency</label><Choice id="requirements-agency" label="Requirements agency" value={agency} options={["CIC", "CEC", "Cal-EvIP"]} onChange={value => changed(() => { setAgency(value); setSelected([]); setFunding([]); })} /></div>
          <ReportingReference agency={agency} period={periodLabel} delivery={deliveryLabel} expanded />
        </TabsContent>
      </Tabs>
      {emailOpen && (
        <ReportEmailDialog
          onClose={() => setEmailOpen(false)}
          agency={agency}
          format={format}
          periodLabel={`${periodLabel} · ${delivery.days} days`}
          defaultName={`${agency}-${period === "Quarter" && quarters.length === 1 ? quarters[0] : period === "Months" && selectedMonths.length === 1 ? selectedMonths[0] : "Custom-Report"}-Regulatory-Report`}
        />
      )}
    </>
  );
}
