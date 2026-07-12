import { ModuleActivationEngine } from "../modules/module-activation.engine";
import type { ModuleRegistry } from "../modules/module.registry";
import type { ModuleId } from "../modules/module.types";
import type { EditionProfile, EditionValidationIssue, EditionValidationResult } from "./edition.types";
import { editionToActivationRequest, hasDuplicateModuleIds } from "./edition.utils";

export function validateEditionProfiles(
  profiles: readonly EditionProfile[],
  registry: ModuleRegistry
): EditionValidationResult {
  const issues: EditionValidationIssue[] = [];
  const seenIds = new Set<string>();
  const defaultProfiles = profiles.filter((profile) => profile.defaultForEnvironment);

  for (const profile of profiles) {
    if (seenIds.has(profile.id)) {
      issues.push({
        code: "duplicate-edition-id",
        severity: "error",
        editionId: profile.id,
        message: `Edition "${profile.id}" is registered more than once.`
      });
    }
    seenIds.add(profile.id);

    if (!profile.name.trim()) {
      issues.push({
        code: "empty-edition-name",
        severity: "error",
        editionId: profile.id,
        message: `Edition "${profile.id}" must have a non-empty name.`
      });
    }

    if (hasDuplicateModuleIds(profile.enabledModuleIds)) {
      issues.push({
        code: "duplicate-module-id",
        severity: "error",
        editionId: profile.id,
        message: `Edition "${profile.id}" enables the same module more than once.`
      });
    }

    if (hasDuplicateModuleIds(profile.disabledModuleIds ?? [])) {
      issues.push({
        code: "duplicate-module-id",
        severity: "error",
        editionId: profile.id,
        message: `Edition "${profile.id}" disables the same module more than once.`
      });
    }

    const disabledIds = new Set(profile.disabledModuleIds ?? []);
    for (const moduleId of profile.enabledModuleIds) {
      const descriptor = registry.get(moduleId);

      if (disabledIds.has(moduleId)) {
        issues.push({
          code: "conflicting-module-selection",
          severity: "error",
          editionId: profile.id,
          moduleId,
          message: `Edition "${profile.id}" both enables and disables "${moduleId}".`
        });
      }

      if (!descriptor) {
        issues.push({
          code: "unknown-module",
          severity: "error",
          editionId: profile.id,
          moduleId,
          message: `Edition "${profile.id}" references unknown module "${moduleId}".`
        });
        continue;
      }

      if (descriptor.status === "planned" && !profile.allowPlannedModules) {
        issues.push({
          code: "planned-module-without-allowance",
          severity: "error",
          editionId: profile.id,
          moduleId,
          message: `Edition "${profile.id}" references planned module "${moduleId}" without planned-module allowance.`
        });
      }

      if (descriptor.hidden && !profile.allowHiddenModules && !descriptor.alphaReady) {
        issues.push({
          code: "hidden-module-without-allowance",
          severity: "error",
          editionId: profile.id,
          moduleId,
          message: `Edition "${profile.id}" references hidden module "${moduleId}" without hidden-module allowance.`
        });
      }
    }

    for (const moduleId of profile.disabledModuleIds ?? []) {
      if (!registry.has(moduleId)) {
        issues.push({
          code: "unknown-module",
          severity: "error",
          editionId: profile.id,
          moduleId,
          message: `Edition "${profile.id}" disables unknown module "${moduleId}".`
        });
      }
    }

    if (profile.defaultForEnvironment && !["active", "alpha"].includes(profile.status)) {
      issues.push({
        code: "invalid-default-edition",
        severity: "error",
        editionId: profile.id,
        message: `Edition "${profile.id}" has status "${profile.status}" and cannot be the runtime default.`
      });
    }

    const activation = new ModuleActivationEngine(registry).resolve(editionToActivationRequest(profile));
    for (const error of activation.errors) {
      issues.push({
        code: error.code === "disabled-dependency" ? "blocked-required-dependency" : "activation-error",
        severity: "error",
        editionId: profile.id,
        moduleId: error.moduleId as ModuleId | undefined,
        message: `Edition "${profile.id}" activation error: ${error.message}`
      });
    }
  }

  if (defaultProfiles.length > 1) {
    issues.push({
      code: "multiple-runtime-defaults",
      severity: "error",
      message: `Only one Edition can be the runtime default, but found ${defaultProfiles.length}.`
    });
  }

  return Object.freeze({
    valid: !issues.some((issue) => issue.severity === "error"),
    issues: Object.freeze(issues)
  });
}
