"use client";
import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  ArrowUpRight,
  Check,
  Info,
  Landmark,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeading, Choice, ReferenceNote } from "./shared";
import { useTags } from "@/lib/eves/use-tags";
import { reportConfig, isoDate } from "@/lib/eves/report-config";
import type { ReportDataset, ReportKind } from "@/lib/eves/types";
import datasets from "@/lib/eves/reference-data.json";
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
  ],
  "Cal-EvIP": [
    { name: "Sites / Stations", kind: "throughput" },
    { name: "Charging Sessions", kind: "sessions" },
    { name: "Charger Interval Report", kind: "intervals" },
    { name: "Downtime Events", kind: "events" },
  ],
};
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export function Regulatory() {
  const [agency, setAgency] = useState("CIC"),
    [selected, setSelected] = useState<string[]>(["Charging Sessions"]),
    [funding, setFunding] = useState<string[]>([]),
    [period, setPeriod] = useState("Quarter"),
    [year, setYear] = useState("2026"),
    [quarters, setQuarters] = useState<string[]>(["3"]),
    [selectedMonths, setMonths] = useState<string[]>(["9"]),
    [from, setFrom] = useState("2026-09-01"),
    [to, setTo] = useState("2026-09-07"),
    [format, setFormat] = useState("xlsx"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [lastExport, setLastExport] = useState("");
  const { tags, loading, error: tagError, reload } = useTags();
  const reports = definitions[agency];
  const eligibleTags = tags.filter((t) => t.agency === agency);
  const ranges = useMemo(() => {
    if (period === "Custom range") return [{ from, to }];
    const startMonths =
      period === "Quarter"
        ? quarters.map((q) => (Number(q) - 1) * 3 + 1)
        : selectedMonths.map(Number);
    return startMonths.map((m) => {
      const endMonth = period === "Quarter" ? m + 2 : m;
      const last = new Date(Number(year), endMonth, 0).getDate();
      return {
        from: `${year}-${String(m).padStart(2, "0")}-01`,
        to: `${year}-${String(endMonth).padStart(2, "0")}-${last}`,
      };
    });
  }, [period, from, to, quarters, selectedMonths, year]);
  const toggle = (values: string[], value: string) =>
    values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
  function buildReport(report: (typeof reports)[number]) {
    const data = datasets[report.kind] as ReportDataset;
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
            ? 29
            : report.kind === "intervals"
              ? 17
              : report.kind === "throughput"
                ? 31
                : report.kind === "uptime"
                  ? 14
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
    if (
      !ranges.length ||
      ranges.some((r) => !r.from || !r.to || r.from > r.to)
    ) {
      setError("Choose a valid reporting period.");
      return;
    }
    if (!rowCount) {
      setError(
        "No reference records match this selection. Try Q3 2026 or remove the funding filter.",
      );
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
      <PageHeading
        eyebrow="REGULATORY REPORTS"
        title="Generate reports"
        description="Bring the right data together for your next reporting period."
      />
      <div className="regulatory-grid">
        <section className="panel">
          <div className="panel-header">
            <div className="flex items-center gap-3">
              <span className="workspace-icon">
                <FileText size={19} />
              </span>
              <div>
                <h2>Build your report</h2>
                <p>Select an agency, your reports, and a period.</p>
              </div>
            </div>
          </div>
          <div className="regulatory-form space-y-6">
            <div className="form-field">
              <label htmlFor="report-agency">Reporting agency</label>
              <Choice
                id="report-agency"
                value={agency}
                label="Reporting agency"
                onChange={(v) => {
                  setAgency(v);
                  setSelected([]);
                  setFunding([]);
                  setLastExport("");
                }}
                options={["CIC", "CEC", "Cal-EvIP"]}
                className="w-full"
              />
            </div>
            <fieldset>
              <legend className="text-[13px] font-semibold text-[#565b70] mb-1">
                Select reports <span className="text-primary">*</span>
              </legend>
              {reports.map((r) => (
                <label
                  key={r.name}
                  className={`report-choice cursor-pointer ${selected.includes(r.name) ? "selected" : ""}`}
                >
                  <Checkbox
                    checked={selected.includes(r.name)}
                    onCheckedChange={() =>
                      setSelected(toggle(selected, r.name))
                    }
                    aria-label={r.name}
                  />
                  <span>
                    {r.name}
                    <small>
                      {reportConfig[r.kind].short} data
                      {r.excluded ? " · excluded events only" : ""}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="form-field">
              <label>
                Funding scope{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-between"
                    disabled={loading || !!tagError}
                  >
                    {funding.length
                      ? `${funding.length} funding ${funding.length === 1 ? "tag" : "tags"} selected`
                      : "All funding IDs"}
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-70">
                  {eligibleTags.length ? (
                    eligibleTags.map((t) => (
                      <DropdownMenuCheckboxItem
                        key={t.id}
                        checked={funding.includes(t.id)}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={() =>
                          setFunding(toggle(funding, t.id))
                        }
                      >
                        {t.awardId || t.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <p className="text-xs p-3 text-muted-foreground">
                      No funding tags for this agency.
                    </p>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">
                Reference funding filters match tag names and mapped sites.
                Individual charger IDs are not linked to these report snapshots.
              </p>
              {tagError && (
                <p className="text-xs text-destructive">
                  Funding tags unavailable.{" "}
                  <button onClick={() => void reload()} className="underline">
                    Retry
                  </button>
                </p>
              )}
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="period-type">Reporting period</label>
                <Choice
                  id="period-type"
                  value={period}
                  label="Reporting period"
                  onChange={setPeriod}
                  options={["Quarter", "Months", "Custom range"]}
                  className="w-full"
                />
              </div>
              {period !== "Custom range" && (
                <div className="form-field">
                  <label htmlFor="report-year">Year</label>
                  <Choice
                    id="report-year"
                    value={year}
                    label="Reporting year"
                    onChange={setYear}
                    options={["2025", "2026", "2027"]}
                    className="w-full"
                  />
                </div>
              )}
              {period === "Quarter" && (
                <div className="form-field full">
                  <label>Select quarters</label>
                  <div className="flex gap-2">
                    {["1", "2", "3", "4"].map((q) => (
                      <Button
                        key={q}
                        variant={quarters.includes(q) ? "secondary" : "outline"}
                        aria-pressed={quarters.includes(q)}
                        onClick={() => setQuarters(toggle(quarters, q))}
                        className="flex-1"
                      >
                        Q{q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {period === "Months" && (
                <div className="form-field full">
                  <label>Select months</label>
                  <div className="grid grid-cols-4 gap-2">
                    {months.map((m, i) => (
                      <Button
                        key={m}
                        variant={
                          selectedMonths.includes(String(i + 1))
                            ? "secondary"
                            : "outline"
                        }
                        aria-pressed={selectedMonths.includes(String(i + 1))}
                        onClick={() =>
                          setMonths(toggle(selectedMonths, String(i + 1)))
                        }
                      >
                        {m.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {period === "Custom range" && (
                <>
                  <div className="form-field">
                    <label htmlFor="custom-from">From date</label>
                    <Input
                      id="custom-from"
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="custom-to">To date</label>
                    <Input
                      id="custom-to"
                      type="date"
                      value={to}
                      min={from}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="form-field">
              <label>Export format</label>
              <Tabs value={format} onValueChange={setFormat}>
                <TabsList className="w-full h-11">
                  <TabsTrigger value="xlsx" className="flex-1">
                    Excel (.xlsx)
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="flex-1">
                    CSV
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <span className="text-xs text-muted-foreground">
                Multiple CSV reports download together as a ZIP file.
              </span>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="border-t pt-5 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {prepared.length} {prepared.length === 1 ? "report" : "reports"}{" "}
                · {rowCount} matching records
              </span>
              <Button onClick={generate} disabled={busy || !selected.length}>
                {busy ? (
                  <LoaderCircle className="animate-spin" size={15} />
                ) : (
                  <Download size={15} />
                )}
                Download export
              </Button>
            </div>
            {lastExport && (
              <p
                role="status"
                className="text-sm text-[#428b75] flex items-center gap-2"
              >
                <Check size={16} />
                {lastExport}
              </p>
            )}
          </div>
        </section>
        <aside className="space-y-5">
          <div className="panel">
            <div className="panel-header">
              <h2>Reporting reference</h2>
              <Landmark size={18} className="text-muted-foreground" />
            </div>
            <div className="p-6">
              <span className="type-badge mb-4">{agency}</span>
              <h3 className="text-base font-semibold mb-2">
                {agency === "CIC"
                  ? "Quarterly reporting"
                  : agency === "CEC"
                    ? "Semiannual reporting"
                    : "Program reporting"}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-7">
                {agency === "CIC"
                  ? "The original dashboard lists infrastructure, sessions, interval load and reliability reports for CIC."
                  : agency === "CEC"
                    ? "The original dashboard lists throughput, uptime, excluded downtime and inventory reports for CEC."
                    : "The original dashboard lists sites, charging sessions, intervals and downtime events for Cal-EvIP."}
              </p>
              <dl className="mt-6 border-t">
                <div className="flex justify-between py-4 border-b text-[13px]">
                  <dt className="text-muted-foreground">Frequency</dt>
                  <dd>
                    {agency === "CIC"
                      ? "Quarterly"
                      : agency === "CEC"
                        ? "Semiannual"
                        : "To be confirmed"}
                  </dd>
                </div>
                <div className="flex justify-between py-4 border-b text-[13px]">
                  <dt className="text-muted-foreground">Source format</dt>
                  <dd>{agency === "CEC" ? "CSV" : "To be confirmed"}</dd>
                </div>
                <div className="flex justify-between py-4 text-[13px]">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd>Direct download</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="reference-note">
            <div className="flex items-center gap-2 font-semibold mb-2">
              <Info size={15} />
              About these exports
            </div>
            These are working exports of reference data. Agency submission
            templates, contact records, live charger sync, and email delivery
            are not connected. Verify required formats with the receiving agency
            before submission.
          </div>
          <div className="px-2">
            <h3 className="text-sm font-semibold mb-3">
              Keep your reporting organized
            </h3>
            <p className="text-[13px] leading-7 text-muted-foreground">
              Map sites to a funding tag before generating a project-specific
              report. Your selections will determine which reference records are
              included.
            </p>
            <a
              href="/reports/project-tags"
              className="inline-flex items-center gap-2 text-primary text-sm mt-3"
            >
              Manage project tags <ArrowUpRight size={14} />
            </a>
          </div>
        </aside>
      </div>
      <ReferenceNote>
        Summary reports retain the original snapshot period. Session and
        interval exports are filtered by their recorded dates.
      </ReferenceNote>
    </>
  );
}
