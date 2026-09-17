"use client";

import type { ReactNode } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emptyTagFilters, type TagFilters } from "@/lib/eves/tag-filters";
import type { ProjectTag } from "@/lib/eves/types";
import { Choice, SearchInput } from "./shared";
import styles from "./project-tag-toolbar.module.css";

interface ToolbarProps {
  tags: ProjectTag[];
  filters: TagFilters;
  onChange: (filters: TagFilters) => void;
  resultCount: number;
  loading: boolean;
  onReload: () => void;
  onExport: () => void;
  columnControl: ReactNode;
}

export function ProjectTagToolbar({
  tags,
  filters,
  onChange,
  resultCount,
  loading,
  onReload,
  onExport,
  columnControl,
}: ToolbarProps) {
  const funding = tags.filter((tag) => tag.type === "Funding Agency").length;
  const count =
    Number(filters.agency !== "all") + Number(filters.mapping !== "all");
  const hasFilters = count > 0 || filters.type !== "all" || !!filters.search;
  const mappingLabel = filters.mapping === "unmapped" ? "Not mapped" : "Mapped";

  return (
    <div className={styles.toolbar}>
      <div className={styles.search}>
        <SearchInput
          value={filters.search}
          onChange={(search) => onChange({ ...filters, search })}
          placeholder="Search project name or award ID…"
        />
      </div>
      <div className={styles.controls}>
        <Choice
          value={filters.type}
          label="Filter by tag type"
          className={styles.typeSelect}
          onChange={(type) =>
            onChange({
              ...filters,
              type: type as TagFilters["type"],
              agency: type === "Zone" ? "all" : filters.agency,
            })
          }
          options={[
            { value: "all", label: `All tags (${tags.length})` },
            { value: "Funding Agency", label: `Funding agency (${funding})` },
            { value: "Zone", label: `Zones (${tags.length - funding})` },
          ]}
        />
      </div>
      {hasFilters && (
        <div className={styles.applied} aria-label="Applied filters">
          {filters.agency !== "all" && (
            <button
              className={styles.chip}
              onClick={() => onChange({ ...filters, agency: "all" })}
              aria-label={`Remove ${filters.agency} agency filter`}
            >
              {filters.agency}
              <X size={12} />
            </button>
          )}
          {filters.mapping !== "all" && (
            <button
              className={styles.chip}
              onClick={() => onChange({ ...filters, mapping: "all" })}
              aria-label="Remove site mapping filter"
            >
              {mappingLabel}
              <X size={12} />
            </button>
          )}
          <button
            className={styles.clear}
            onClick={() => onChange(emptyTagFilters)}
          >
            Clear all
          </button>
        </div>
      )}
      <div className={styles.actions}>
        {columnControl}
        <span className={styles.resultCount} role="status">
          {loading
            ? "Loading…"
            : `${resultCount} ${resultCount === 1 ? "tag" : "tags"}`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh project tags"
          onClick={onReload}
          disabled={loading}
        >
          <RefreshCw size={15} />
        </Button>
        <Button
          variant="outline"
          disabled={!resultCount || loading}
          onClick={onExport}
          aria-label="Export project tags"
          className={styles.export}
        >
          <Download size={15} />
          <span>Export</span>
        </Button>
      </div>
    </div>
  );
}
