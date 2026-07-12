import type { ModuleDescriptor, ModuleId } from "./module.types";

export type ModuleActivationSeverity = "error" | "warning";

export type ModuleActivationCode =
  | "unknown-module"
  | "disabled-dependency"
  | "hidden-module-requested"
  | "planned-module-requested"
  | "preview-module-requested"
  | "deprecated-module-requested"
  | "unresolved-dependency"
  | "circular-dependency";

export type ModuleActivationIssue = Readonly<{
  code: ModuleActivationCode;
  severity: ModuleActivationSeverity;
  moduleId?: ModuleId;
  message: string;
}>;

export type ModuleActivationState = Readonly<{
  profileKey: string;
  activeModuleIds: readonly ModuleId[];
  activeModules: readonly ModuleDescriptor[];
  activeModuleIdSet: ReadonlySet<ModuleId>;
}>;

export type ModuleActivationRequest = Readonly<{
  profileKey?: string;
  enabledModuleIds?: readonly ModuleId[];
  disabledModuleIds?: readonly ModuleId[];
  includeDefaults?: boolean;
  strictDependencies?: boolean;
  allowPreview?: boolean;
  allowPlanned?: boolean;
  allowHidden?: boolean;
  allowDeprecated?: boolean;
}>;

export type BlockedModule = Readonly<{
  moduleId: ModuleId;
  reason: string;
}>;

export type ModuleActivationResult = Readonly<{
  profileKey: string;
  requestedEnabledModuleIds: readonly ModuleId[];
  requestedDisabledModuleIds: readonly ModuleId[];
  activeModuleIds: readonly ModuleId[];
  activeModules: readonly ModuleDescriptor[];
  activeModuleIdSet: ReadonlySet<ModuleId>;
  automaticallyEnabledModuleIds: readonly ModuleId[];
  blockedModules: readonly BlockedModule[];
  warnings: readonly ModuleActivationIssue[];
  errors: readonly ModuleActivationIssue[];
  activationOrder: readonly ModuleId[];
}>;
