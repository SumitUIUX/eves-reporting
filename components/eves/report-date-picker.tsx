"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import styles from "./regulatory.module.css";

function calendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return value ? new Date(year, month - 1, day) : undefined;
}

export function ReportDatePicker({
  id,
  label,
  value,
  onChange,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = calendarDate(value);
  const minimum = min ? calendarDate(min) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          className={styles.dateTrigger}
          aria-label={label}
        >
          <CalendarDays size={15} aria-hidden="true" />
          {date
            ? date.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className={styles.calendarPopover}
        aria-label={label}
      >
        <Calendar
          mode="single"
          required
          selected={date}
          defaultMonth={date}
          disabled={minimum ? { before: minimum } : undefined}
          onSelect={(selected) => {
            onChange(
              `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`,
            );
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
