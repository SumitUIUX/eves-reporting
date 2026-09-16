"use client";

import { useId, useState } from "react";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  emptyFilters,
  type ReportConfig,
  type ReportFilters,
} from "@/lib/eves/report-config";
import type { ReportDataset, ReportKind } from "@/lib/eves/types";
import { Choice } from "./shared";
import styles from "./report-filter-control.module.css";

interface ReportFilterControlProps {
  kind: ReportKind;
  config: ReportConfig;
  data: ReportDataset;
  applied: ReportFilters;
  onApply: (filters: ReportFilters) => void;
}

export function ReportFilterControl({
  kind,
  config,
  data,
  applied,
  onApply,
}: ReportFilterControlProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(applied);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();
  const id = useId();
  const activeCount =
    Object.values(applied.values).filter((value) => value !== "all").length +
    Number(!!applied.from) +
    Number(!!applied.to) +
    Number(applied.errors);

  function changeOpen(next: boolean) {
    // Closing without applying never changes the report. Reopen with its saved scope.
    if (next) {
      setDraft(applied);
      setError("");
    }
    setOpen(next);
  }

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) {
      setError("The end date must be on or after the start date.");
      return;
    }
    onApply(draft);
    setError("");
    setOpen(false);
  }

  function reset() {
    setDraft(emptyFilters);
    setError("");
    onApply(emptyFilters);
  }

  const trigger = (
    <Button
      variant="outline"
      className={styles.trigger}
      data-active={activeCount > 0}
      aria-label={activeCount ? `Filters (${activeCount} applied)` : "Filters"}
    >
      <SlidersHorizontal size={16} />
      Filters
      {activeCount > 0 && (
        <span className={styles.count} aria-hidden="true">
          {activeCount}
        </span>
      )}
    </Button>
  );

  const form = (
    <form className={styles.form} onSubmit={apply} noValidate>
      <div className={styles.fields}>
        {config.filters.map((filter) => (
          <div className={styles.field} key={filter.column}>
            <label htmlFor={`${id}-filter-${filter.column}`}>
              {filter.label}
            </label>
            <Choice
              id={`${id}-filter-${filter.column}`}
              label={filter.label}
              value={draft.values[filter.column] ?? "all"}
              onChange={(value) =>
                setDraft((previous) => ({
                  ...previous,
                  values: { ...previous.values, [filter.column]: value },
                }))
              }
              options={[
                {
                  value: "all",
                  label: `All ${filter.label.toLowerCase()}${filter.label.endsWith("s") ? "" : "s"}`,
                },
                ...[...new Set(data.rows.map((row) => row[filter.column]))]
                  .filter((value) => value && value !== "-" && value !== "—")
                  .sort(),
              ]}
              className={styles.select}
            />
          </div>
        ))}
        {config.dateColumn !== undefined && (
          <>
            <div className={styles.field}>
              <label htmlFor={`${id}-from`}>From date</label>
              <Input
                id={`${id}-from`}
                type="date"
                value={draft.from}
                onChange={(event) => {
                  setDraft((previous) => ({
                    ...previous,
                    from: event.target.value,
                  }));
                  setError("");
                }}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${id}-to`}>To date</label>
              <Input
                id={`${id}-to`}
                type="date"
                value={draft.to}
                min={draft.from || undefined}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) => {
                  setDraft((previous) => ({
                    ...previous,
                    to: event.target.value,
                  }));
                  setError("");
                }}
              />
            </div>
          </>
        )}
        {kind === "sessions" && (
          <label className={styles.errorToggle}>
            <Switch
              checked={draft.errors}
              onCheckedChange={(errors) =>
                setDraft((previous) => ({ ...previous, errors }))
              }
              aria-label="Only sessions with errors"
            />
            Only sessions with errors
          </label>
        )}
      </div>
      {error && (
        <p className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      <div className={styles.footer}>
        <Button variant="ghost" type="button" onClick={reset}>
          <RotateCcw size={14} />
          Reset filters
        </Button>
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={changeOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent className={styles.mobile}>
          <SheetHeader className={styles.header}>
            <SheetTitle>Report filters</SheetTitle>
            <SheetDescription>Choose your scope, then apply.</SheetDescription>
          </SheetHeader>
          {form}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className={styles.popover}
        aria-label="Report filters"
      >
        <div className={styles.heading}>
          <h2>Report filters</h2>
          <Button
            variant="ghost"
            size="icon"
            className={styles.close}
            aria-label="Close filters"
            onClick={() => changeOpen(false)}
          >
            <X size={16} />
          </Button>
        </div>
        {form}
      </PopoverContent>
    </Popover>
  );
}
