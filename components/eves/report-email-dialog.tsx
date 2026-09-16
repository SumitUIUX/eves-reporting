"use client";

import { useState } from "react";
import { Mail, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import styles from "./regulatory.module.css";

// There is no authenticated account or mail provider in this application yet.
// Keep the real availability visible; never accept an arbitrary recipient or
// claim a report was queued without a server-confirmed delivery request.
export function ReportEmailDialog({
  onClose,
  agency,
  format,
  periodLabel,
  defaultName,
}: {
  onClose: () => void;
  agency: string;
  format: string;
  periodLabel: string;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className={styles.emailDialog}>
        <DialogHeader>
          <DialogTitle>Email Delivery</DialogTitle>
          <DialogDescription>
            This reporting period requires delivery to your registered email.
          </DialogDescription>
        </DialogHeader>
        <div className={styles.emailSummary}>
          Agency: <strong>{agency}</strong> · Export type:{" "}
          <strong>{format === "xlsx" ? "Excel" : "CSV"}</strong>
          <br />
          {periodLabel}
        </div>
        <div className={styles.field}>
          <label htmlFor="email-report-name">Report name</label>
          <Input
            id="email-report-name"
            value={name}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="registered-report-email">Registered email</label>
          <Input
            id="registered-report-email"
            readOnly
            value=""
            placeholder="Registered email unavailable"
            aria-describedby="email-availability"
          />
        </div>
        <p className={styles.emailUnavailable} id="email-availability">
          <Info size={16} aria-hidden="true" />
          <span>
            Email delivery is not connected in this workspace. Connect your EVES
            account and email delivery service to send reports. No report has
            been sent.
          </span>
        </p>
        <div className={styles.emailActions}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button disabled aria-describedby="email-availability">
            <Mail size={15} />
            Send report by email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
