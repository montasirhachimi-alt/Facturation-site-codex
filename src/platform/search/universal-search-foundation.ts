import type { UniversalSearchSection } from "./universal-search.types";
import { getQuickCreateSection } from "./action-registry";
import { getCommandCenterSections } from "./command-registry";
import { getRecordSearchSection } from "./record-search-registry";
import { getCurrentAlphaActivation } from "@/platform/modules/module-activation.current";
import type { ModuleActivationResult } from "@/platform/modules/module-activation.types";

export function getFoundationSearchSections(query = "", activation: ModuleActivationResult = getCurrentAlphaActivation()): readonly UniversalSearchSection[] {
  return [
    getQuickCreateSection(query),
    ...getCommandCenterSections(query, activation),
    getRecordSearchSection(query, activation)
  ];
}
