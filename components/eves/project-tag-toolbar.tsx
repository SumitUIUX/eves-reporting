"use client";

import { RefreshButton } from "./refresh-button";

import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type TagFilters } from "@/lib/eves/tag-filters";
import type { ProjectTag } from "@/lib/eves/types";
import { SearchInput } from "./shared";
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
  filters,
  onChange,
  resultCount,
  loading,
  onReload,
  onExport,
  columnControl,
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.search}>
        <SearchInput
          value={filters.search}
          onChange={(search) => onChange({ ...filters, search })}
          placeholder="search by site name or site ID"
        />
      </div>
      <div className={styles.actions}>
        {columnControl}
        <RefreshButton label="Refresh project tags" onClick={onReload} refreshing={loading} />
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
