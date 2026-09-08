"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ProjectTag, TagInput } from "./types";
export async function tagRequest<T>(
  method: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch("/api/tags", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error ?? "The request failed.");
  return payload as T;
}
export function useTags() {
  const [tags, setTags] = useState<ProjectTag[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const pendingRequest = useRef<AbortController | null>(null);
  const load = useCallback(() => {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    return tagRequest<ProjectTag[]>("GET", undefined, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setTags(result);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Tags could not be loaded.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, []);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    await load();
  }, [load]);
  useEffect(() => {
    void load();
    return () => pendingRequest.current?.abort();
  }, [load]);
  const save = async (input: TagInput, tag?: ProjectTag) => {
    const result = await tagRequest<ProjectTag>(tag ? "PUT" : "POST", {
      ...input,
      ...(tag ? { id: tag.id, version: tag.version } : {}),
    });
    setTags((prev) =>
      tag ? prev.map((t) => (t.id === tag.id ? result : t)) : [...prev, result],
    );
    return result;
  };
  const remove = async (tag: ProjectTag) => {
    await tagRequest("DELETE", { id: tag.id, version: tag.version });
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
  };
  return { tags, loading, error, reload, save, remove };
}
