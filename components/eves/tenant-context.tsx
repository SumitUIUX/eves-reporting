"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
export const analyticsOptions = ["RPT - Consumption (kWh):1.0", "RPT - Financial:1.0", "RPT - Inactivity:1.0", "RPT - Sessions:1.0", "RPT - Usage (hours):1.0"];
export const componentNames = ["Charging Station Management", "Dashboard", "Driver Management", "Energy Storage Management", "EV", "Financials", "Gridify", "Integration", "Log Management", "Organization Management", "Reports/Analytics", "Session Management", "User Administration"];
export type Tenant = {
  id: string; name: string; subdomain: string; email: string; analytics: string[]; regulatory: boolean; master: boolean;
  address1: string; address2: string; postalCode: string; city: string; department: string; region: string; country: string; contact: string; latitude: string; longitude: string;
  createdOn: string; createdBy: string; changedOn: string; changedBy: string; components: Record<string, boolean>; deleted?: boolean;
};
export const blankTenant = (): Tenant => ({ id: "", name: "", subdomain: "", email: "", analytics: [...analyticsOptions], regulatory: true, master: true, address1: "", address2: "", postalCode: "", city: "", department: "", region: "", country: "", contact: "", latitude: "", longitude: "", createdOn: "", createdBy: "", changedOn: "", changedBy: "", components: Object.fromEntries(componentNames.map(n => [n, true])) });
const referenceRows = [
  ["6a4cef65ea35fd99d9ea7e6e", "pricng", "pricng", "vaishnavi.mehrotra@3insys.com", "7/7/26, 12:21:57 PM", "testing VAISH", "8/14/26, 2:45:57 AM", "Frank JEREC"],
  ["66d7ec73d13bb611c109e6e0", "tenant1", "tenant1", "vasundhara.guggella@3insys.com", "6/26/25, 12:59:47 PM", "system", "7/1/26, 6:36:53 AM", "testing VAISH"],
  ["6247815a56e66973100b3fe2", "test", "test", "v.guggella@gmail.com", "6/26/25, 1:40:00 PM", "system", "6/17/26, 4:38:10 PM", "testing VAISH"],
  ["6a79a3ecd76fd5aa6c472b4e", "testjerec5", "test jerec 5", "jerec.frank@3insys.com", "8/10/26, 10:11:56 AM", "Frank JEREC", "8/10/26, 10:11:56 AM", "Frank JEREC"],
  ["6a74623be2d01fcafe288168", "testjerec2", "testjerec2", "jerec.frank@3insys.com", "8/6/26, 10:30:19 AM", "Frank JEREC", "8/13/26, 3:16:15 PM", "Frank JEREC"],
  ["6a753c41e2d01fcafe28cf3c", "testjerec3", "test jerec 3", "jerec.frank@3insys.com", "8/7/26, 2:00:33 AM", "Frank JEREC", "8/7/26, 2:00:33 AM", "Frank JEREC"],
  ["6a755f6ae2d01fcafe28d48e", "testjerec4", "testjerec 4", "jerec.frank@3insys.com", "8/7/26, 4:30:34 AM", "Frank JEREC", "8/7/26, 4:30:34 AM", "Frank JEREC"],
];
const initial = referenceRows.map(([id, subdomain, name, email, createdOn, createdBy, changedOn, changedBy], i) => ({ ...blankTenant(), id, subdomain, name, email, createdOn, createdBy, changedOn, changedBy, ...(i === 0 ? { address1: "Daughters of Revolution Road", postalCode: "81090", city: "Walsh", region: "Kansas", country: "United States", contact: "3232323232" } : {}) }));
const key = "eves-tenant-configuration-v2";
type Context = { tenantView: boolean; setTenantView: (v: boolean) => void; tenants: Tenant[]; active: Tenant; selectTenant: (id: string) => void; saveTenant: (tenant: Tenant) => boolean; refreshTenants: () => void; deleteTenant: (id: string) => boolean; restoreTenant: (id: string) => void };
const TenantContext = createContext<Context | null>(null);
function readSaved(): Tenant[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (Array.isArray(value) && value.every(t => t && typeof t.id === "string" && typeof t.name === "string" && typeof t.email === "string" && typeof t.subdomain === "string" && typeof t.regulatory === "boolean" && typeof t.master === "boolean" && Array.isArray(t.analytics))) return value.map(t => ({ ...blankTenant(), ...t, components: { ...blankTenant().components, ...t.components } }));
    const old = JSON.parse(localStorage.getItem("eves-tenant-configuration-v1") ?? "null");
    if (Array.isArray(old)) return initial.map((t, i) => ({ ...t, ...(old[i] ? { regulatory: old[i].regulatory === true, master: old[i].master === true, analytics: Array.isArray(old[i].analytics) ? old[i].analytics : t.analytics } : {}) }));
  } catch { /* Use reference records when storage is unavailable. */ }
  return initial;
}
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantView, setTenantView] = useState(false);
  const [records, setRecords] = useState(initial);
  const [activeId, selectTenant] = useState(initial[0].id);
  useEffect(() => { const id = window.setTimeout(() => setRecords(readSaved()), 0); return () => window.clearTimeout(id); }, []);
  const tenants = records.filter(t => !t.deleted);
  function persist(next: Tenant[]) {
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { toast.error("Unable to save. Please enable browser storage and try again."); return false; }
    setRecords(next); return true;
  }
  function saveTenant(tenant: Tenant) { return persist(records.some(t => t.id === tenant.id) ? records.map(t => t.id === tenant.id ? tenant : t) : [...records, tenant]); }
  return <TenantContext.Provider value={{ tenantView, setTenantView, tenants, active: tenants.find(t => t.id === activeId) ?? tenants[0] ?? { ...blankTenant(), name: "No tenant selected", regulatory: false, master: false }, selectTenant, saveTenant, refreshTenants: () => setRecords(readSaved()), deleteTenant: id => persist(records.map(t => t.id === id ? { ...t, deleted: true } : t)), restoreTenant: id => { persist(records.map(t => t.id === id ? { ...t, deleted: false } : t)); } }}>{children}</TenantContext.Provider>;
}
export function useTenant() { const value = useContext(TenantContext); if (!value) throw new Error("TenantProvider is required"); return value; }
