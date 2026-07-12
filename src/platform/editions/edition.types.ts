import type { ModuleId } from "../modules/module.types";

export type EditionId =
  | "alpha.crm-sales"
  | "basic"
  | "crm"
  | "sales"
  | "inventory"
  | "purchasing"
  | "hr"
  | "enterprise"
  | "custom"
  | (string & {});

export type EditionStatus = "active" | "alpha" | "preview" | "planned" | "deprecated" | "internal";

export type EditionValidationSeverity = "error" | "warning";

export type EditionValidationCode =
  | "duplicate-edition-id"
  | "empty-edition-name"
  | "duplicate-module-id"
  | "conflicting-module-selection"
  | "unknown-module"
  | "hidden-module-without-allowance"
  | "planned-module-without-allowance"
  | "invalid-default-edition"
  | "multiple-runtime-defaults"
  | "activation-error"
  | "blocked-required-dependency";

export type EditionValidationIssue = Readonly<{
  code: EditionValidationCode;
  severity: EditionValidationSeverity;
  editionId?: EditionId;
  moduleId?: ModuleId;
  message: string;
}>;

export type EditionValidationResult = Readonly<{
  valid: boolean;
  issues: readonly EditionValidationIssue[];
}>;

export type EditionFeatureOverride = Readonly<{
  moduleId: ModuleId;
  featureKey: string;
  enabled: boolean;
  reason?: string;
}>;

export type EditionProfile = Readonly<{
  id: EditionId;
  name: string;
  shortName?: string;
  description: string;
  status: EditionStatus;
  version: string;
  targetAudience: string;
  enabledModuleIds: readonly ModuleId[];
  disabledModuleIds?: readonly ModuleId[];
  allowPreviewModules?: boolean;
  allowPlannedModules?: boolean;
  allowHiddenModules?: boolean;
  allowDeprecatedModules?: boolean;
  strictDependencies?: boolean;
  includeDefaults?: boolean;
  defaultForEnvironment?: boolean;
  commercial?: boolean;
  order: number;
  tags?: readonly string[];
  notes?: readonly string[];
  featureOverrides?: readonly EditionFeatureOverride[];
  futureLicenseKey?: string;
  futurePlanCode?: string;
}>;

export type CustomEditionInput = Readonly<{
  id?: EditionId;
  name: string;
  description?: string;
  enabledModuleIds: readonly ModuleId[];
  disabledModuleIds?: readonly ModuleId[];
  targetAudience?: string;
  allowPreviewModules?: boolean;
  allowPlannedModules?: boolean;
  allowHiddenModules?: boolean;
  strictDependencies?: boolean;
}>;
