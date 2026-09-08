"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Tags,
  MapPin,
  Building2,
  Plus,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  ArrowRight,
  FileText,
  Landmark,
  Tag,
  ArrowDownUp,
  RefreshCw,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useTags } from "@/lib/eves/use-tags";
import type { ProjectTag, TagInput } from "@/lib/eves/types";
import { downloadCsv } from "@/lib/eves/export";
import {
  PageHeading,
  Metric,
  Choice,
  SearchInput,
  TablePagination,
  DataEmpty,
  DataLoading,
  DataError,
  ReferenceNote,
  Saving,
} from "./shared";
import { TagEditor, MappingEditor } from "./tag-editor";
export function ProjectTags() {
  const { tags, loading, error, reload, save, remove } = useTags();
  const [tab, setTab] = useState("all"),
    [search, setSearch] = useState(""),
    [agency, setAgency] = useState("all"),
    [page, setPage] = useState(1),
    [size, setSize] = useState(10),
    [sort, setSort] = useState(false),
    [editor, setEditor] = useState<ProjectTag | "new" | null>(null),
    [mapping, setMapping] = useState<ProjectTag | null>(null),
    [deleting, setDeleting] = useState<ProjectTag | null>(null),
    [busy, setBusy] = useState(false),
    [deleteError, setDeleteError] = useState("");
  const filtered = tags
    .filter(
      (t) =>
        (tab === "all" || t.type === tab) &&
        (agency === "all" || t.agency === agency) &&
        [t.name, t.awardId, t.agency, t.createdBy]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort
        ? a.name.localeCompare(b.name)
        : a.createdAt.localeCompare(b.createdAt),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);
  const funding = tags.filter((t) => t.type === "Funding Agency").length;
  const sites = new Set(tags.flatMap((t) => Object.keys(t.mappings))).size;
  async function persist(input: TagInput, tag?: ProjectTag) {
    const result = await save(input, tag);
    toast.success(tag ? "Changes saved" : "Project tag created");
    return result;
  }
  async function deleteTag() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      await remove(deleting);
      toast.success("Project tag deleted");
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
      "eves-project-tags",
    );
    toast.success("Project tags exported");
  }
  return (
    <>
      <PageHeading
        eyebrow="REGULATORY REPORTS"
        title="Project tagging"
        description="Organize your charging infrastructure. Simplify your reporting."
      >
        <Button onClick={() => setEditor("new")}>
          <Plus size={16} />
          Create project tag
        </Button>
      </PageHeading>
      <div className="metrics">
        <Metric
          label="Total project tags"
          value={loading || error ? "—" : tags.length}
          note="Across your workspace"
          icon={Tags}
          accent
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
        <div className="panel-tabs">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">
                All tags <span className="count-pill">{tags.length}</span>
              </TabsTrigger>
              <TabsTrigger value="Funding Agency">
                Funding agency <span className="count-pill">{funding}</span>
              </TabsTrigger>
              <TabsTrigger value="Zone">
                Zones{" "}
                <span className="count-pill">{tags.length - funding}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="table-toolbar">
          <div className="toolbar-left">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search project name or award ID…"
            />
            <Choice
              value={agency}
              onChange={(v) => {
                setAgency(v);
                setPage(1);
              }}
              label="Filter by agency"
              options={[
                { value: "all", label: "All agencies" },
                "CEC",
                "CIC",
                "Cal-EvIP",
                "NEVI",
              ]}
            />
          </div>
          <div className="toolbar-right">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh project tags"
              onClick={() => void reload()}
              disabled={loading}
            >
              <RefreshCw size={15} />
            </Button>
            <Button
              variant="outline"
              disabled={!filtered.length || loading}
              onClick={exportTags}
            >
              <Download size={15} />
              Export
            </Button>
          </div>
        </div>
        {loading ? (
          <DataLoading />
        ) : error ? (
          <DataError message={error} retry={() => void reload()} />
        ) : !filtered.length ? (
          <DataEmpty
            title={
              tags.length ? "No matching tags" : "Create your first project tag"
            }
            description={
              tags.length
                ? "Try another search or clear your agency filter."
                : "Group sites by funding agency or zone to prepare your reports."
            }
          >
            {tags.length ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setAgency("all");
                  setTab("all");
                }}
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
                <TableHead>
                  <button
                    className="flex items-center gap-2"
                    onClick={() => setSort(!sort)}
                  >
                    Project / zone name <ArrowDownUp size={12} />
                  </button>
                </TableHead>
                <TableHead>Tag type</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Mapped infrastructure</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created on</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
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
                  <TableCell>
                    {t.agency ? (
                      <span className="agency">{t.agency}</span>
                    ) : (
                      <span className="text-[#b1b5c0]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      className="flex flex-col gap-2 hover:text-primary"
                      onClick={() => setMapping(t)}
                      aria-label={`Map sites for ${t.name}`}
                    >
                      <span className="mapping-count">
                        <Building2 />
                        <strong>{Object.keys(t.mappings).length}</strong> sites
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
      <ReferenceNote>
        Tags can map to multiple sites and chargers. Editing a tag does not
        change your charging infrastructure.
      </ReferenceNote>
      <div className="workflow-callout">
        <div className="workflow-copy">
          <span>
            <FileText size={21} />
          </span>
          <div>
            <h3>Your projects, ready for reporting.</h3>
            <p>Use funding tags to scope your next regulatory report.</p>
          </div>
        </div>
        <Link href="/reports/regulatory">
          Generate a report <ArrowRight size={15} />
        </Link>
      </div>
      {editor && (
        <TagEditor
          tag={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onSave={persist}
        />
      )}
      {mapping && (
        <MappingEditor
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
