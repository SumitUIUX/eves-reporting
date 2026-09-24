"use client";
import { useMemo, useState } from "react";
import {
  Download,
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
import { useTags } from "@/lib/eves/use-tags";
import { useDataSource } from "@/lib/eves/data-source";
import { resolveFundingTags } from "@/lib/eves/funding-tags";
import { reportConfig, isoDate } from "@/lib/eves/report-config";
import type { ReportDataset, ReportKind } from "@/lib/eves/types";
import datasets from "@/data/reference-reports.json";
import { downloadExcel, createZip } from "@/lib/eves/xlsx";
import { downloadCsv, csvText, downloadBlob } from "@/lib/eves/export";
import { toast } from "sonner";
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
  const { source } = useDataSource();
  const tagState = useTags();
  const loading = source === "workspace" && tagState.loading;
  const { reload } = tagState;
  const { tags, error: tagError } = resolveFundingTags(
    source === "sample"
      ? { tags: [], error: "", errorCode: "TAG_STORAGE_NOT_CONFIGURED" }
      : tagState.error
        ? { tags: [], error: "", errorCode: "" }
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
  function buildReport(report: (typeof reports)[number]) {
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
      if (funding.length) {
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
    .map(buildReport);
  const rowCount = prepared.reduce((n, s) => n + s.data.rows.length, 0);
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
      if (format === "xlsx")
        downloadExcel(
          [...prepared, manifest],
          `eves-${agency.toLowerCase()}-reference`,
        );
      else if (prepared.length === 1)
        downloadCsv(
          prepared[0].data,
          `eves-${agency.toLowerCase()}-${prepared[0].name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-reference`,
        );
      else {
        const files: Record<string, string> = {
          "README.csv": csvText(manifest.data),
        };
        prepared.forEach((s) => {
          files[s.name.replace(/[^a-zA-Z0-9]/g, "-") + ".csv"] = csvText(
            s.data,
          );
        });
        const bytes = createZip(files);
        downloadBlob(
          new Blob([bytes.buffer as ArrayBuffer], { type: "application/zip" }),
          `eves-${agency.toLowerCase()}-reference.zip`,
        );
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
          <div className={styles.field}>
            <label htmlFor="report-funding">Funding ID (optional)</label>
            <ReportMultiSelect
              id="report-funding"
              label="Funding IDs"
              options={eligibleTags.map((tag) => ({
                value: tag.id,
                label: tag.awardId || tag.name,
              }))}
              selected={funding}
              onChange={(value) => changed(() => setFunding(value))}
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
          <div className={styles.field}>
            <label htmlFor="period-type">Reporting period</label>
            <Choice
              id="period-type"
              value={period}
              label="Reporting period"
              options={["Quarter", "Months", "Custom range"]}
              onChange={(value) =>
                changed(() => setPeriod(value as ReportingPeriod))
              }
            />
          </div>
          {period === "Custom range" ? (
            <>
              <div className={styles.field}>
                <label htmlFor="custom-from">Date from</label>
                <ReportDatePicker
                  id="custom-from"
                  label="Date from"
                  value={from}
                  onChange={(value) => changed(() => setFrom(value))}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="custom-to">Date to</label>
                <ReportDatePicker
                  id="custom-to"
                  label="Date to"
                  value={to}
                  min={from}
                  onChange={(value) => changed(() => setTo(value))}
                />
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <label htmlFor="selected-report-periods">
                {period === "Quarter" ? "Select quarter(s)" : "Select month(s)"}
              </label>
              <ReportMultiSelect
                id="selected-report-periods"
                label={
                  period === "Quarter" ? "Select quarters" : "Select months"
                }
                options={periodOptions}
                selected={selectedPeriods}
                onChange={(value) =>
                  changed(() =>
                    period === "Quarter"
                      ? setQuarters(value)
                      : setMonths(value),
                  )
                }
                placeholder={
                  period === "Quarter" ? "Select quarter(s)" : "Select month(s)"
                }
                searchPlaceholder={
                  period === "Quarter" ? "Search quarters…" : "Search months…"
                }
              />
            </div>
          )}
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
            disabled={busy || !selected.length || !delivery.valid}
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
      <ReportingReference />
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
