import { getCurrentEditionActivationRequest, getCurrentEditionActivationResult } from "../editions/edition.current";
import { ModuleActivationEngine } from "./module-activation.engine";
import type { ModuleActivationRequest, ModuleActivationResult } from "./module-activation.types";
import { bosiacoModuleDescriptors } from "./module.descriptors";
import { ModuleRegistry } from "./module.registry";
import type { ModuleId } from "./module.types";

export const bosiacoModuleRegistry = new ModuleRegistry(bosiacoModuleDescriptors);

export const currentAlphaActivation = getCurrentEditionActivationResult();

export function resolveModuleActivation(request: ModuleActivationRequest = getCurrentEditionActivationRequest()): ModuleActivationResult {
  return new ModuleActivationEngine(bosiacoModuleRegistry).resolve(request);
}

export function getCurrentAlphaActivation() {
  return currentAlphaActivation;
}

export function isCurrentModuleActive(moduleId: ModuleId) {
  return currentAlphaActivation.activeModuleIdSet.has(moduleId);
}
