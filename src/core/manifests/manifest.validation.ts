import type {
  ManifestInput,
  ManifestValidationIssue,
  ManifestValidationOptions,
  ManifestValidationResult
} from "./manifest.types";
import {
  createManifest,
  hasDuplicateValues,
  isValidManifestVersion
} from "./manifest.utils";

export function validateManifest(input: ManifestInput, options: ManifestValidationOptions = {}): ManifestValidationResult {
  const issues: ManifestValidationIssue[] = [];

  addRequiredFieldIssues(input, issues);
  addDuplicateIssues(input, issues, options);
  addVersionIssues(input, issues);
  addMetadataIssues(input, issues, options);
  addDependencyIssues(input, issues);

  const valid = issues.every((issue) => issue.severity !== "error");

  return Object.freeze({
    valid,
    manifest: valid ? createManifest(input) : undefined,
    issues: Object.freeze(issues)
  });
}

function addRequiredFieldIssues(input: ManifestInput, issues: ManifestValidationIssue[]) {
  for (const field of ["id", "name"] as const) {
    if (!input[field]?.trim()) {
      issues.push({
        code: "missing_required_field",
        severity: "error",
        field,
        message: `Manifest field is required: ${field}.`
      });
    }
  }
}

function addDuplicateIssues(input: ManifestInput, issues: ManifestValidationIssue[], options: ManifestValidationOptions) {
  if (input.id && options.existingManifestIds?.includes(input.id)) {
    issues.push({
      code: "duplicate_manifest_id",
      severity: "error",
      field: "id",
      message: `Manifest id is already registered: ${input.id}.`
    });
  }

  const capabilityIds = (input.capabilities ?? []).map((capability) => capability.id);
  if (hasDuplicateValues(capabilityIds)) {
    issues.push({
      code: "duplicate_capability_id",
      severity: "error",
      field: "capabilities",
      message: "Manifest contains duplicate capability ids."
    });
  }

  const dependencyIds = (input.dependencies ?? []).map((dependency) => dependency.id);
  if (hasDuplicateValues(dependencyIds)) {
    issues.push({
      code: "duplicate_dependency_id",
      severity: "error",
      field: "dependencies",
      message: "Manifest contains duplicate dependency ids."
    });
  }
}

function addVersionIssues(input: ManifestInput, issues: ManifestValidationIssue[]) {
  const versions = [
    ["version", input.version ?? "0.1.0"],
    ["platformVersion", input.platformVersion],
    ["compatibility.minimumPlatformVersion", input.compatibility?.minimumPlatformVersion],
    ["compatibility.maximumPlatformVersion", input.compatibility?.maximumPlatformVersion]
  ] as const;

  for (const [field, version] of versions) {
    if (version && !isValidManifestVersion(version)) {
      issues.push({
        code: "invalid_version",
        severity: "error",
        field,
        message: `Invalid semantic version for ${field}: ${version}.`
      });
    }
  }

  for (const dependency of input.dependencies ?? []) {
    if (dependency.version && !isValidManifestVersion(dependency.version)) {
      issues.push({
        code: "invalid_version",
        severity: "error",
        field: "dependencies.version",
        message: `Invalid dependency version for ${dependency.id}: ${dependency.version}.`
      });
    }
  }
}

function addMetadataIssues(input: ManifestInput, issues: ManifestValidationIssue[], options: ManifestValidationOptions) {
  if (options.requireMetadata && !input.metadata) {
    issues.push({
      code: "missing_metadata",
      severity: "warning",
      field: "metadata",
      message: "Manifest metadata is recommended for installable components."
    });
  }
}

function addDependencyIssues(input: ManifestInput, issues: ManifestValidationIssue[]) {
  for (const dependency of input.dependencies ?? []) {
    if (!dependency.id?.trim()) {
      issues.push({
        code: "invalid_dependency",
        severity: "error",
        field: "dependencies.id",
        message: "Manifest dependency id is required."
      });
    }
  }
}

