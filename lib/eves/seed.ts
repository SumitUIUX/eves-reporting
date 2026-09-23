import type { ProjectTag } from "./types";
import referenceTagData from "../../data/reference-tags.json";
import siteData from "../../data/sites.json";

// POC sample records. Workspace funding tags come from the tag API when storage is connected.
export interface ReferenceSite {
  name: string;
  area?: string;
  chargers: string[];
}

export const referenceTags = referenceTagData as ProjectTag[];
export const referenceSites = siteData as ReferenceSite[];
