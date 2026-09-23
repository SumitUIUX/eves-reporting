"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import sampleTenantRows from "@/data/tenants.json";
import { useDataSource, type DataSource } from "@/lib/eves/data-source";

export const analyticsOptions = ["RPT - Consumption (kWh):1.0", "RPT - Financial:1.0", "RPT - Inactivity:1.0", "RPT - Sessions:1.0", "RPT - Usage (hours):1.0"];
export const componentNames = ["Charging Station Management", "Dashboard", "Driver Management", "Energy Storage Management", "EV", "Financials", "Gridify", "Integration", "Log Management", "Organization Management", "Reports/Analytics", "Session Management", "User Administration"];
export const reportHierarchy = [
  {
    id: "regulatory",
    label: "Regulatory Reports",
    items: [
      { id: "project-tagging", label: "Project Tagging" },
      { id: "generate-reports", label: "Generate Reports" },
    ],
  },
  {
    id: "master",
    label: "Master Reports",
    items: [
      { id: "charging-sessions", label: "Charging Sessions" },
      { id: "interval-load-profile", label: "Interval Load Profile" },
      { id: "infrastructure-throughput", label: "Infrastructure & Throughput" },
      { id: "uptime-reliability", label: "Uptime & Reliability" },
    ],
  },
  {
    id: "tenant",
    label: "Tenant Reports",
    items: [
      { id: "executive-overview", label: "Business Overview" },
      { id: "charging-performance", label: "Charging Performance" },
      { id: "site-performance", label: "Site Performance" },
      { id: "charger-connector-performance", label: "Charger / Connector Performance" },
      { id: "energy-demand", label: "Energy & Demand" },
      { id: "tenant-uptime-reliability", label: "Uptime & Reliability" },
      { id: "revenue-financial", label: "Revenue & Financial" },
    ],
  },
] as const;
export type TenantDataSource = DataSource;
export type Tenant = {
  id: string; name: string; subdomain: string; email: string; analytics: string[]; regulatory: boolean; master: boolean;
  reports: Record<string, boolean>;
  address1: string; address2: string; postalCode: string; city: string; department: string; region: string; country: string; contact: string; latitude: string; longitude: string;
  createdOn: string; createdBy: string; changedOn: string; changedBy: string; components: Record<string, boolean>; deleted?: boolean;
};
export function defaultReports(): Record<string, boolean> {
  return Object.fromEntries(reportHierarchy.flatMap((group) => group.items.map((item) => [item.id, true])));
}
export function reportAccess(reports: Record<string, boolean>) {
  return {
    regulatory: reportHierarchy[0].items.some((item) => reports[item.id]),
    master: reportHierarchy[1].items.some((item) => reports[item.id]),
  };
}
export function reportsFromTenant(tenant: { regulatory?: boolean; master?: boolean; reports?: Record<string, boolean> }) {
  const reports = defaultReports();
  if (tenant.reports && typeof tenant.reports === "object") {
    for (const [id, enabled] of Object.entries(tenant.reports)) {
      if (id in reports && typeof enabled === "boolean") reports[id] = enabled;
    }
    return reports;
  }
  for (const item of reportHierarchy[0].items) reports[item.id] = tenant.regulatory !== false;
  for (const item of reportHierarchy[1].items) reports[item.id] = tenant.master !== false;
  return reports;
}
export const blankTenant = (): Tenant => ({ id: "", name: "", subdomain: "", email: "", analytics: [...analyticsOptions], regulatory: true, master: true, reports: defaultReports(), address1: "", address2: "", postalCode: "", city: "", department: "", region: "", country: "", contact: "", latitude: "", longitude: "", createdOn: "", createdBy: "", changedOn: "", changedBy: "", components: Object.fromEntries(componentNames.map(n => [n, true])) });

const sampleKey = "eves-tenants-sample-v1";

function sampleSeed(): Tenant[] {
  return sampleTenantRows.map((row) => ({ ...blankTenant(), ...row }));
}

function isTenantRecord(value: unknown): value is Tenant {
  if (!value || typeof value !== "object") return false;
  const tenant = value as Tenant;
  return typeof tenant.id === "string" && typeof tenant.name === "string" && typeof tenant.email === "string" && typeof tenant.subdomain === "string" && typeof tenant.regulatory === "boolean" && typeof tenant.master === "boolean" && Array.isArray(tenant.analytics);
}

function readSample(): Tenant[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(sampleKey) ?? "null");
    if (Array.isArray(value) && value.every(isTenantRecord)) {
      return value.map((tenant) => {
        const merged = { ...blankTenant(), ...tenant, components: { ...blankTenant().components, ...tenant.components } };
        const reports = reportsFromTenant(tenant.reports ? merged : tenant);
        return { ...merged, reports, ...reportAccess(reports) };
      });
    }
  } catch { /* Use the sample file when storage is unavailable. */ }
  return sampleSeed();
}

type Context = {
  tenantView: boolean; setTenantView: (v: boolean) => void;
  source: TenantDataSource; selectSource: (source: TenantDataSource) => void;
  tenants: Tenant[]; active: Tenant; selectTenant: (id: string) => void;
  saveTenant: (tenant: Tenant) => boolean; refreshTenants: () => void;
  deleteTenant: (id: string) => boolean; restoreTenant: (id: string) => void;
};
const TenantContext = createContext<Context | null>(null);
const seeded = sampleSeed();

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { source, selectSource } = useDataSource();
  const [tenantView, setTenantView] = useState(false);
  const [records, setRecords] = useState(seeded);
  const [activeId, selectTenant] = useState(seeded[0]?.id ?? "");
  useEffect(() => {
    const id = window.setTimeout(() => setRecords(source === "sample" ? readSample() : []), 0);
    return () => window.clearTimeout(id);
  }, [source]);
  const tenants = records.filter(t => !t.deleted);
  function persist(next: Tenant[]) {
    if (source !== "sample") {
      toast.error("Workspace tenant API is not connected.");
      return false;
    }
    try { localStorage.setItem(sampleKey, JSON.stringify(next)); } catch { toast.error("Unable to save. Please enable browser storage and try again."); return false; }
    setRecords(next); return true;
  }
  function saveTenant(tenant: Tenant) { return persist(records.some(t => t.id === tenant.id) ? records.map(t => t.id === tenant.id ? tenant : t) : [...records, tenant]); }
  function refreshTenants() { setRecords(source === "sample" ? readSample() : []); }
  return <TenantContext.Provider value={{ tenantView, setTenantView, source, selectSource, tenants, active: tenants.find(t => t.id === activeId) ?? tenants[0] ?? { ...blankTenant(), name: "No tenant selected", regulatory: false, master: false }, selectTenant, saveTenant, refreshTenants, deleteTenant: id => persist(records.map(t => t.id === id ? { ...t, deleted: true } : t)), restoreTenant: id => { persist(records.map(t => t.id === id ? { ...t, deleted: false } : t)); } }}>{children}</TenantContext.Provider>;
}
export function useTenant() { const value = useContext(TenantContext); if (!value) throw new Error("TenantProvider is required"); return value; }
