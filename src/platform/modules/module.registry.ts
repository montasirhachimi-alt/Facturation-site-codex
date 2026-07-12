import type { ModuleCategory, ModuleDescriptor, ModuleId, ModuleValidationResult } from "./module.types";
import { cloneModuleDescriptor, compareModulesByOrder, validateModuleDescriptors } from "./module.utils";

export class ModuleRegistry {
  private readonly modules = new Map<ModuleId, ModuleDescriptor>();

  constructor(descriptors: readonly ModuleDescriptor[] = []) {
    this.registerMany(descriptors);
  }

  register(descriptor: ModuleDescriptor) {
    if (this.modules.has(descriptor.id)) {
      throw new Error(`Module "${descriptor.id}" is already registered.`);
    }

    const frozenDescriptor = cloneModuleDescriptor(descriptor);
    this.modules.set(frozenDescriptor.id, frozenDescriptor);
    return this;
  }

  registerMany(descriptors: readonly ModuleDescriptor[]) {
    descriptors.forEach((descriptor) => this.register(descriptor));
    return this;
  }

  get(id: ModuleId) {
    return this.modules.get(id);
  }

  has(id: ModuleId) {
    return this.modules.has(id);
  }

  list() {
    return Object.freeze([...this.modules.values()].sort(compareModulesByOrder));
  }

  listByCategory(category: ModuleCategory) {
    return Object.freeze(this.list().filter((descriptor) => descriptor.category === category));
  }

  listAlphaReady() {
    return Object.freeze(this.list().filter((descriptor) => descriptor.alphaReady));
  }

  listVisible() {
    return Object.freeze(this.list().filter((descriptor) => !descriptor.hidden && descriptor.defaultEnabled));
  }

  validate(): ModuleValidationResult {
    return validateModuleDescriptors(this.list());
  }
}

export function createModuleRegistry(descriptors: readonly ModuleDescriptor[]) {
  return new ModuleRegistry(descriptors);
}
