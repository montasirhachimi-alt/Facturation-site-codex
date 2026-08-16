import { ModuleActivationEngine } from "../modules/module-activation.engine";
import type { ModuleActivationRequest } from "../modules/module-activation.types";
import { bosiacoModuleDescriptors } from "../modules/module.descriptors";
import { ModuleRegistry } from "../modules/module.registry";
import { bosiacoEditionProfiles } from "./edition.profiles";
import { EditionProfileRegistry } from "./edition.registry";
import type { EditionId } from "./edition.types";
import { resolveEditionProfileForEnvironment } from "./edition-profile.resolver";
import { editionToActivationRequest } from "./edition.utils";

export const bosiacoEditionModuleRegistry = new ModuleRegistry(bosiacoModuleDescriptors);

export const bosiacoEditionProfileRegistry = new EditionProfileRegistry(
  bosiacoEditionProfiles,
  bosiacoEditionModuleRegistry
);

export const currentEditionProfileResolution = Object.freeze(
  resolveEditionProfileForEnvironment(bosiacoEditionProfileRegistry)
);

export const currentEditionProfile = Object.freeze(currentEditionProfileResolution.profile);

export const currentEditionActivationRequest = Object.freeze(
  editionToActivationRequest(currentEditionProfile)
);

export const currentEditionActivationResult = Object.freeze(
  new ModuleActivationEngine(bosiacoEditionModuleRegistry).resolve(currentEditionActivationRequest)
);

export function getEditionProfile(id: EditionId) {
  return bosiacoEditionProfileRegistry.get(id);
}

export function getCurrentEditionProfile() {
  return currentEditionProfile;
}

export function getCurrentEditionProfileResolution() {
  return currentEditionProfileResolution;
}

export function getCurrentEditionActivationRequest(): ModuleActivationRequest {
  return currentEditionActivationRequest;
}

export function getCurrentEditionActivationResult() {
  return currentEditionActivationResult;
}
