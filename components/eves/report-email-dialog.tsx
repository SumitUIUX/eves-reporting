"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Mail, FileText, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import styles from "./regulatory.module.css";

const registeredEmail = "sumit@example.com";

// Email delivery is not connected: no email is sent and the account email is never changed.
export function ReportEmailDialog({ onClose, agency, format, periodLabel, defaultName, ranges, selectedReports }: {
  onClose: () => void; agency: string; format: string; periodLabel: string; defaultName: string; ranges: { from: string; to: string }[]; selectedReports: string[];
}) {
  const displayDate = (value: string) => new Date(value + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const [name, setName] = useState(defaultName);
  const [emails, setEmails] = useState<string[]>([registeredEmail]);
  const [emailError, setEmailError] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const addEmails = () => {
    const entries = draftEmail.split(/[,;\s]+/).map(value => value.trim()).filter(Boolean);
    const invalid = entries.filter(value => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    if (!entries.length) { setEmailError("Enter an email address."); return; }
    if (invalid.length) { setEmailError("Check these email addresses: " + invalid.join(", ")); return; }
    const added = entries.filter((value, index) =>
      !emails.some(email => email.toLowerCase() === value.toLowerCase()) &&
      entries.findIndex(other => other.toLowerCase() === value.toLowerCase()) === index);
    if (!added.length) { setEmailError("These email addresses are already added."); return; }
    setEmails(current => [...current, ...added]);
    setDraftEmail("");
    setEmailError("");
    setEditing(false);
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={`${styles.emailDialog} max-h-[90dvh] overflow-y-auto`}>
      <DialogHeader>
        <DialogTitle>{confirmed ? "Delivery preview" : "Email report preview"}</DialogTitle>
        <DialogDescription className={confirmed ? "sr-only" : undefined}>{confirmed ? "Report delivery details" : "Add recipients, then review your reports."}</DialogDescription>
      </DialogHeader>
      <div className={styles.emailSummary}>
        Agency: <strong>{agency}</strong> · {format === "xlsx" ? "Excel" : "CSV"}<br />{periodLabel}
      </div>
      {confirmed ? <>
        <div className="rounded-lg border p-4" role="status">
          <FileText className="mb-3 size-6 text-primary" aria-hidden="true" />
          <p className="font-medium break-words">{name.trim()}</p>
          <p className="mt-2 text-sm font-medium" aria-live="polite">{emails.length} {emails.length === 1 ? "recipient" : "recipients"}</p>
          <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 text-sm">{emails.map(email => <li key={email.toLowerCase()} className="break-all">{email}</li>)}</ul>
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
        <p className="text-xs text-muted-foreground">Email delivery is not connected. No email will be sent.</p>
        <div className={styles.emailActions}>
          <Button variant="outline" onClick={() => setConfirmed(false)}>Back</Button>
          <Button onClick={() => { toast.error("Email delivery isn’t connected yet. No email was sent."); }}><Mail size={15} />Send email</Button>
        </div>
      </> : <>
        <div className={styles.field}>
          <label htmlFor="email-report-name">Subject</label>
          <Input id="email-report-name" value={name} maxLength={120} onChange={e => setName(e.target.value)} />
        </div>
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium" aria-live="polite"><Mail size={16} aria-hidden="true" />Recipients ({emails.length})</span>
            {!editing && <Button type="button" variant="link" size="sm" onClick={() => { setEmailError(""); setEditing(true); }}><Plus size={15} />Add email</Button>}
          </div>
          <ul className="max-h-48 overflow-y-auto space-y-2">
            {emails.map(email => <li key={email.toLowerCase()} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
              <span className="min-w-0 break-all">{email}</span>
              <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label={`Remove ${email}`} onClick={() => setEmails(current => current.filter(value => value !== email))}><X size={14} /></Button>
            </li>)}
          </ul>
          {!emails.length && <p className="text-sm text-muted-foreground">Add at least one recipient.</p>}
          {editing && <form className="mt-4" noValidate onSubmit={e => { e.preventDefault(); addEmails(); }}>
            <label htmlFor="report-delivery-email" className="mb-2 block text-sm">Email addresses</label>
            <Input id="report-delivery-email" type="text" inputMode="email" autoFocus value={draftEmail} onChange={e => { setDraftEmail(e.target.value); setEmailError(""); }} autoComplete="email" placeholder="name@company.com" aria-invalid={!!emailError} aria-describedby={emailError ? "recipient-error" : "recipient-help"} />
            <p id="recipient-help" className="mt-2 text-xs text-muted-foreground">Add one or paste multiple addresses separated by commas, spaces or semicolons.</p>
            {emailError && <p id="recipient-error" role="alert" className="mt-2 text-sm text-destructive">{emailError}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(false); setDraftEmail(""); setEmailError(""); }}>Cancel</Button>
              <Button type="submit" size="sm"><Plus size={14} />Add email</Button>
            </div>
          </form>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Email delivery is not connected</span>
          <div className={styles.emailActions}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={editing || !name.trim() || !emails.length} onClick={() => setConfirmed(true)}><Mail size={15} />Preview delivery</Button>
          </div>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}
