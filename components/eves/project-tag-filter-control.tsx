"use client";

import { useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { filterTags, type TagFilters } from "@/lib/eves/tag-filters";
import type { ProjectTag } from "@/lib/eves/types";
import { FilterPanel } from "./filter-panel";
import { Choice } from "./shared";
import styles from "./report-filter-control.module.css";

type Scope = Pick<TagFilters, "agency" | "mapping">;
export function ProjectTagFilterControl({
  tags,
  applied,
  onApply,
}: {
  tags: ProjectTag[];
  applied: TagFilters;
  onApply: (filters: TagFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Scope>(() => ({
    agency: applied.agency,
    mapping: applied.mapping,
  }));
  const id = useId();
  const activeCount =
    Number(applied.agency !== "all") + Number(applied.mapping !== "all");
  const matches = filterTags(tags, { ...applied, ...draft }).length;
  function changeOpen(next: boolean) {
    if (next) setDraft({ agency: applied.agency, mapping: applied.mapping });
    setOpen(next);
  }
  function reset() {
    const cleared: Scope = { agency: "all", mapping: "all" };
    setDraft(cleared);
    onApply({ ...applied, ...cleared });
  }
  return (
    <FilterPanel
      title="Project tag filters"
      open={open}
      onOpenChange={changeOpen}
      activeCount={activeCount}
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onApply({ ...applied, ...draft });
          setOpen(false);
        }}
      >
        <div className={styles.fields}>
          <fieldset className={styles.field} disabled={applied.type === "Zone"}>
            <label htmlFor={`${id}-agency`}>Funding agency</label>
            <Choice
              id={`${id}-agency`}
              value={draft.agency}
              label="Filter by agency"
              className={styles.select}
              onChange={(agency) =>
                setDraft((previous) => ({
                  ...previous,
                  agency: agency as Scope["agency"],
                }))
              }
              options={[
                { value: "all", label: "All agencies" },
                "CEC",
                "CIC",
                "Cal-EvIP",
                "NEVI",
              ]}
            />
            {applied.type === "Zone" && (
              <small className="text-muted-foreground">
                Agency applies to funding tags.
              </small>
            )}
          </fieldset>
          <div className={styles.field}>
            <label htmlFor={`${id}-mapping`}>Site mapping</label>
            <Choice
              id={`${id}-mapping`}
              value={draft.mapping}
              label="Filter by site mapping"
              className={styles.select}
              onChange={(mapping) =>
                setDraft((previous) => ({
                  ...previous,
                  mapping: mapping as Scope["mapping"],
                }))
              }
              options={[
                { value: "all", label: "All mapping statuses" },
                { value: "mapped", label: "Mapped to sites" },
                { value: "unmapped", label: "Not mapped yet" },
              ]}
            />
          </div>
        </div>
        <p className="px-5 pb-4 text-xs text-muted-foreground" role="status">
          {matches} matching {matches === 1 ? "tag" : "tags"}
        </p>
        <div className={styles.footer}>
          <Button variant="ghost" type="button" onClick={reset}>
            <RotateCcw size={14} />
            Reset filters
          </Button>
          <Button type="submit">Apply filters</Button>
        </div>
      </form>
    </FilterPanel>
  );
}
