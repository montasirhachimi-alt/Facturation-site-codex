import type { ModuleRegistry } from "./module.registry";
import type { ModuleActivationResult, ModuleActivationState } from "./module-activation.types";
import type { ModuleDescriptor, ModuleId } from "./module.types";

export function toActivationState(result: ModuleActivationResult): ModuleActivationState {
  return Object.freeze({
    profileKey: result.profileKey,
    activeModuleIds: result.activeModuleIds,
    activeModules: result.activeModules,
    activeModuleIdSet: result.activeModuleIdSet
  });
}

export function isModuleActive(result: Pick<ModuleActivationResult, "activeModuleIdSet">, moduleId: ModuleId) {
  return result.activeModuleIdSet.has(moduleId);
}

export function moduleHasFeature(descriptor: ModuleDescriptor | undefined, featureKey: string) {
  return Boolean(descriptor?.features?.includes(featureKey));
}

export function activeModuleHasFeature(result: ModuleActivationResult, moduleId: ModuleId, featureKey: string) {
  const descriptor = result.activeModules.find((moduleDescriptor) => moduleDescriptor.id === moduleId);
  return moduleHasFeature(descriptor, featureKey);
}

export function getModuleForRoute(pathname: string, registry: ModuleRegistry) {
  const normalizedPathname = normalizePath(pathname);
  return registry
    .list()
    .filter((descriptor) => descriptor.route)
    .sort((first, second) => (second.route?.length ?? 0) - (first.route?.length ?? 0))
    .find((descriptor) => {
      const route = normalizePath(descriptor.route ?? "");
      return normalizedPathname === route || normalizedPathname.startsWith(`${route}/`);
    });
}

export function isRouteAvailable(pathname: string, registry: ModuleRegistry, activation: ModuleActivationResult) {
  const descriptor = getModuleForRoute(pathname, registry);
  if (!descriptor) return true;
  return activation.activeModuleIdSet.has(descriptor.id);
}

export function getVisibleActiveModules(result: ModuleActivationResult) {
  return Object.freeze(result.activeModules.filter((descriptor) => !descriptor.hidden));
}

function normalizePath(pathname: string) {
  if (!pathname.startsWith("/")) return `/${pathname}`;
  return pathname.replace(/\/+$/, "") || "/";
}
