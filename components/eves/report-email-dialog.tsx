"use client";

import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import styles from "./regulatory.module.css";

const registeredEmail = "sumit@example.com";

// Sample delivery preview: no email is sent and the account email is never changed.
export function ReportEmailDialog({ onClose, agency, format, periodLabel, defaultName }: {
  onClose: () => void; agency: string; format: string; periodLabel: string; defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(registeredEmail);
  const [draftEmail, setDraftEmail] = useState(registeredEmail);
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={styles.emailDialog}>
      <DialogHeader>
        <DialogTitle>{confirmed ? "Delivery preview" : "Email reports"}</DialogTitle>
        <DialogDescription>{confirmed ? "Review the destination for your report files." : "Choose where to receive all files in this export."}</DialogDescription>
      </DialogHeader>
      <div className={styles.emailSummary}>
        <strong>{agency}</strong> · {format === "xlsx" ? "Excel" : "CSV"}<br />{periodLabel}
      </div>
      {confirmed ? <>
        <div className="rounded-lg border p-4" role="status">
          <CheckCircle2 className="mb-3 size-6 text-primary" aria-hidden="true" />
          <p className="font-medium break-words">{name.trim()}</p>
          <p className="mt-2 text-sm text-muted-foreground">Delivery email</p>
          <p className="font-medium break-all">{email}</p>
          <p className="mt-3 text-sm text-muted-foreground">Sample preview only. No email has been sent.</p>
        </div>
        <div className={styles.emailActions}>
          <Button variant="outline" onClick={() => setConfirmed(false)}>Back</Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </> : <>
        <div className={styles.field}>
          <label htmlFor="email-report-name">Report name</label>
          <Input id="email-report-name" value={name} maxLength={120} onChange={e => setName(e.target.value)} />
        </div>
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium"><Mail size={16} aria-hidden="true" />Send files to</span>
            {!editing && <Button type="button" variant="link" size="sm" onClick={() => { setDraftEmail(email); setEditing(true); }}>Change email</Button>}
          </div>
          {editing ? <form onSubmit={e => { e.preventDefault(); setEmail(draftEmail.trim()); setEditing(false); }}>
            <label htmlFor="report-delivery-email" className="mb-2 block text-sm">Email address</label>
            <Input id="report-delivery-email" type="email" required autoFocus maxLength={254} value={draftEmail} onChange={e => setDraftEmail(e.target.value)} autoComplete="email" />
            <p className="mt-2 text-xs text-muted-foreground">For this export only. Your registered email stays the same.</p>
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" size="sm">Use this email</Button>
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
