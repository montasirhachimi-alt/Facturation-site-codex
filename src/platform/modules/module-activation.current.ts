import { alphaActivationProfile } from "./module-activation.defaults";
import { ModuleActivationEngine } from "./module-activation.engine";
import type { ModuleActivationRequest, ModuleActivationResult } from "./module-activation.types";
import { bosiacoModuleDescriptors } from "./module.descriptors";
import { ModuleRegistry } from "./module.registry";
import type { ModuleId } from "./module.types";

export const bosiacoModuleRegistry = new ModuleRegistry(bosiacoModuleDescriptors);

export const currentAlphaActivation = Object.freeze(
  new ModuleActivationEngine(bosiacoModuleRegistry).resolve(alphaActivationProfile)
);

export function resolveModuleActivation(request: ModuleActivationRequest = alphaActivationProfile): ModuleActivationResult {
  return new ModuleActivationEngine(bosiacoModuleRegistry).resolve(request);
}

export function getCurrentAlphaActivation() {
  return currentAlphaActivation;
}

export function isCurrentModuleActive(moduleId: ModuleId) {
  return currentAlphaActivation.activeModuleIdSet.has(moduleId);
}
