import type { PlatformCapability, PlatformCapabilityInput, PlatformCapabilityMetadata } from "./capability.types";

export function createCapability(input: PlatformCapabilityInput): PlatformCapability {
  return Object.freeze({
    id: input.id,
    name: input.name,
    category: input.category,
    type: input.type,
    description: input.description,
    version: input.version ?? "0.1.0",
    permissions: Object.freeze([...(input.permissions ?? [])]),
    workspaceAware: input.workspaceAware ?? false,
    enabled: input.enabled ?? true,
    metadata: freezeMetadata(input.metadata)
  });
}

export function freezeMetadata(metadata: PlatformCapabilityInput["metadata"]): PlatformCapabilityMetadata | undefined {
  return metadata ? Object.freeze({ ...metadata }) : undefined;
}

export function sortCapabilities(capabilities: readonly PlatformCapability[]) {
  return [...capabilities].sort((first, second) => first.id.localeCompare(second.id));
}

