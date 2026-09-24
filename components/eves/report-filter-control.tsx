"use client";

import { useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FilterPanel } from "./filter-panel";
import {
  emptyFilters,
  type ReportConfig,
  type ReportFilters,
} from "@/lib/eves/report-config";
import type { ReportDataset, ReportKind } from "@/lib/eves/types";
import { Choice } from "./shared";
import { ReportEntitySelector } from "./report-entity-selector";
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
  const id = useId();
  const activeCount =
    Object.values(applied.values).filter((value) =>
      Array.isArray(value) ? value.length > 0 : value !== "all",
    ).length +
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

  const form = (
    <form className={styles.form} onSubmit={apply} noValidate>
      <div className={styles.fields}>
        {config.filters.map((filter) => {
          const options = [
            ...new Set(data.rows.map((row) => row[filter.column])),
          ]
            .filter((value) => value && value !== "-" && value !== "—")
            .sort();
          const modal =
            filter.label === "Site" ||
            filter.label === "Charger" ||
            filter.label === "EVSE" ||
            filter.label === "Project tag";
          const value = draft.values[filter.column] ?? "all";
          return (
            <div className={styles.field} key={filter.column}>
              <label htmlFor={`${id}-filter-${filter.column}`}>
                {filter.label}
              </label>
              {modal ? (
                <ReportEntitySelector
                  id={`${id}-filter-${filter.column}`}
                  label={filter.label}
                  options={options}
                  selected={
                    Array.isArray(value)
                      ? value
                      : value === "all"
                        ? []
                        : [value]
                  }
                  onChange={(selected) =>
                    setDraft((previous) => ({
                      ...previous,
                      values: {
                        ...previous.values,
                        [filter.column]: selected.length ? selected : "all",
                      },
                    }))
                  }
                />
              ) : (
                <Choice
                  id={`${id}-filter-${filter.column}`}
                  label={filter.label}
                  value={Array.isArray(value) ? "all" : value}
                  onChange={(nextValue) =>
                    setDraft((previous) => ({
                      ...previous,
                      values: {
                        ...previous.values,
                        [filter.column]: nextValue,
                      },
                    }))
                  }
                  options={[
                    {
                      value: "all",
                      label: `All ${filter.label.toLowerCase()}${filter.label.endsWith("s") ? "" : "s"}`,
                    },
                    ...options,
                  ]}
                  className={styles.select}
                />
              )}
            </div>
          );
        })}
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

  return (
    <FilterPanel
      title="Report filters"
      presentation={kind === "intervals" ? "drawer" : "responsive"}
      open={open}
      onOpenChange={changeOpen}
      activeCount={activeCount}
    >
      {form}
    </FilterPanel>
  );
}
