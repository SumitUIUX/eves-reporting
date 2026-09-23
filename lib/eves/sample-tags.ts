import { z } from "zod";
import sampleTagData from "../../data/sample-tags.json";
import { referenceSites } from "./seed";
import { tagInputSchema, type ProjectTag, type TagInput } from "./types";

export const SAMPLE_TAGS_KEY = "eves-project-tags-sample-v1";

// Fictional projects from data/sample-tags.json. Kept separate from the workspace API.
export const sampleTags = sampleTagData as ProjectTag[];

const storedTagSchema = tagInputSchema.and(
  z.object({
    id: z.string().min(1),
    createdBy: z.string().min(1),
    createdAt: z.string().datetime(),
    version: z.number().int().positive(),
  }),
);

type SampleStorage = Pick<Storage, "getItem" | "setItem">;

export function readSampleTags(stored: string | null): ProjectTag[] {
  if (stored === null) return structuredClone(sampleTags);
  const result = z.array(storedTagSchema).safeParse(JSON.parse(stored));
  if (!result.success) throw new Error("Saved sample data could not be read.");
  return result.data;
}

export function createSampleTagStore(storage: SampleStorage) {
  function read(): ProjectTag[] {
    return readSampleTags(storage.getItem(SAMPLE_TAGS_KEY));
  }

  function write(tags: ProjectTag[]) {
    // A failed browser write must never be reported as a successful save.
    storage.setItem(SAMPLE_TAGS_KEY, JSON.stringify(tags));
  }

  function save(input: TagInput, original?: ProjectTag) {
    const parsed = tagInputSchema.parse(input);
    for (const [name, ids] of Object.entries(parsed.mappings)) {
      const site = referenceSites.find((item) => item.name === name);
      if (
        !site ||
        !ids.length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !site.chargers.includes(id))
      ) {
        throw new Error("Choose valid sites and charger selections.");
      }
    }
    const tags = read();
    const current = original && tags.find((tag) => tag.id === original.id);
    if (original && (!current || current.version !== original.version)) {
      throw new Error(
        "This sample tag changed. Close the dialog and refresh before editing.",
      );
    }
    const tag: ProjectTag = {
      ...parsed,
      agency: parsed.type === "Zone" ? "" : parsed.agency,
      awardId: parsed.type === "Zone" ? "" : parsed.awardId,
      id:
        current?.id ??
        `sample-${Array.from(
          crypto.getRandomValues(new Uint8Array(16)),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("")}`,
      createdBy: current?.createdBy ?? "You",
      createdAt: current?.createdAt ?? new Date().toISOString(),
      version: (current?.version ?? 0) + 1,
    };
    write(
      current
        ? tags.map((item) => (item.id === tag.id ? tag : item))
        : [...tags, tag],
    );
    return tag;
  }

  function remove(tag: ProjectTag) {
    const tags = read();
    if (
      !tags.some((item) => item.id === tag.id && item.version === tag.version)
    ) {
      throw new Error(
        "This sample tag changed or was deleted. Refresh and try again.",
      );
    }
    write(tags.filter((item) => item.id !== tag.id));
  }

  return { read, save, remove };
}
