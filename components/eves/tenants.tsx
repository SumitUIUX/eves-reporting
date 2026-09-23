"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil, Landmark, SlidersHorizontal, ExternalLink, Trash2, RefreshCw, Plus, Minus, Save, X, MapPin, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataEmpty } from "./shared";
import { analyticsOptions, reportOptions, tenantReports, componentNames, blankTenant, useTenant, type Tenant } from "./tenant-context";
import styles from "./tenants.module.css";
export function Tenants() {
  const { tenants, setTenantView, selectTenant, saveTenant, refreshTenants, deleteTenant, restoreTenant } = useTenant();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Tenant | null>(null);
  const [removing, setRemoving] = useState<Tenant | null>(null);
  const [tab, setTab] = useState("tenant");
  const [type, setType] = useState("Analytics");
  const [expanded, setExpanded] = useState<string[]>(["Reports/Analytics"]);
  const [ascending, setAscending] = useState(true);
  const rows = tenants.filter(t => `${t.id} ${t.name} ${t.subdomain} ${t.email}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => a.subdomain.localeCompare(b.subdomain) * (ascending ? 1 : -1));
  function edit(t: Tenant) { setDraft(structuredClone(t)); setTab("tenant"); setType("Analytics"); setExpanded(["Reports/Analytics"]); }
  function save(event: React.FormEvent) {
    event.preventDefault(); if (!draft) return;
    if (!draft.name.trim() || !draft.subdomain.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) || (!draft.id && !draft.contact.trim())) { setTab("tenant"); toast.error("Enter name, subdomain, a valid email, and contact."); return; }
    if (tenants.some(t => t.id !== draft.id && t.subdomain.toLowerCase() === draft.subdomain.trim().toLowerCase())) { setTab("tenant"); toast.error("This subdomain is already in use."); return; }
    const now = new Date().toLocaleString("en-US");
    const savedId = draft.id || crypto.randomUUID();
    if (saveTenant({ ...draft, id: savedId, name: draft.name.trim(), subdomain: draft.subdomain.trim(), createdOn: draft.createdOn || now, createdBy: draft.createdBy || "Tenant View", changedOn: now, changedBy: "Tenant View" })) { selectTenant(savedId); toast.success("Tenant saved"); setDraft(null); }
  }
  function field(key: keyof Tenant, label: string, required = false, inputType = "text", readOnly = false) {
    return <label className={styles.field}>{label}{required && " *"}<input aria-label={label} type={inputType} value={String(draft?.[key] ?? "")} readOnly={readOnly} onChange={e => draft && setDraft({ ...draft, [key]: e.target.value })} />{(key === "latitude" || key === "longitude") && <MapPin size={16} />}</label>;
  }
  const address = draft ? [draft.address1, draft.address2, draft.city, draft.region, draft.postalCode, draft.country].filter(Boolean).join(", ") : "";
  return <>
    <section className={styles.screen} aria-label="Tenants">
      <div className={styles.toolbar}><Button size="sm" onClick={() => edit(blankTenant())}><Plus size={16} />Create</Button><button className={styles.refresh} aria-label="Refresh tenants" title="Refresh" onClick={() => { refreshTenants(); toast.success("Tenant records refreshed"); }}><RefreshCw size={17} /></button></div>
      <label className={styles.search}>Search<input aria-label="Search tenants" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}</label>
      {rows.length ? <div className={styles.tableScroll}><table className={styles.table}>
        <thead><tr><th>Action(s)</th><th>Logo</th><th>ID</th><th aria-sort={ascending ? "ascending" : "descending"}><button onClick={() => setAscending(!ascending)}>Subdomain {ascending ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></th><th>Name</th><th>Email</th><th>Created On</th><th>Created By</th><th>Changed On</th><th>Changed By</th></tr></thead>
        <tbody>{rows.map(t => <tr key={t.id}>
          <td><div className={styles.actions}><button title="Edit" aria-label={`Edit ${t.name}`} onClick={() => edit(t)}><Pencil size={18} /></button><button title="Open tenant" aria-label={`Open ${t.name}`} onClick={() => { selectTenant(t.id); setTenantView(true); router.push(tenantReports(t)[0]?.href ?? "/tenant-home"); toast.success(`Tenant: ${t.name}`); }}><ExternalLink size={18} /></button><button className={styles.delete} title="Delete" aria-label={`Delete ${t.name}`} onClick={() => setRemoving(t)}><Trash2 size={18} /></button></div></td>
          <td><Image src="/eves-logo.svg" alt="EVES" width={40} height={45} unoptimized /></td><td>{t.id}</td><td>{t.subdomain}</td><td>{t.name}</td><td>{t.email}</td><td>{t.createdOn}</td><td>{t.createdBy}</td><td>{t.changedOn}</td><td>{t.changedBy}</td>
        </tr>)}</tbody>
      </table></div> : <DataEmpty />}
    </section>
    <Dialog open={draft !== null} onOpenChange={open => { if (!open) setDraft(null); }}>
      <DialogContent className={styles.dialog} showCloseButton={false}>
        <DialogTitle className="sr-only">{draft?.id ? "Edit" : "Create"} Tenant — {draft?.name || "New tenant"}</DialogTitle><DialogDescription className="sr-only">Tenant details and component configuration. Changes are saved in this browser.</DialogDescription>
        {draft && <form onSubmit={save} noValidate><Tabs value={tab} onValueChange={setTab}>
          <div className={styles.modalHeader}><TabsList className={styles.tabs}><TabsTrigger value="tenant" className={styles.tab}><Landmark size={22} />TENANT - {draft.name.toUpperCase() || "NEW"}</TabsTrigger><TabsTrigger value="components" className={styles.tab}><SlidersHorizontal size={22} />COMPONENTS</TabsTrigger></TabsList><button className={styles.headerButton} type="submit" aria-label="Save tenant" title="Save"><Save size={21} /></button><button className={styles.headerButton} type="button" aria-label="Close tenant" onClick={() => setDraft(null)}><X size={24} /></button></div>
          <div className={styles.modalBody}>
            <TabsContent value="tenant" className={styles.tenantForm}>
              <div className={styles.identity}><Image src="/eves-logo.svg" alt="EVES tenant logo" width={120} height={134} unoptimized /><div>{field("name", "Name", true)}{field("subdomain", "Subdomain", true, "text", Boolean(draft.id))}{field("email", "Email", true, "email")}</div></div>
              <div className={styles.addressGrid}>{field("address1", "Address 1")}{field("address2", "Address 2")}{field("postalCode", "Postal Code")}{field("city", "City")}{field("department", "Department")}<div className={styles.pair}>{field("region", "Region")}{field("country", "Country")}</div><div className={styles.pair}>{field("latitude", "Latitude", false, "number")}{field("longitude", "Longitude", false, "number")}</div><div className={styles.pair}>{field("contact", "Contact", true, "tel")}{address ? <a className={styles.place} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer"><MapPin size={18} />View Place</a> : <button className={styles.place} type="button" disabled><MapPin size={18} />View Place</button>}</div></div>
            </TabsContent>
            <TabsContent value="components" className={styles.components}>
              <h2>Components</h2>
              {componentNames.map(name => <section className={styles.component} key={name}>
                <div className={styles.componentHead}><button type="button" aria-label={`${expanded.includes(name) ? "Collapse" : "Expand"} ${name}`} aria-expanded={expanded.includes(name)} onClick={() => setExpanded(expanded.includes(name) ? expanded.filter(n => n !== name) : [...expanded, name])}>{expanded.includes(name) ? <Minus size={18} /> : <Plus size={18} />}</button><button type="button" role="switch" aria-checked={draft.components[name]} aria-label={`Enable ${name}`} className={styles.switch} onClick={() => setDraft({ ...draft, components: { ...draft.components, [name]: !draft.components[name] } })}><span /></button><span>{name}:1.0</span></div>
                {expanded.includes(name) && (name === "Reports/Analytics" ? <div className={styles.reporting}><label className={styles.type}>Type*<select aria-label="Reporting Type" value={type} disabled={!draft.components[name]} onChange={e => setType(e.target.value)}><option>Analytics</option><option>Reporting</option></select></label><fieldset className={styles.options} disabled={!draft.components[name]}>{type === "Analytics" ? analyticsOptions.map(option => <label key={option}><input type="checkbox" checked={draft.analytics.includes(option)} onChange={e => setDraft({ ...draft, analytics: e.target.checked ? [...draft.analytics, option] : draft.analytics.filter(v => v !== option) })} />{option}</label>) : ["Regulatory Reports", "Master Reports"].map(group => <div className={styles.reportGroup} key={group}><h3>{group}</h3>{reportOptions.filter(r => r.group === group).map(report => <label key={report.key}><input type="checkbox" checked={draft.reports[report.key]} onChange={e => setDraft({ ...draft, reports: { ...draft.reports, [report.key]: e.target.checked } })} />{report.label}</label>)}</div>)}</fieldset></div> : <div className={styles.componentDetail}>{name} is {draft.components[name] ? "enabled" : "disabled"} for this tenant.</div>)}
              </section>)}
            </TabsContent>
          </div>
        </Tabs></form>}
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(removing)} onOpenChange={open => { if (!open) setRemoving(null); }}><DialogContent><DialogTitle>Delete {removing?.name}?</DialogTitle><DialogDescription>This removes the tenant from this browser’s table.</DialogDescription><div className={styles.confirm}><Button variant="outline" onClick={() => setRemoving(null)}>Cancel</Button><Button variant="destructive" onClick={() => { if (removing && deleteTenant(removing.id)) { const id = removing.id; toast.success("Tenant deleted", { action: { label: "Undo", onClick: () => restoreTenant(id) } }); setRemoving(null); } }}>Delete tenant</Button></div></DialogContent></Dialog>
  </>;
}
