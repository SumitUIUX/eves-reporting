"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useTags } from "./use-tags";
import {
  createSampleTagStore,
  readSampleTags,
  SAMPLE_TAGS_KEY,
} from "./sample-tags";
import type { ProjectTag, TagInput } from "./types";

export type TagDataSource = "workspace" | "sample";

const SAMPLE_CHANGE_EVENT = "eves-sample-tags-change";
const serverSnapshot = () => undefined;
const noSubscription = () => () => {};

function sampleSnapshot() {
  try {
    return window.localStorage.getItem(SAMPLE_TAGS_KEY);
  } catch {
    return "storage-unavailable";
  }
}

function subscribeSamples(onChange: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key === SAMPLE_TAGS_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", sync);
  window.addEventListener(SAMPLE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener(SAMPLE_CHANGE_EVENT, onChange);
  };
}

function notifySamples() {
  window.dispatchEvent(new Event(SAMPLE_CHANGE_EVENT));
}

function useSampleTags(enabled: boolean) {
  const snapshot = useSyncExternalStore(
    enabled ? subscribeSamples : noSubscription,
    enabled ? sampleSnapshot : serverSnapshot,
    serverSnapshot,
  );
  const { tags, error } = useMemo(() => {
    try {
      return {
        tags: snapshot === undefined ? [] : readSampleTags(snapshot),
        error: "",
      };
    } catch {
      return {
        tags: [],
        error:
          "Sample data could not be opened. Check browser storage and try again.",
      };
    }
  }, [snapshot]);

  async function save(input: TagInput, original?: ProjectTag) {
    const store = createSampleTagStore(window.localStorage);
    const result = store.save(input, original);
    notifySamples();
    return result;
  }

  async function remove(tag: ProjectTag) {
    const store = createSampleTagStore(window.localStorage);
    store.remove(tag);
    notifySamples();
  }

  return {
    tags,
    loading: snapshot === undefined,
    error,
    reload: notifySamples,
    save,
    remove,
  };
}

// Only Project Tagging opts into samples. The existing API and reporting hooks
// keep their behavior; sample changes are never sent to the workspace service.
export function useProjectTags() {
  const workspace = useTags();
  const [selectedSource, setSelectedSource] = useState<TagDataSource | null>(
    null,
  );
  const source: TagDataSource =
    selectedSource ?? (workspace.error ? "sample" : "workspace");
  const samples = useSampleTags(source === "sample");

  function selectSource(next: TagDataSource) {
    setSelectedSource(next);
    if (next === "workspace") void workspace.reload();
  }

  return {
    ...(source === "sample" ? samples : workspace),
    source,
    selectSource,
    workspaceUnavailable: !!workspace.error,
    workspaceNotConfigured: workspace.errorCode === "TAG_STORAGE_NOT_CONFIGURED",
  };
}
