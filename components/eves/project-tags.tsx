"use client";
import { useEffect, useState } from "react";
import {
  Tags,
  MapPin,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Link2,
  Landmark,
  Tag,
  ArrowDownUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useProjectTags } from "@/lib/eves/use-project-tags";
import {
  emptyTagFilters,
  filterTags,
  type TagFilters,
} from "@/lib/eves/tag-filters";
import type { ProjectTag, TagInput } from "@/lib/eves/types";
import { downloadCsv } from "@/lib/eves/export";
import {
  PageActions,
  Metric,
  TablePagination,
  DataEmpty,
  DataLoading,
  DataError,
  Saving,
} from "./shared";
import { TagEditor } from "./tag-editor";
import { MappingEditor } from "./mapping-editor";
import { ProjectTagToolbar } from "./project-tag-toolbar";
import { ProjectTagFilterControl } from "./project-tag-filter-control";
import { ColumnVisibilityControl } from "./column-visibility-control";
import headerStyles from "./report-page.module.css";

const tagColumnLabels = [
  "Project / zone name",
  "Tag type",
  "Agency",
  "Mapped infrastructure",
  "Created by",
  "Created on",
];

function tagColumnValue(tag: ProjectTag, column: number) {
  switch (column) {
    case 0:
      return tag.name;
    case 1:
      return tag.type;
    case 2:
      return tag.agency;
    case 3:
      return Object.keys(tag.mappings).length;
    case 4:
      return tag.createdBy;
    case 5:
      return tag.createdAt;
    default:
      return "";
  }
}

