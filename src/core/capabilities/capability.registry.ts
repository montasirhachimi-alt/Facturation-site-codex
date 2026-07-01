import type {
  PlatformCapability,
  PlatformCapabilityCategory,
  PlatformCapabilityInput,
  PlatformCapabilityRegistryApi,
  PlatformCapabilityType
} from "./capability.types";
import { createCapability, sortCapabilities } from "./capability.utils";

export class PlatformCapabilityRegistry implements PlatformCapabilityRegistryApi {
  private readonly capabilities = new Map<string, PlatformCapability>();

  register(input: PlatformCapabilityInput) {
    if (this.capabilities.has(input.id)) {
      throw new Error(`Capability already registered: ${input.id}`);
    }

    const capability = createCapability(input);
    this.capabilities.set(capability.id, capability);
    return capability;
  }

  registerMany(inputs: readonly PlatformCapabilityInput[]) {
    return inputs.map((input) => this.register(input));
  }

  find(id: string) {
    return this.capabilities.get(id);
  }

  findByCategory(category: PlatformCapabilityCategory) {
    return this.list().filter((capability) => capability.category === category);
  }

  findByType(type: PlatformCapabilityType) {
    return this.list().filter((capability) => capability.type === type);
  }

  exists(id: string) {
    return this.capabilities.has(id);
  }

  remove(id: string) {
    const capability = this.capabilities.get(id);
    this.capabilities.delete(id);
    return capability;
  }

  clear() {
    this.capabilities.clear();
  }

  list() {
    return sortCapabilities([...this.capabilities.values()]);
  }
}

export const platformCapabilityRegistry = new PlatformCapabilityRegistry();

export const registerCapability = platformCapabilityRegistry.register.bind(platformCapabilityRegistry);
export const registerCapabilities = platformCapabilityRegistry.registerMany.bind(platformCapabilityRegistry);
export const findCapability = platformCapabilityRegistry.find.bind(platformCapabilityRegistry);
export const findCapabilitiesByCategory = platformCapabilityRegistry.findByCategory.bind(platformCapabilityRegistry);
export const findCapabilitiesByType = platformCapabilityRegistry.findByType.bind(platformCapabilityRegistry);
export const capabilityExists = platformCapabilityRegistry.exists.bind(platformCapabilityRegistry);
export const removeCapability = platformCapabilityRegistry.remove.bind(platformCapabilityRegistry);
export const clearCapabilities = platformCapabilityRegistry.clear.bind(platformCapabilityRegistry);
export const listCapabilities = platformCapabilityRegistry.list.bind(platformCapabilityRegistry);

