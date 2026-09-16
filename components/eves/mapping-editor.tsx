"use client";

import { useId, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { referenceSites, type ReferenceSite } from "@/lib/eves/seed";
import type { ProjectTag, TagInput } from "@/lib/eves/types";
import { Saving } from "./shared";
import styles from "./mapping-editor.module.css";

type Mappings = TagInput["mappings"];

function sameMappings(left: Mappings, right: Mappings) {
  return (
    Object.keys(left).length === Object.keys(right).length &&
    Object.entries(left).every(
      ([name, ids]) =>
        ids.length === right[name]?.length &&
        ids.every((id) => right[name].includes(id)),
    )
  );
}

function MappingSearch({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className={styles.search}>
      <Search size={16} aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
      />
    </div>
  );
}

function ChargerPicker({
  site,
  selected,
  onSave,
  disabled = false,
}: {
  site: ReferenceSite;
  selected: string[];
  onSave: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);
  const [search, setSearch] = useState("");
  const id = useId();
  const chargerLabel = (charger: string) =>
    `Charger ${charger.padStart(2, "0")}`;
  const visible = site.chargers.filter((charger) =>
    chargerLabel(charger).toLowerCase().includes(search.trim().toLowerCase()),
  );
  function changeOpen(next: boolean) {
    if (next) {
      setDraft([...selected]);
      setSearch("");
    }
    setOpen(next);
  }
  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="link"
          className={styles.edit}
          disabled={disabled}
          aria-label={`Edit chargers for ${site.name}`}
        >
          {selected.length} of {site.chargers.length} chargers · Edit
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={16}
        className={styles.chargerPopover}
        aria-labelledby={`${id}-title`}
      >
        <div className={styles.popoverHeading}>
          <h3 id={`${id}-title`}>Update chargers</h3>
          <p>{site.name}</p>
        </div>
        <MappingSearch
          value={search}
          onChange={setSearch}
          label="Search chargers…"
        />
        <div className={styles.selectionSummary}>
          <span aria-live="polite">
            {draft.length} of {site.chargers.length} selected
          </span>
          <button type="button" onClick={() => setDraft([...site.chargers])}>
            Select all
          </button>
        </div>
        <div
          className={styles.chargerList}
          role="group"
          aria-label={`Chargers at ${site.name}`}
        >
          {visible.map((charger) => (
            <label className={styles.chargerRow} key={charger}>
              <Checkbox
                checked={draft.includes(charger)}
                aria-label={chargerLabel(charger)}
                onCheckedChange={(checked) =>
                  setDraft((current) =>
                    checked === true
                      ? [...new Set([...current, charger])]
                      : current.filter((item) => item !== charger),
                  )
                }
              />
              <span>{chargerLabel(charger)}</span>
            </label>
          ))}
          {!visible.length && (
            <p className={styles.noResults}>No chargers match your search.</p>
          )}
        </div>
        {!draft.length && (
          <p className={styles.selectionHint} role="status">
            Select at least one charger. To remove this site, use Unlink in the
            mapped sites list.
          </p>
        )}
        <div className={styles.popoverFooter}>
          <Button variant="outline" onClick={() => changeOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!draft.length}
            onClick={() => {
              onSave(
                site.chargers.filter((charger) => draft.includes(charger)),
              );
              setOpen(false);
            }}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SitePicker({
  mappings,
  onConfirm,
  disabled,
}: {
  mappings: Mappings;
  onConfirm: (selected: Mappings) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Mappings>({});
  const available = referenceSites.filter((site) => !(site.name in mappings));
  const visible = available.filter((site) =>
    `${site.name} ${site.area ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const count = Object.keys(selected).length;
  function changeOpen(next: boolean) {
    if (next) {
      setSelected({});
      setSearch("");
    }
    setOpen(next);
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || !available.length}>
          <Plus size={15} /> Map Sites
        </Button>
      </DialogTrigger>
      <DialogContent className={styles.siteDialog}>
        <DialogHeader className={styles.header}>
          <DialogTitle>Map Sites</DialogTitle>
          <DialogDescription>
            Select sites and choose which chargers to map. All chargers are
            selected by default.
          </DialogDescription>
        </DialogHeader>
        <MappingSearch
          value={search}
          onChange={setSearch}
          label="Search by site name or area"
        />
        <div
          className={styles.siteList}
          role="group"
          aria-label="Available sites"
        >
          {visible.map((site) => (
            <div
              className={styles.siteRow}
              key={site.name}
              data-selected={!!selected[site.name]}
            >
              <label className={styles.siteChoice}>
                <Checkbox
                  checked={!!selected[site.name]}
                  aria-label={`Select ${site.name}`}
                  onCheckedChange={(checked) =>
                    setSelected((current) => {
                      const next = { ...current };
                      if (checked === true)
                        next[site.name] = [...site.chargers];
                      else delete next[site.name];
                      return next;
                    })
                  }
                />
                <span>
                  <strong>{site.name}</strong>
                  <small>
                    {site.area && `Area: ${site.area} · `}
                    {site.chargers.length} chargers
                  </small>
                </span>
              </label>
              {selected[site.name] && (
                <div className={styles.siteChargerEdit}>
                  <ChargerPicker
                    site={site}
                    selected={selected[site.name]}
                    onSave={(ids) =>
                      setSelected((current) => ({
                        ...current,
                        [site.name]: ids,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          ))}
          {!visible.length && (
            <p className={styles.noResults}>No sites match your search.</p>
          )}
        </div>
        <div className={styles.pickerFooter}>
          <span className={styles.selectionHint} aria-live="polite">
            {count} {count === 1 ? "site" : "sites"} selected
          </span>
          <div className={styles.actions}>
            <Button variant="outline" onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!count}
              onClick={() => {
                onConfirm(selected);
                setOpen(false);
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MappingEditor({
  tag,
  onClose,
  onSave,
  isSample = false,
}: {
  tag: ProjectTag;
  onClose: () => void;
  onSave: (input: TagInput, tag?: ProjectTag) => Promise<ProjectTag>;
  isSample?: boolean;
}) {
  const [mappings, setMappings] = useState<Mappings>(() =>
    structuredClone(tag.mappings),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const dirty = !sameMappings(mappings, tag.mappings);
  const entries = Object.entries(mappings);
  const allMapped = referenceSites.every((site) => site.name in mappings);
  function close() {
    if (saving) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  function update(next: Mappings) {
    setMappings(next);
    setError("");
  }
  async function submit() {
    if (!dirty || saving) return;
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
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className={styles.manager} aria-busy={saving}>
          <DialogHeader className={styles.header}>
            <DialogTitle>View Mapped Sites</DialogTitle>
            <DialogDescription>Mapped sites for {tag.name}</DialogDescription>
          </DialogHeader>
          <div className={styles.toolbar}>
            <span className={styles.selectionHint}>
              {allMapped
                ? "All available sites are mapped"
                : `${entries.length} ${entries.length === 1 ? "site" : "sites"} mapped`}
            </span>
            <SitePicker
              mappings={mappings}
              disabled={saving}
              onConfirm={(selected) => update({ ...mappings, ...selected })}
            />
          </div>
          <div className={styles.tableScroll}>
            {entries.length ? (
              <table className={styles.table}>
                <caption className="sr-only">
                  Sites and chargers mapped to {tag.name}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Site Name</th>
                    <th scope="col">Mapped Chargers</th>
                    <th scope="col">Unlink</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(([name, ids]) => {
                    const site = referenceSites.find(
                      (item) => item.name === name,
                    ) ?? { name, chargers: ids };
                    return (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>
                          <ChargerPicker
                            site={site}
                            selected={ids}
                            disabled={saving}
                            onSave={(selected) =>
                              update({ ...mappings, [name]: selected })
                            }
                          />
                        </td>
                        <td>
                          <Button
                            variant="link"
                            className={styles.unlink}
                            disabled={saving}
                            aria-label={`Unlink ${name}`}
                            onClick={() => {
                              const next = { ...mappings };
                              delete next[name];
                              update(next);
                            }}
                          >
                            Unlink
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className={styles.empty}>
                <Building2 size={26} aria-hidden="true" />
                <h3>No sites mapped</h3>
                <p>Use Map Sites to add sites and choose their chargers.</p>
              </div>
            )}
          </div>
          <p className={styles.inventoryNote}>
            {isSample
              ? "Sample workspace. Changes are saved in this browser only. "
              : "Reference site inventory. "}
            Charger numbers are selection labels, not live device IDs.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className={styles.managerFooter}>
            <div className={styles.actions}>
              <Button variant="outline" disabled={saving} onClick={close}>
                Close
              </Button>
              <Button disabled={saving || !dirty} onClick={submit}>
                <Saving saving={saving} label="Save" />
              </Button>
            </div>
            <span className={styles.selectionHint} role="status">
              {dirty ? "Unsaved changes" : ""}
            </span>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard mapping changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your site and charger selections have not been saved.
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
