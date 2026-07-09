import type { UniversalSearchSection } from "./universal-search.types";
import { getCommandCenterSections } from "./command-registry";

export function getFoundationSearchSections(query = ""): readonly UniversalSearchSection[] {
  return getCommandCenterSections(query);
}
