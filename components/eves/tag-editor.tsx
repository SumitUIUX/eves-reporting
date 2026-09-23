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
import { Choice, Saving } from "./shared";
import {
  tagInputSchema,
  type ProjectTag,
  type TagInput,
} from "@/lib/eves/types";
interface EditorProps {
  isSample?: boolean;
  tag?: ProjectTag;
  onClose: () => void;
  onSave: (input: TagInput, tag?: ProjectTag) => Promise<ProjectTag>;
}
type TagField = "name" | "type" | "agency" | "awardId" | "description";
const UNSELECTED_AGENCY = "unselected";
const tagFields: TagField[] = ["name", "type", "agency", "awardId", "description"];
export function TagEditor({
  tag,
  onClose,
  onSave,
  isSample = false,
}: EditorProps) {
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
    [fieldErrors, setFieldErrors] = useState<Partial<Record<TagField, string>>>(
      {},
    ),
    [formError, setFormError] = useState(""),
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
  const set = (key: TagField, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = tagInputSchema.safeParse(form);
    if (!result.success) {
      const next: Partial<Record<TagField, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (tagFields.includes(key as TagField) && !next[key as TagField])
          next[key as TagField] = issue.message;
      }
      setFieldErrors(next);
      setFormError(
        Object.keys(next).length
          ? ""
          : (result.error.issues[0]?.message ?? "Check the form and try again."),
      );
      return;
    }
    setSaving(true);
    setFieldErrors({});
    setFormError("");
    try {
      await onSave(result.data, tag);
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Unable to save tag.");
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
              {isSample
                ? "Sample workspace. Changes are saved in this browser only."
                : "Group your charging infrastructure by funding agency or zone."}
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
                  aria-invalid={!!fieldErrors.name || undefined}
                  aria-describedby={fieldErrors.name ? "tag-name-error" : undefined}
                  onChange={(e) => set("name", e.target.value)}
                />
                {fieldErrors.name && (
                  <p id="tag-name-error" role="alert" className="form-error">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              {form.type === "Funding Agency" && (
                <>
                  <div className="form-field">
                    <label htmlFor="agency">
                      Funding agency <span className="text-primary">*</span>
                    </label>
                    <Choice
                      id="agency"
                      value={form.agency || UNSELECTED_AGENCY}
                      onChange={(v) =>
                        set("agency", v === UNSELECTED_AGENCY ? "" : v)
                      }
                      label="Funding agency"
                      invalid={!!fieldErrors.agency}
                      describedBy={fieldErrors.agency ? "agency-error" : undefined}
                      options={[
                        { value: UNSELECTED_AGENCY, label: "Select an agency" },
                        "CEC",
                        "CIC",
                        "Cal-EvIP",
                        "NEVI",
                      ]}
                      className="w-full"
                    />
                    {fieldErrors.agency && (
                      <p id="agency-error" role="alert" className="form-error">
                        {fieldErrors.agency}
                      </p>
                    )}
                  </div>
                  <div className="form-field">
                    <label htmlFor="award">Award / funding ID</label>
                    <Input
                      id="award"
                      maxLength={80}
                      placeholder="Enter award ID"
                      value={form.awardId}
                      aria-invalid={!!fieldErrors.awardId || undefined}
                      aria-describedby={
                        fieldErrors.awardId ? "award-error" : undefined
                      }
                      onChange={(e) => set("awardId", e.target.value)}
                    />
                    {fieldErrors.awardId && (
                      <p id="award-error" role="alert" className="form-error">
                        {fieldErrors.awardId}
                      </p>
                    )}
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
                  aria-invalid={!!fieldErrors.description || undefined}
                  aria-describedby={
                    fieldErrors.description ? "description-error" : undefined
                  }
                  onChange={(e) => set("description", e.target.value)}
                />
                {fieldErrors.description && (
                  <p id="description-error" role="alert" className="form-error">
                    {fieldErrors.description}
                  </p>
                )}
              </div>
            </div>
            {formError && (
              <p role="alert" className="form-error">
                {formError}
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
