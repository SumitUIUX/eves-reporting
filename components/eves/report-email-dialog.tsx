"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import styles from "./regulatory.module.css";

const registeredEmail = "sumit@example.com";

// Sample delivery preview: no email is sent and the account email is never changed.
export function ReportEmailDialog({ onClose, agency, format, periodLabel, defaultName, ranges, selectedReports }: {
  onClose: () => void; agency: string; format: string; periodLabel: string; defaultName: string; ranges: { from: string; to: string }[]; selectedReports: string[];
}) {
  const displayDate = (value: string) => new Date(value + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(registeredEmail);
  const [draftEmail, setDraftEmail] = useState(registeredEmail);
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={`${styles.emailDialog} max-h-[90dvh] overflow-y-auto`}>
      <DialogHeader>
        <DialogTitle>{confirmed ? "Delivery preview" : "Email reports"}</DialogTitle>
        <DialogDescription className={confirmed ? "sr-only" : undefined}>{confirmed ? "Report delivery details" : "Choose where to receive all files in this export."}</DialogDescription>
      </DialogHeader>
      <div className={styles.emailSummary}>
        Agency: <strong>{agency}</strong> · {format === "xlsx" ? "Excel" : "CSV"}<br />{periodLabel}
      </div>
      {confirmed ? <>
        <div className="rounded-lg border p-4" role="status">
          <CheckCircle2 className="mb-3 size-6 text-primary" aria-hidden="true" />
          <p className="font-medium break-words">{name.trim()}</p>
          <p className="mt-2 text-sm text-muted-foreground">Delivery emails</p>
          <p className="font-medium break-all">{email}</p>
          <div className="mt-4 space-y-3 border-t pt-4 text-sm">
            {ranges.map((range, index) => <dl key={`${range.from}-${range.to}-${index}`} className="grid grid-cols-2 gap-3">
              <div><dt className="text-muted-foreground">From</dt><dd className="mt-1 font-medium">{displayDate(range.from)}</dd></div>
              <div><dt className="text-muted-foreground">To</dt><dd className="mt-1 font-medium">{displayDate(range.to)}</dd></div>
            </dl>)}
            <div><p className="text-muted-foreground">Selected reports ({selectedReports.length})</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">{selectedReports.map(report => <li key={report}>{report}</li>)}</ul>
            </div>
          </div>

        </div>
        <div className={styles.emailActions}>
          <Button variant="outline" onClick={() => setConfirmed(false)}>Back</Button>
          <Button onClick={() => { toast.success("Delivery preview confirmed"); onClose(); }}><Mail size={15} />Send</Button>
        </div>
      </> : <>
        <div className={styles.field}>
          <label htmlFor="email-report-name">Subject</label>
          <Input id="email-report-name" value={name} maxLength={120} onChange={e => setName(e.target.value)} />
        </div>
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium"><Mail size={16} aria-hidden="true" />Send files to</span>
            {!editing && <Button type="button" variant="link" size="sm" onClick={() => { setDraftEmail(email); setEditing(true); }}>Change email</Button>}
          </div>
          {editing ? <form onSubmit={e => { e.preventDefault(); setEmail([...new Set(draftEmail.split(",").map(value => value.trim()).filter(Boolean))].join(", ")); setEditing(false); }}>
            <label htmlFor="report-delivery-email" className="mb-2 block text-sm">Email addresses</label>
            <Input id="report-delivery-email" type="email" multiple required autoFocus maxLength={2000} value={draftEmail} onChange={e => setDraftEmail(e.target.value.replace(/;/g, ","))} autoComplete="email" />
            <p className="mt-2 text-xs text-muted-foreground">Separate addresses with commas. Applies to this export only.</p>
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" size="sm">Use these emails</Button>
            </div>
          </form> : <>
            <p className="break-all font-medium">{email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{email === registeredEmail ? "Registered email" : "For this export only"}</p>
            {email !== registeredEmail && <Button type="button" variant="link" size="sm" className="mt-2 px-0" onClick={() => setEmail(registeredEmail)}>Use registered email</Button>}
          </>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Sample delivery preview</span>
          <div className={styles.emailActions}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={editing || !name.trim()} onClick={() => setConfirmed(true)}><Mail size={15} />Preview delivery</Button>
          </div>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}
