"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useDataSource, type DataSource } from "./data-source";
import { useTags } from "./use-tags";
import {
  createSampleTagStore,
  readSampleTags,
  SAMPLE_TAGS_KEY,
} from "./sample-tags";
import type { ProjectTag, TagInput } from "./types";

export type TagDataSource = DataSource;

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

// Sample tags stay in this browser. Workspace tags use /api/tags and follow the
// navbar selection; an API error does not switch the selection back to sample.
export function useProjectTags() {
  const { source } = useDataSource();
  const workspace = useTags();
  const samples = useSampleTags(source === "sample");
  const seen = useRef(source);
  const reloadWorkspace = workspace.reload;

  useEffect(() => {
    if (seen.current === source) return;
    seen.current = source;
    if (source === "workspace") void reloadWorkspace();
  }, [source, reloadWorkspace]);

  return {
    ...(source === "sample" ? samples : workspace),
    source,
    workspaceNotConfigured:
      source === "workspace" &&
      workspace.errorCode === "TAG_STORAGE_NOT_CONFIGURED",
  };
}
