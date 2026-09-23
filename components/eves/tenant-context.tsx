"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
export const analyticsOptions = ["RPT - Consumption (kWh):1.0", "RPT - Financial:1.0", "RPT - Inactivity:1.0", "RPT - Sessions:1.0", "RPT - Usage (hours):1.0"];
export type Tenant = { id: string; name: string; subdomain: string; email: string; analytics: string[]; regulatory: boolean; master: boolean };
const initial: Tenant[] = [
  { id: "TEN-001", name: "EVES Demo", subdomain: "eves-demo", email: "admin@example.com", analytics: [...analyticsOptions], regulatory: true, master: true },
  { id: "TEN-002", name: "Fleet Demo", subdomain: "fleet-demo", email: "fleet@example.com", analytics: [...analyticsOptions], regulatory: true, master: false },
  { id: "TEN-003", name: "Charging Demo", subdomain: "charging-demo", email: "charging@example.com", analytics: [...analyticsOptions], regulatory: false, master: true },
];
const key = "eves-tenant-configuration-v1";
type Context = { tenantView: boolean; setTenantView: (v: boolean) => void; tenants: Tenant[]; active: Tenant; selectTenant: (id: string) => void; saveTenant: (tenant: Tenant) => boolean };
const TenantContext = createContext<Context | null>(null);
function readSaved(): Tenant[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (Array.isArray(value) && value.length === initial.length && value.every((t, i) => t.id === initial[i].id && typeof t.regulatory === "boolean" && typeof t.master === "boolean" && Array.isArray(t.analytics) && t.analytics.every((a: unknown) => typeof a === "string" && analyticsOptions.includes(a)))) {
      return initial.map((t, i) => ({ ...t, regulatory: value[i].regulatory, master: value[i].master, analytics: value[i].analytics }));
    }
  } catch { /* Use the demo defaults when browser storage is unavailable. */ }
  return initial;
}
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantView, setTenantView] = useState(false);
  const [tenants, setTenants] = useState(initial);
  const [activeId, selectTenant] = useState(initial[0].id);
  useEffect(() => { const id = window.setTimeout(() => setTenants(readSaved()), 0); return () => window.clearTimeout(id); }, []);
  function saveTenant(tenant: Tenant) {
    const next = tenants.map(t => t.id === tenant.id ? tenant : t);
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { toast.error("Unable to save. Please enable browser storage and try again."); return false; }
    setTenants(next);
    return true;
  }
  return <TenantContext.Provider value={{ tenantView, setTenantView, tenants, active: tenants.find(t => t.id === activeId) ?? tenants[0], selectTenant, saveTenant }}>{children}</TenantContext.Provider>;
}
export function useTenant() { const value = useContext(TenantContext); if (!value) throw new Error("TenantProvider is required"); return value; }
