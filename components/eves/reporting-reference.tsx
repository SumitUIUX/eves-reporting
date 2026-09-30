import { Button } from "@/components/ui/button";
import { ArrowRight, Building2 } from "lucide-react";

// Preserve the supplied reference table separately from export sheet names.
const groups = [
  {
    agency: "CIC",
    frequency: "Quarterly",
    format: "TBC",
    reports: [
      { name: "Charging Infra Deployment Report" },
      { name: "Charging Sessions Report" },
      { name: "Interval Load Profile" },
      { name: "Uptime & Reliability" },
    ],
  },
  {
    agency: "CEC",
    frequency: "Semiannual",
    format: ".csv",
    reports: [
      { name: "Charger Usage and Throughput Report" },
      { name: "Uptime Reporting" },
      { name: "Excluded Downtime Reporting" },
      { name: "Contact Information and Inventory" },
      { name: "Utilization Session", frequency: "Quarterly" },
      { name: "Utilization Interval", frequency: "Quarterly" },
      { name: "Reliability Downtime", frequency: "Quarterly" },
      { name: "Reliability Uptime", frequency: "Quarterly" },
      { name: "Utilization Inventory", frequency: "Quarterly" },
    ],
  },
  {
    agency: "Cal-EvIP",
    frequency: "TBC",
    format: "TBC",
    reports: [
      { name: "Sites/Stations" },
      { name: "Charging Sessions" },
      { name: "Charger Interval Report" },
      { name: "Downtime Events" },
    ],
  },
];

export function ReportingReference({ agency, period, delivery, expanded = false, onView }: { agency: string; period: string; delivery: string; expanded?: boolean; onView?: () => void }) {
  const group = groups.find(g => g.agency === agency) ?? groups[0];
  const fields = [
    ["Frequency", agency === "CEC" ? "Quarterly / Semiannual" : group.frequency === "TBC" ? "Not confirmed" : group.frequency],
    ["Reporting period", period || "Choose a period"],
    ["Reports", `${group.reports.length} listed reports`],
    ["Export delivery", delivery],
    ["Available export formats", "Excel / CSV"],
    ["Agency submission format", group.format === "TBC" ? "Not confirmed" : group.format],
    ["Submission", agency === "CEC" ? "Manual portal upload" : "Requirements not confirmed"],
    ["Requirements last verified", "Not recorded"],
  ];
  return <section className="panel p-6" aria-label={`${agency} reporting requirements`}>
    <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 size={22} /></span><div><h2 className="text-lg font-semibold">{agency}</h2><p className="text-sm text-muted-foreground">Agency reporting profile</p></div></div>
    <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reporting requirements</h3>
    <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([label,value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl>
    {expanded ? <div className="mt-6 border-t pt-5"><h3 className="font-medium">Report checklist</h3><ul className="mt-3 divide-y">{group.reports.map(report => <li key={report.name} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{report.name}</span><span className="text-muted-foreground">{"frequency" in report ? report.frequency : group.frequency === "TBC" ? "Frequency not confirmed" : group.frequency}</span></li>)}</ul><p className="mt-4 text-xs text-muted-foreground">Based on the existing reporting reference. Required templates and acceptance must be confirmed with the agency before submission.</p>{agency === "CEC" && <a className="mt-3 inline-flex items-center gap-2 text-sm text-primary" href="https://datasubmission.energy.ca.gov/" target="_blank" rel="noopener noreferrer">Open submission portal <ArrowRight size={14} /></a>}</div> : <Button className="mt-5" variant="ghost" onClick={onView}>View reporting requirements <ArrowRight size={16} /></Button>}
  </section>;
}
