import type { PlatformCapability, PlatformCapabilityRegistry } from "@/core/capabilities";
import type { HicoPilotManifest, ManifestValidationIssue } from "@/core/manifests";

export type ModuleStatus = "ready" | "invalid" | "blocked";

export type ModuleMetadata = Readonly<Record<string, string | number | boolean | null | undefined>>;

export type ModuleDependency = Readonly<{
  id: string;
  version?: string;
  optional: boolean;
  satisfied: boolean;
}>;

export type ModuleCompatibility = Readonly<{
  platformVersion: string;
  compatible: boolean;
  minimumPlatformVersion?: string;
  maximumPlatformVersion?: string;
  requiredCapabilities: readonly string[];
  optionalCapabilities: readonly string[];
}>;

export type ModuleDescriptor = Readonly<{
  id: string;
  name: string;
  version: string;
  status: ModuleStatus;
  manifest: HicoPilotManifest;
  capabilities: readonly PlatformCapability[];
  dependencies: readonly ModuleDependency[];
  compatibility: ModuleCompatibility;
  workspaceAware: boolean;
  enabledByDefault: boolean;
  metadata?: ModuleMetadata;
}>;

export type ModuleLoadIssueCode =
  | "missing_manifest"
  | "invalid_manifest"
  | "duplicate_module_id"
  | "missing_capability"
  | "unsupported_platform_version"
  | "missing_dependency"
  | "circular_dependency"
  | "capability_registration_failed";

export type ModuleLoadIssue = Readonly<{
  code: ModuleLoadIssueCode;
  severity: "error" | "warning";
  field?: string;
  message: string;
}>;

export type ModuleLoadRequest = Readonly<{
  manifest?: HicoPilotManifest;
  platformVersion?: string;
  loadedModuleIds?: readonly string[];
  availableDependencyIds?: readonly string[];
  dependencyGraph?: Readonly<Record<string, readonly string[]>>;
  capabilityRegistry?: PlatformCapabilityRegistry;
}>;

export type ModuleLoadResult = Readonly<{
  loaded: boolean;
  descriptor?: ModuleDescriptor;
  manifest?: HicoPilotManifest;
  issues: readonly ModuleLoadIssue[];
  manifestIssues: readonly ManifestValidationIssue[];
}>;

