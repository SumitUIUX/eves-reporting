"use client";
import { useState } from "react";
import { Pencil, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Choice, DataEmpty } from "./shared";
import { analyticsOptions, useTenant, type Tenant } from "./tenant-context";
import styles from "./tenants.module.css";
export function Tenants() {
  const { tenants, active, selectTenant, saveTenant } = useTenant();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Tenant | null>(null);
  const [type, setType] = useState("Analytics");
  const rows = tenants.filter(t => `${t.id} ${t.name} ${t.subdomain} ${t.email}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <section className="panel" aria-label="Tenants">
      <div className={styles.toolbar}>
        <Input aria-label="Search tenants" placeholder="Search tenants…" value={query} onChange={e => setQuery(e.target.value)} />
        <span>Demo tenants · {rows.length} records</span>
      </div>
      {rows.length ? <div className={styles.tableScroll}><table className={styles.table}>
        <thead><tr><th>Tenant</th><th>ID</th><th>Subdomain</th><th>Email</th><th>Reporting</th><th>Actions</th></tr></thead>
        <tbody>{rows.map(t => <tr key={t.id}>
          <td><span className={styles.name}><Building2 size={18} />{t.name}</span></td><td>{t.id}</td><td>{t.subdomain}</td><td>{t.email}</td>
          <td>{[t.regulatory && "Regulatory Reports", t.master && "Master Reports"].filter(Boolean).join(", ") || "None"}</td>
          <td><div className={styles.actions}><Button variant="outline" size="sm" onClick={() => selectTenant(t.id)} disabled={active.id === t.id}>{active.id === t.id ? "Current tenant" : "Use tenant"}</Button><Button variant="ghost" size="icon" aria-label={`Edit ${t.name}`} onClick={() => { setDraft({ ...t, analytics: [...t.analytics] }); setType("Analytics"); }}><Pencil size={16} /></Button></div></td>
        </tr>)}</tbody>
      </table></div> : <DataEmpty />}
    </section>
    <Dialog open={draft !== null} onOpenChange={open => { if (!open) setDraft(null); }}>
      <DialogContent className={styles.dialog}>
        <DialogHeader><DialogTitle>Edit Tenant — {draft?.name}</DialogTitle><DialogDescription>Components · Reporting configuration. Changes are saved in this browser.</DialogDescription></DialogHeader>
        {draft && <div className={styles.configuration}>
          <h2>Reporting Analytics: 1.0</h2>
          <label className={styles.type}>Reporting Type<Choice label="Reporting Type" value={type} onChange={setType} options={["Analytics", "Reporting"]} /></label>
          <fieldset className={styles.options}><legend>{type}</legend>
            {type === "Analytics" ? analyticsOptions.map(option => <label key={option}><input type="checkbox" checked={draft.analytics.includes(option)} onChange={e => setDraft({ ...draft, analytics: e.target.checked ? [...draft.analytics, option] : draft.analytics.filter(v => v !== option) })} />{option}</label>) : <>
              <label><input type="checkbox" checked={draft.regulatory} onChange={e => setDraft({ ...draft, regulatory: e.target.checked })} />Regulatory Reports</label>
              <label><input type="checkbox" checked={draft.master} onChange={e => setDraft({ ...draft, master: e.target.checked })} />Master Reports</label>
            </>}
          </fieldset>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={() => { if (draft && saveTenant(draft)) { toast.success("Tenant configuration saved"); setDraft(null); } }}>Save changes</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
