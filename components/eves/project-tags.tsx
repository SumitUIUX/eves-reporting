"use client";
import { useState } from "react";
import {
  Tags,
  MapPin,
  Building2,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  Landmark,
  Tag,
  ArrowDownUp,
  ChevronDown,
  FlaskConical,
  Database,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
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
import {
  useProjectTags,
  type TagDataSource,
} from "@/lib/eves/use-project-tags";
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

export function ProjectTags() {
  const {
    tags,
    loading,
    error,
    reload,
    save,
    remove,
    source,
    selectSource,
    workspaceUnavailable,
    workspaceNotConfigured,
  } = useProjectTags();
  const isSample = source === "sample";
  const [columns, setColumns] = useState<number[]>(() =>
    tagColumnLabels.map((_, index) => index),
  );
  const [filters, setFilters] = useState<TagFilters>(emptyTagFilters);
  const [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [sort, setSort] = useState(false),
    [editor, setEditor] = useState<ProjectTag | "new" | null>(null),
    [mapping, setMapping] = useState<ProjectTag | null>(null),
    [deleting, setDeleting] = useState<ProjectTag | null>(null),
    [busy, setBusy] = useState(false),
    [deleteError, setDeleteError] = useState("");
  const filtered = filterTags(tags, filters).sort((a, b) =>
    sort
      ? a.name.localeCompare(b.name)
      : a.createdAt.localeCompare(b.createdAt),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);
  const funding = tags.filter((t) => t.type === "Funding Agency").length;
  const sites = new Set(tags.flatMap((t) => Object.keys(t.mappings))).size;
  function changeFilters(next: TagFilters) {
    setFilters(next);
    setPage(1);
  }
  function changeSource(next: TagDataSource) {
    selectSource(next);
    changeFilters(emptyTagFilters);
    setEditor(null);
    setMapping(null);
    setDeleting(null);
  }
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                aria-label={`Data source: ${isSample ? "Sample data" : "Workspace data"}`}
              >
                {isSample ? <FlaskConical size={16} /> : <Database size={16} />}
                {isSample ? "Sample data" : "Workspace data"}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuRadioGroup
                value={source}
                onValueChange={(value) => changeSource(value as TagDataSource)}
              >
                <DropdownMenuRadioItem value="workspace">
                  Workspace data
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="sample">
                  Sample data
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                {workspaceUnavailable &&
                  "The workspace service is unavailable. "}
                Sample tags stay in this browser and are not included in
                Generate Reports.
              </p>
            </DropdownMenuContent>
          </DropdownMenu>
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
          value={loading || error ? "—" : tags.length}
          note="Across your workspace"
          icon={Tags}
        />
        <Metric
          label="Funding agency tags"
          value={loading || error ? "—" : funding}
          note="Projects linked to funding"
          icon={Landmark}
        />
        <Metric
          label="Zone tags"
          value={loading || error ? "—" : tags.length - funding}
          note="Geographic reporting groups"
          icon={MapPin}
        />
        <Metric
          label="Sites mapped"
          value={loading || error ? "—" : sites}
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
        ) : source === "workspace" && workspaceNotConfigured ? (
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
                {columns.map((column) => (
                  <TableHead key={column}>
                    {column === 0 ? (
                      <button
                        className="flex items-center gap-2"
                        onClick={() => setSort(!sort)}
                      >
                        {tagColumnLabels[column]} <ArrowDownUp size={12} />
                      </button>
                    ) : (
                      tagColumnLabels[column]
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${t.name}`}
                          className="w-8 text-muted-foreground"
                        >
                          <MoreHorizontal size={19} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditor(t)}>
                          <Pencil />
                          Edit tag
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setMapping(t)}>
                          <Link2 />
                          Map sites & chargers
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => {
                            setDeleting(t);
                            setDeleteError("");
                          }}
                        >
                          <Trash2 />
                          Delete tag
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
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
