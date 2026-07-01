import type { CorePermissionRequirement } from "@/core/types";
import type { PlatformCapabilityInput } from "@/core/capabilities";

export type ManifestVersion = string;

export type ManifestCategory =
  | "application"
  | "integration"
  | "plugin"
  | "widget"
  | "workflow"
  | "ai"
  | "system"
  | (string & {});

export type ManifestMetadata = Readonly<Record<string, string | number | boolean | null | undefined>>;

export type ManifestCapability = PlatformCapabilityInput;

export type ManifestDependency = Readonly<{
  id: string;
  version?: ManifestVersion;
  optional?: boolean;
  metadata?: ManifestMetadata;
}>;

export type ManifestPermission = CorePermissionRequirement;

export type ManifestCompatibility = Readonly<{
  minimumPlatformVersion?: ManifestVersion;
  maximumPlatformVersion?: ManifestVersion;
  requiredCapabilities?: readonly string[];
  optionalCapabilities?: readonly string[];
}>;

export type HicoPilotManifest = Readonly<{
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  author?: string;
  vendor?: string;
  version: ManifestVersion;
  platformVersion?: ManifestVersion;
  category?: ManifestCategory;
  capabilities: readonly ManifestCapability[];
  permissions: readonly ManifestPermission[];
  dependencies: readonly ManifestDependency[];
  compatibility?: ManifestCompatibility;
  workspaceAware: boolean;
  enabledByDefault: boolean;
  entry?: string;
  metadata?: ManifestMetadata;
}>;

export type ManifestInput = Omit<
  HicoPilotManifest,
  "version" | "capabilities" | "permissions" | "dependencies" | "workspaceAware" | "enabledByDefault"
> & {
  version?: ManifestVersion;
  capabilities?: readonly ManifestCapability[];
  permissions?: readonly ManifestPermission[];
  dependencies?: readonly ManifestDependency[];
  workspaceAware?: boolean;
  enabledByDefault?: boolean;
};

export type ManifestValidationSeverity = "error" | "warning";

export type ManifestValidationIssueCode =
  | "missing_required_field"
  | "duplicate_manifest_id"
  | "duplicate_capability_id"
  | "duplicate_dependency_id"
  | "invalid_version"
  | "missing_metadata"
  | "invalid_dependency";

export type ManifestValidationIssue = Readonly<{
  code: ManifestValidationIssueCode;
  severity: ManifestValidationSeverity;
  field?: string;
  message: string;
}>;

export type ManifestValidationResult = Readonly<{
  valid: boolean;
  manifest?: HicoPilotManifest;
  issues: readonly ManifestValidationIssue[];
}>;

export type ManifestValidationOptions = Readonly<{
  existingManifestIds?: readonly string[];
  requireMetadata?: boolean;
}>;

