import { referenceTags } from "./seed";
import type { ProjectTag } from "./types";

/** Static reports can use their original funding tags on a deployment without
 * workspace storage. Never replace an empty workspace or a service failure. */
export function resolveFundingTags(state: {
  tags: ProjectTag[];
  error: string;
  errorCode: string;
}) {
  const unconfigured = state.errorCode === "TAG_STORAGE_NOT_CONFIGURED";
  return {
    tags: (unconfigured ? referenceTags : state.tags).filter(
      (tag) => tag.type === "Funding Agency" && !!tag.awardId.trim(),
    ),
    error: unconfigured ? "" : state.error,
  };
}
