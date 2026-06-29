import { coreModuleDefinitions } from "../config";
import type { CoreModuleCategory } from "../constants";
import type { CoreModuleDefinition, CoreModuleId } from "./types";

const moduleRegistry = new Map<CoreModuleId, CoreModuleDefinition>();

export function registerModule(definition: CoreModuleDefinition) {
  moduleRegistry.set(definition.id, definition);
  return definition;
}

export function getModule(id: CoreModuleId) {
  return moduleRegistry.get(id);
}

export function getModules() {
  return [...moduleRegistry.values()];
}

export function getModulesByCategory(category: CoreModuleCategory) {
  return getModules().filter((definition) => definition.category === category);
}

export function getSearchableModules() {
  return getModules().filter((definition) => definition.searchable && definition.enabled);
}

export function getFavoriteModules() {
  return getModules().filter((definition) => definition.favorite && definition.enabled);
}

export function clearModuleRegistry() {
  moduleRegistry.clear();
}

coreModuleDefinitions.forEach(registerModule);
