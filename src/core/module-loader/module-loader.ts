import {
  PlatformCapabilityRegistry,
  type PlatformCapability
} from "@/core/capabilities";
import { validateManifest } from "@/core/manifests";
import type { HicoPilotManifest } from "@/core/manifests";
import type {
  ModuleCompatibility,
  ModuleDependency,
  ModuleLoadIssue,
  ModuleLoadRequest
} from "./module-loader.types";
import {
  compareSemanticVersions,
  createModuleLoadResult,
  freezeDescriptor,
  hasCircularDependency
} from "./module-loader.utils";

const DEFAULT_PLATFORM_VERSION = "0.1.0";

export class ModuleLoader {
  private readonly loadedModuleIds = new Set<string>();

  load(request: ModuleLoadRequest) {
    if (!request.manifest) {
      return createModuleLoadResult(false, [
        {
          code: "missing_manifest",
          severity: "error",
          field: "manifest",
          message: "Module load request requires a manifest."
        }
      ]);
    }

    const platformVersion = request.platformVersion ?? DEFAULT_PLATFORM_VERSION;
    const existingManifestIds = [...this.loadedModuleIds, ...(request.loadedModuleIds ?? [])];
    const manifestValidation = validateManifest(request.manifest, { existingManifestIds });
    const issues: ModuleLoadIssue[] = [];

    if (!manifestValidation.valid || !manifestValidation.manifest) {
      issues.push({
        code: "invalid_manifest",
        severity: "error",
        field: "manifest",
        message: "Module manifest failed validation."
      });
      return createModuleLoadResult(false, issues, manifestValidation.issues);
    }

    const manifest = manifestValidation.manifest;

    if (manifest.capabilities.length === 0) {
      issues.push({
        code: "missing_capability",
        severity: "error",
        field: "capabilities",
        message: "Module manifests must declare at least one capability."
      });
    }

    const compatibility = evaluateCompatibility(manifest, platformVersion);
    if (!compatibility.compatible) {
      issues.push({
        code: "unsupported_platform_version",
        severity: "error",
        field: "compatibility",
        message: "Module manifest is not compatible with the current platform version."
      });
    }

    const dependencies = evaluateDependencies(manifest, request.availableDependencyIds ?? []);
    for (const dependency of dependencies) {
      if (!dependency.optional && !dependency.satisfied) {
        issues.push({
          code: "missing_dependency",
          severity: "error",
          field: "dependencies",
          message: `Required module dependency is missing: ${dependency.id}.`
        });
      }
    }

    if (hasCircularDependency(manifest.id, request.dependencyGraph)) {
      issues.push({
        code: "circular_dependency",
        severity: "error",
        field: "dependencies",
        message: `Circular dependency detected for module: ${manifest.id}.`
      });
    }

    if (issues.some((issue) => issue.severity === "error")) {
      return createModuleLoadResult(false, issues, manifestValidation.issues);
    }

    const capabilityRegistry = request.capabilityRegistry ?? new PlatformCapabilityRegistry();
    const capabilities = registerManifestCapabilities(manifest, capabilityRegistry, issues);

    if (issues.some((issue) => issue.severity === "error")) {
      return createModuleLoadResult(false, issues, manifestValidation.issues);
    }

    const descriptor = freezeDescriptor({
      id: manifest.id,
      name: manifest.displayName ?? manifest.name,
      version: manifest.version,
      status: "ready",
      manifest,
      capabilities,
      dependencies,
      compatibility,
      workspaceAware: manifest.workspaceAware,
      enabledByDefault: manifest.enabledByDefault,
      metadata: manifest.metadata
    });

    this.loadedModuleIds.add(manifest.id);
    return createModuleLoadResult(true, issues, manifestValidation.issues, descriptor);
  }

  clear() {
    this.loadedModuleIds.clear();
  }
}

export function evaluateCompatibility(manifest: HicoPilotManifest, platformVersion: string): ModuleCompatibility {
  const minimum = manifest.compatibility?.minimumPlatformVersion;
  const maximum = manifest.compatibility?.maximumPlatformVersion;
  const aboveMinimum = minimum ? compareSemanticVersions(platformVersion, minimum) >= 0 : true;
  const belowMaximum = maximum ? compareSemanticVersions(platformVersion, maximum) <= 0 : true;

  return Object.freeze({
    platformVersion,
    compatible: aboveMinimum && belowMaximum,
    minimumPlatformVersion: minimum,
    maximumPlatformVersion: maximum,
    requiredCapabilities: Object.freeze([...(manifest.compatibility?.requiredCapabilities ?? [])]),
    optionalCapabilities: Object.freeze([...(manifest.compatibility?.optionalCapabilities ?? [])])
  });
}

export function evaluateDependencies(manifest: HicoPilotManifest, availableDependencyIds: readonly string[]): readonly ModuleDependency[] {
  return Object.freeze(
    manifest.dependencies.map((dependency) =>
      Object.freeze({
        id: dependency.id,
        version: dependency.version,
        optional: dependency.optional ?? false,
        satisfied: dependency.optional ? true : availableDependencyIds.includes(dependency.id)
      })
    )
  );
}

function registerManifestCapabilities(
  manifest: HicoPilotManifest,
  registry: PlatformCapabilityRegistry,
  issues: ModuleLoadIssue[]
): readonly PlatformCapability[] {
  const capabilities: PlatformCapability[] = [];

  for (const capability of manifest.capabilities) {
    try {
      capabilities.push(registry.register(capability));
    } catch {
      issues.push({
        code: "capability_registration_failed",
        severity: "error",
        field: "capabilities",
        message: `Capability could not be registered: ${capability.id}.`
      });
    }
  }

  return Object.freeze(capabilities);
}

export const moduleLoader = new ModuleLoader();

