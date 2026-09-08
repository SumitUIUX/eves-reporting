"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2 } from "lucide-react";
import { Choice, Saving } from "./shared";
import { referenceSites } from "@/lib/eves/seed";
import {
  tagInputSchema,
  type ProjectTag,
  type TagInput,
} from "@/lib/eves/types";
interface EditorProps {
  tag?: ProjectTag;
  onClose: () => void;
  onSave: (input: TagInput, tag?: ProjectTag) => Promise<ProjectTag>;
}
export function TagEditor({ tag, onClose, onSave }: EditorProps) {
  const [form, setForm] = useState<TagInput>(
      tag ?? {
        name: "",
        type: "Funding Agency",
        agency: "CEC",
        awardId: "",
        description: "",
        mappings: {},
      },
    ),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [discard, setDiscard] = useState(false);
  const dirty =
    JSON.stringify(form) !==
    JSON.stringify(
      tag ?? {
        name: "",
        type: "Funding Agency",
        agency: "CEC",
        awardId: "",
        description: "",
        mappings: {},
      },
    );
  const close = () => (dirty ? setDiscard(true) : onClose());
  const set = (key: keyof TagInput, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = tagInputSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(result.data, tag);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save tag.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Dialog
        open
        onOpenChange={(v) => {
          if (!v && !saving) close();
        }}
      >
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>
              {tag ? "Edit project tag" : "Create a project tag"}
            </DialogTitle>
            <DialogDescription>
              Group your charging infrastructure by funding agency or zone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="dialog-body">
            <div className="form-grid">
              <div className="form-field full">
                <label htmlFor="tag-type">Tag type</label>
                <Choice
                  id="tag-type"
                  value={form.type}
                  onChange={(v) => set("type", v)}
                  label="Tag type"
                  options={["Funding Agency", "Zone"]}
                  className="w-full"
                />
              </div>
              <div className="form-field full">
                <label htmlFor="tag-name">
                  {form.type === "Zone" ? "Zone name" : "Project name"}{" "}
                  <span className="text-primary">*</span>
                </label>
                <Input
                  autoFocus
                  id="tag-name"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder={
                    form.type === "Zone"
                      ? "e.g. Northern service zone"
                      : "e.g. Downtown charging expansion"
                  }
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              {form.type === "Funding Agency" && (
                <>
                  <div className="form-field">
                    <label htmlFor="agency">
                      Funding agency <span className="text-primary">*</span>
                    </label>
                    <Choice
                      id="agency"
                      value={form.agency || "CEC"}
                      onChange={(v) => set("agency", v)}
                      label="Funding agency"
                      options={["CEC", "CIC", "Cal-EvIP", "NEVI"]}
                      className="w-full"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="award">Award / funding ID</label>
                    <Input
                      id="award"
                      maxLength={80}
                      placeholder="Enter award ID"
                      value={form.awardId}
                      onChange={(e) => set("awardId", e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="form-field full">
                <label htmlFor="description">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Textarea
                  id="description"
                  maxLength={1000}
                  rows={3}
                  placeholder="Add context for your team…"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="dialog-footer">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={close}
              >
                Cancel
              </Button>
              <Button disabled={saving} type="submit">
                <Saving
                  saving={saving}
                  label={tag ? "Save changes" : "Create tag"}
                />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes to this tag have not been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export function MappingEditor({
  tag,
  onClose,
  onSave,
}: EditorProps & { tag: ProjectTag }) {
  const [mappings, setMappings] = useState(tag.mappings),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  function toggleSite(name: string, selected: boolean) {
    const site = referenceSites.find((s) => s.name === name)!;
    setMappings((prev) => {
      const n = { ...prev };
      if (selected) n[name] = site.chargers;
      else delete n[name];
      return n;
    });
  }
  function toggleCharger(name: string, id: string, selected: boolean) {
    setMappings((prev) => {
      const n = { ...prev };
      const values = selected
        ? [...new Set([...(n[name] ?? []), id])]
        : (n[name] ?? []).filter((v) => v !== id);
      if (values.length) n[name] = values;
      else delete n[name];
      return n;
    });
  }
  async function submit() {
    setSaving(true);
    setError("");
    try {
      await onSave({ ...tag, mappings }, tag);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save mappings.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !saving) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Map sites & chargers</DialogTitle>
          <DialogDescription>{tag.name}</DialogDescription>
        </DialogHeader>
        <div className="dialog-body">
          <p className="text-[13px] text-muted-foreground">
            Select a site to include all its chargers, or choose individual
            chargers below.
          </p>
          <div>
            {referenceSites.map((site) => (
              <div className="map-site" key={site.name}>
                <div className="map-site-header">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={
                        (mappings[site.name]?.length ?? 0) ===
                        site.chargers.length
                          ? true
                          : mappings[site.name]?.length
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(v) => toggleSite(site.name, v === true)}
                      aria-label={`Map ${site.name}`}
                    />
                    <Building2 size={16} className="text-muted-foreground" />
                    {site.name}
                  </label>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {mappings[site.name]?.length ?? 0} / {site.chargers.length}
                  </span>
                </div>
                <div className="charger-list">
                  {site.chargers.map((id) => (
                    <label className="charger-label" key={id}>
                      <Checkbox
                        checked={mappings[site.name]?.includes(id) ?? false}
                        onCheckedChange={(v) =>
                          toggleCharger(site.name, id, v === true)
                        }
                        aria-label={`${site.name} charger ${id}`}
                      />
                      Charger {id.padStart(2, "0")}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Reference site inventory. Charger numbers are selection labels from
            the reference mapping, not live device IDs.
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="dialog-footer">
            <Button variant="outline" disabled={saving} onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={
                saving ||
                JSON.stringify(mappings) === JSON.stringify(tag.mappings)
              }
              onClick={submit}
            >
              <Saving saving={saving} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
