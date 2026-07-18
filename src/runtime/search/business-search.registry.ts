import type { ModuleId } from "@/platform/modules/module.types";
import type { SearchProvider, SearchProviderRegistration } from "./business-search.types";

export class SearchRegistry {
  private readonly providers = new Map<ModuleId, SearchProvider>();
  private readonly registeredAt = new Map<ModuleId, string>();
  private readonly now: () => string;

  constructor(now: () => string = () => new Date().toISOString()) {
    this.now = now;
  }

  register(provider: SearchProvider): SearchProviderRegistration {
    const moduleId = provider.moduleId.trim() as ModuleId;

    if (!moduleId) {
      throw new Error("Search provider moduleId is required.");
    }

    if (this.providers.has(moduleId)) {
      throw new Error(`Search provider already registered for module: ${moduleId}`);
    }

    this.providers.set(moduleId, Object.freeze({ ...provider, moduleId }));
    this.registeredAt.set(moduleId, this.now());

    return this.toRegistration(moduleId);
  }

  unregister(moduleId: ModuleId) {
    this.registeredAt.delete(moduleId);
    return this.providers.delete(moduleId);
  }

  find(moduleId: ModuleId) {
    return this.providers.get(moduleId);
  }

  list(): readonly SearchProvider[] {
    return Object.freeze([...this.providers.values()].sort((first, second) => first.moduleId.localeCompare(second.moduleId)));
  }

  listRegistrations(): readonly SearchProviderRegistration[] {
    return Object.freeze(this.list().map((provider) => this.toRegistration(provider.moduleId)));
  }

  clear() {
    this.providers.clear();
    this.registeredAt.clear();
  }

  private toRegistration(moduleId: ModuleId): SearchProviderRegistration {
    const provider = this.providers.get(moduleId);

    return Object.freeze({
      moduleId,
      label: provider?.label,
      registeredAt: this.registeredAt.get(moduleId) ?? this.now()
    });
  }
}
