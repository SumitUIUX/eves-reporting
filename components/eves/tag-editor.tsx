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
