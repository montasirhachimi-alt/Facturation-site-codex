import type { UniversalSearchSection } from "./universal-search.types";
import { getQuickCreateSection } from "./action-registry";
import { getCommandCenterSections } from "./command-registry";
import { getRecordSearchSection } from "./record-search-registry";

export function getFoundationSearchSections(query = ""): readonly UniversalSearchSection[] {
  return [
    getQuickCreateSection(query),
    ...getCommandCenterSections(query),
    getRecordSearchSection(query)
  ];
}
