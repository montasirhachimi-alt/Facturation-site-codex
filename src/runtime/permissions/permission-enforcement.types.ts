import type { CorePermissionAction, CorePermissionRequirement } from "@/core/types";
import type { Role } from "@/lib/types";

export type PermissionResourceType =
  | "application"
  | "command"
  | "widget"
  | "page"
  | "navigation"
  | "service"
  | "plugin"
  | "ai_skill"
  | "ai_agent"
  | "workflow_action"
  | "api"
  | (string & {});

export type PermissionScope = "global" | "company" | "workspace" | "own" | (string & {});

export type PermissionReason =
  | "allowed_by_role"
  | "allowed_by_explicit_permission"
  | "denied_missing_subject"
  | "denied_missing_role"
  | "denied_missing_permission"
  | "denied_unsupported_permission"
  | "denied_workspace_required"
  | "denied_company_required"
  | "denied_resource_disabled"
  | "denied_unknown";

export type PermissionResource = Readonly<{
  id: string;
  type: PermissionResourceType;
  module?: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}>;

export type PermissionSubject = Readonly<{
  userId?: string;
  role?: Role | (string & {});
  workspaceId?: string;
  companyId?: string;
  permissions?: CorePermissionRequirement[];
  metadata?: Record<string, unknown>;
}>;

export type PermissionContext = Readonly<{
  subject?: PermissionSubject;
  resource: PermissionResource;
  action: CorePermissionAction;
  permission?: CorePermissionRequirement;
  workspaceId?: string;
  companyId?: string;
  metadata?: Record<string, unknown>;
}>;

export type PermissionDecision = Readonly<{
  allowed: boolean;
  reason: PermissionReason;
  permission: CorePermissionRequirement;
  resource: PermissionResource;
  workspaceId?: string;
  companyId?: string;
  userId?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}>;

export type PermissionEvaluator = {
  evaluate: (context: PermissionContext) => PermissionDecision;
};

export type PermissionEnforcementOptions = Readonly<{
  supportedModules?: readonly string[];
  rolePermissions?: Record<string, Partial<Record<string, readonly CorePermissionAction[]>>>;
}>;

export type PermissionEvaluationInput = PermissionContext | CorePermissionRequirement;