export function ProjectTags() {
  const {
    tags,
    loading,
    error,
    reload,
    save,
    remove,
    source,
    workspaceNotConfigured,
  } = useProjectTags();
  const isSample = source === "sample";
  const workspaceEmpty =
    source === "workspace" && (workspaceNotConfigured || !!error);
  const pending = loading || (!!error && !workspaceEmpty);
  const [columns, setColumns] = useState<number[]>(() =>
    tagColumnLabels.map((_, index) => index),
  );
  const [filters, setFilters] = useState<TagFilters>(emptyTagFilters);
  const     [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [sort, setSort] = useState<{ column: number; asc: boolean }>({
      column: 5,
      asc: true,
    }),
    [editor, setEditor] = useState<ProjectTag | "new" | null>(null),
    [mapping, setMapping] = useState<ProjectTag | null>(null),
    [deleting, setDeleting] = useState<ProjectTag | null>(null),
    [busy, setBusy] = useState(false),
    [deleteError, setDeleteError] = useState("");
  const filtered = filterTags(tags, filters).sort((a, b) => {
    const left = tagColumnValue(a, sort.column);
    const right = tagColumnValue(b, sort.column);
    const result =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true });
    return result * (sort.asc ? 1 : -1);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);
  const funding = tags.filter((t) => t.type === "Funding Agency").length;
  const sites = new Set(tags.flatMap((t) => Object.keys(t.mappings))).size;
  function changeFilters(next: TagFilters) {
    setFilters(next);
    setPage(1);
  }
  useEffect(() => {
    setFilters(emptyTagFilters);
    setPage(1);
    setEditor(null);
    setMapping(null);
    setDeleting(null);
  }, [source]);
  async function persist(input: TagInput, tag?: ProjectTag) {
    const result = await save(input, tag);
    toast.success(
      isSample
        ? "Sample tag saved in this browser"
        : tag
          ? "Changes saved"
          : "Project tag created",
    );
    return result;
  }
  async function deleteTag() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      await remove(deleting);
      toast.success(
        isSample
          ? "Sample tag deleted from this browser"
          : "Project tag deleted",
      );
      setDeleting(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete tag.");
    } finally {
      setBusy(false);
    }
  }
  function exportTags() {
    downloadCsv(
      {
        headers: [
          ...(isSample ? ["Data source"] : []),
          "Type",
          "Agency Name",
          "Award ID",
          "Project Name",
          "Zone Name",
          "Sites Mapped",
          "Chargers Mapped",
          "Created By",
          "Created Date",
        ],
        rows: filtered.map((t) => [
          ...(isSample ? ["Fictional sample data"] : []),
          t.type,
          t.agency,
          t.awardId,
          t.type === "Funding Agency" ? t.name : "",
          t.type === "Zone" ? t.name : "",
          String(Object.keys(t.mappings).length),
          String(Object.values(t.mappings).flat().length),
          t.createdBy,
          t.createdAt,
        ]),
      },
      isSample ? "eves-sample-project-tags" : "eves-project-tags",
    );
    toast.success(
      isSample ? "Sample project tags exported" : "Project tags exported",
    );
  }
  return (
    <>
      <div className={headerStyles.header}>
        <PageActions>
          <ProjectTagFilterControl
            tags={tags}
            applied={filters}
            onApply={changeFilters}
          />
          <Button
            onClick={() => setEditor("new")}
            disabled={loading || !!error}
          >
            <Plus size={16} />
            Create project tag
          </Button>
        </PageActions>
      </div>
      <div className="metrics">
        <Metric
          label="Total project tags"
          value={pending ? "—" : tags.length}
          note="Across your workspace"
          icon={Tags}
        />
        <Metric
          label="Funding agency tags"
          value={pending ? "—" : funding}
          note="Projects linked to funding"
          icon={Landmark}
        />
        <Metric
          label="Zone tags"
          value={pending ? "—" : tags.length - funding}
          note="Geographic reporting groups"
          icon={MapPin}
        />
        <Metric
          label="Sites mapped"
          value={pending ? "—" : sites}
          note="Unique sites across all tags"
          icon={Building2}
        />
      </div>
      <section className="panel" aria-label="Project tags">
        <ProjectTagToolbar
          tags={tags}
          filters={filters}
          onChange={changeFilters}
          resultCount={filtered.length}
          loading={loading}
          onReload={() => void reload()}
          onExport={exportTags}
          columnControl={
            <ColumnVisibilityControl
              labels={tagColumnLabels}
              columns={columns}
              onChange={setColumns}
              compactOnMobile
            />
          }
        />
        {loading ? (
          <DataLoading />
        ) : workspaceEmpty ? (
          <DataEmpty />
        ) : error ? (
          <DataError message={error} retry={() => void reload()} />
        ) : !filtered.length ? (
          <DataEmpty>
            {tags.length ? (
              <Button
                variant="outline"
                onClick={() => changeFilters(emptyTagFilters)}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setEditor("new")}>
                <Plus size={15} />
                Create project tag
              </Button>
            )}
          </DataEmpty>
        ) : (
          <Table className="eves-table">
            <TableHeader>
              <TableRow>
                <TableHead>Action(s)</TableHead>
                {columns.map((column) => (
                  <TableHead
                    key={column}
                    aria-sort={
                      sort.column === column
                        ? sort.asc
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className="flex items-center gap-2"
                      onClick={() =>
                        setSort((current) => ({
                          column,
                          asc: current.column === column ? !current.asc : true,
                        }))
                      }
                    >
                      {tagColumnLabels[column]}
                      <ArrowDownUp size={12} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${t.name}`}
                        onClick={() => setEditor(t)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Map sites for ${t.name}`}
                        onClick={() => setMapping(t)}
                      >
                        <Link2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        aria-label={`Delete ${t.name}`}
                        onClick={() => {
                          setDeleting(t);
                          setDeleteError("");
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                  {columns.includes(0) && (
                    <TableCell>
                      <div className="project-cell">
                        <span
                          className={`project-icon ${t.type === "Zone" ? "zone" : ""}`}
                        >
                          {t.type === "Zone" ? (
                            <MapPin size={18} />
                          ) : (
                            <Tag size={18} />
                          )}
                        </span>
                        <div>
                          <button
                            className="project-name hover:text-primary text-left"
                            onClick={() => setEditor(t)}
                          >
                            {t.name}
                          </button>
                          <div className="project-id">
                            {t.type === "Zone"
                              ? "Geographic zone"
                              : t.awardId || "No award ID"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {columns.includes(1) && (
                    <TableCell>
                      <span
                        className={`type-badge ${t.type === "Zone" ? "zone" : ""}`}
                      >
                        {t.type === "Zone" ? (
                          <MapPin size={11} />
                        ) : (
                          <Landmark size={11} />
                        )}{" "}
                        {t.type}
                      </span>
                    </TableCell>
                  )}
                  {columns.includes(2) && (
                    <TableCell>
                      {t.agency ? (
                        <span className="agency">{t.agency}</span>
                      ) : (
                        <span className="text-[#b1b5c0]">—</span>
                      )}
                    </TableCell>
                  )}
                  {columns.includes(3) && (
                    <TableCell>
                      <button
                        className="flex flex-col gap-2 hover:text-primary"
                        onClick={() => setMapping(t)}
                        aria-label={`Map sites for ${t.name}`}
                      >
                        <span className="mapping-count">
                          <Building2 />
                          <strong>{Object.keys(t.mappings).length}</strong>{" "}
                          sites
                        </span>
                        <span className="mapping-count">
                          <Link2 />
                          <strong>
                            {Object.values(t.mappings).flat().length}
                          </strong>{" "}
                          chargers
                        </span>
                      </button>
                    </TableCell>
                  )}
                  {columns.includes(4) && (
                    <TableCell>
                      <div className="table-person">
                        <span className="avatar">
                          {t.createdBy
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        {t.createdBy}
                      </div>
                    </TableCell>
                  )}
                  {columns.includes(5) && (
                    <TableCell>
                      <span className="date-cell">
                        {new Date(t.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && !error && (
          <TablePagination
            total={filtered.length}
            page={current}
            size={size}
            setPage={setPage}
            setSize={setSize}
          />
        )}
      </section>
      {editor && (
        <TagEditor
          isSample={isSample}
          tag={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onSave={persist}
        />
      )}
      {mapping && (
        <MappingEditor
          isSample={isSample}
          tag={mapping}
          onClose={() => setMapping(null)}
          onSave={persist}
        />
      )}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => {
          if (!v && !busy) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project tag?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.name}” and its site mappings will be removed. Sites,
              chargers, and historical reference reports will remain available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="form-error">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={busy} onClick={deleteTag}>
              <Saving saving={busy} label="Delete tag" />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
