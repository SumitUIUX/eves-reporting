"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import styles from "./regulatory.module.css";
import { DataEmpty } from "./shared";

export interface ReportOption {
  value: string;
  label: string;
}

export function ReportMultiSelect({
  id,
  label,
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
}: {
  id: string;
  label: string;
  options: ReportOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const visible = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const summary =
    selected.length === 1
      ? options.find((option) => option.value === selected[0])?.label
      : `${selected.length} selected`;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={styles.selectTrigger}
          disabled={disabled}
          aria-label={label}
        >
          <span>{selected.length ? summary : placeholder}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className={styles.multiPopover}
        aria-label={label}
      >
        <div className={styles.search}>
          <Search size={14} aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>
        <div className={styles.multiActions}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!visible.length}
            onClick={() =>
              onChange([
                ...new Set([
                  ...selected,
                  ...visible.map((option) => option.value),
                ]),
              ])
            }
          >
            {search.trim() ? "Select matches" : "Select all"}
          </Button>
          {selected.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          )}
        </div>
        <div
          className={styles.multiOptions}
          role="group"
          aria-label={`${label} options`}
        >
          {visible.map((option) => (
            <label key={option.value} className={styles.multiOption}>
              <Checkbox
                checked={selected.includes(option.value)}
                aria-label={option.label}
                onCheckedChange={(checked) =>
                  onChange(
                    checked === true
                      ? [...new Set([...selected, option.value])]
                      : selected.filter((value) => value !== option.value),
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
          {!visible.length && <DataEmpty compact />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
