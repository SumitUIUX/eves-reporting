import type { ProjectTag } from "./types";

export interface TagFilters {
  search: string;
  type: "all" | ProjectTag["type"];
  agency: "all" | Exclude<ProjectTag["agency"], "">;
  mapping: "all" | "mapped" | "unmapped";
}

export const emptyTagFilters: TagFilters = {
  search: "",
  type: "all",
  agency: "all",
  mapping: "all",
};

export function filterTags(tags: ProjectTag[], filters: TagFilters) {
  const search = filters.search.trim().toLowerCase();
  return tags.filter((tag) => {
    const mapped = Object.keys(tag.mappings).length > 0;
    return (
      (filters.type === "all" || tag.type === filters.type) &&
      (filters.agency === "all" || tag.agency === filters.agency) &&
      (filters.mapping === "all" ||
        (filters.mapping === "mapped" ? mapped : !mapped)) &&
      [tag.name, tag.awardId, tag.agency, tag.createdBy]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  });
}
