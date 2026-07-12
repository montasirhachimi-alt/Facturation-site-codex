import type { ModuleActivationRequest } from "../modules/module-activation.types";
import type { ModuleId } from "../modules/module.types";
import type { CustomEditionInput, EditionProfile } from "./edition.types";

export function editionToActivationRequest(profile: EditionProfile): ModuleActivationRequest {
  return Object.freeze({
    profileKey: profile.id,
    enabledModuleIds: Object.freeze([...profile.enabledModuleIds]),
    disabledModuleIds: Object.freeze([...(profile.disabledModuleIds ?? [])]),
    includeDefaults: profile.includeDefaults ?? false,
    strictDependencies: profile.strictDependencies ?? true,
    allowPreview: profile.allowPreviewModules ?? false,
    allowPlanned: profile.allowPlannedModules ?? false,
    allowHidden: profile.allowHiddenModules ?? false,
    allowDeprecated: profile.allowDeprecatedModules ?? false
  });
}

export function compareEditionsByOrder(first: EditionProfile, second: EditionProfile) {
  return first.order - second.order || first.id.localeCompare(second.id);
}

export function uniqueModuleIds(moduleIds: readonly ModuleId[]) {
  return Object.freeze([...new Set(moduleIds)]);
}

export function hasDuplicateModuleIds(moduleIds: readonly ModuleId[]) {
  return new Set(moduleIds).size !== moduleIds.length;
}

export function createCustomEditionProfile(input: CustomEditionInput): EditionProfile {
  return Object.freeze({
    id: input.id ?? "custom",
    name: input.name,
    shortName: input.name,
    description: input.description ?? "Custom declarative Edition profile foundation.",
    status: "internal",
    version: "0.1.0",
    targetAudience: input.targetAudience ?? "Future tenant-specific Edition configuration.",
    enabledModuleIds: Object.freeze([...input.enabledModuleIds]),
    disabledModuleIds: Object.freeze([...(input.disabledModuleIds ?? [])]),
    includeDefaults: false,
    strictDependencies: input.strictDependencies ?? true,
    allowPreviewModules: input.allowPreviewModules ?? false,
    allowPlannedModules: input.allowPlannedModules ?? false,
    allowHiddenModules: input.allowHiddenModules ?? false,
    defaultForEnvironment: false,
    commercial: false,
    order: 1000,
    tags: Object.freeze(["internal", "custom"]),
    notes: Object.freeze(["Generated custom profile metadata only. It is not persisted or licensed in SPR-403."])
  });
}
