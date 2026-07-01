import type {
  HicoPilotManifest,
  ManifestCapability,
  ManifestCompatibility,
  ManifestDependency,
  ManifestInput,
  ManifestMetadata
} from "./manifest.types";

export const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function isValidManifestVersion(version: string | undefined) {
  return Boolean(version && SEMVER_PATTERN.test(version));
}

export function createManifest(input: ManifestInput): HicoPilotManifest {
  return Object.freeze({
    id: input.id,
    name: input.name,
    displayName: input.displayName,
    description: input.description,
    author: input.author,
    vendor: input.vendor,
    version: input.version ?? "0.1.0",
    platformVersion: input.platformVersion,
    category: input.category,
    capabilities: Object.freeze((input.capabilities ?? []).map(freezeManifestCapability)),
    permissions: Object.freeze([...(input.permissions ?? [])]),
    dependencies: Object.freeze((input.dependencies ?? []).map(freezeManifestDependency)),
    compatibility: freezeCompatibility(input.compatibility),
    workspaceAware: input.workspaceAware ?? false,
    enabledByDefault: input.enabledByDefault ?? false,
    entry: input.entry,
    metadata: freezeManifestMetadata(input.metadata)
  });
}

export function freezeManifestCapability(capability: ManifestCapability): ManifestCapability {
  return Object.freeze({
    ...capability,
    permissions: capability.permissions ? Object.freeze([...capability.permissions]) : undefined,
    metadata: freezeManifestMetadata(capability.metadata)
  });
}

export function freezeManifestDependency(dependency: ManifestDependency): ManifestDependency {
  return Object.freeze({
    ...dependency,
    metadata: freezeManifestMetadata(dependency.metadata)
  });
}

export function freezeCompatibility(compatibility: ManifestCompatibility | undefined): ManifestCompatibility | undefined {
  if (!compatibility) return undefined;

  return Object.freeze({
    ...compatibility,
    requiredCapabilities: compatibility.requiredCapabilities ? Object.freeze([...compatibility.requiredCapabilities]) : undefined,
    optionalCapabilities: compatibility.optionalCapabilities ? Object.freeze([...compatibility.optionalCapabilities]) : undefined
  });
}

export function freezeManifestMetadata(metadata: ManifestMetadata | undefined): ManifestMetadata | undefined {
  return metadata ? Object.freeze({ ...metadata }) : undefined;
}

export function hasDuplicateValues(values: readonly string[]) {
  return new Set(values).size !== values.length;
}
