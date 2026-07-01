import { allPermissionModules, rolePermissions } from "@/lib/rbac";
import type { CorePermissionAction } from "@/core/types";

export const SUPPORTED_PERMISSION_RESOURCE_TYPES = [
  "application",
  "command",
  "widget",
  "page",
  "navigation",
  "service",
  "plugin",
  "ai_skill",
  "ai_agent",
  "workflow_action",
  "api"
] as const;

export const DEFAULT_SUPPORTED_PERMISSION_MODULES = allPermissionModules;

export const DEFAULT_ROLE_PERMISSIONS = rolePermissions as Record<string, Partial<Record<string, readonly CorePermissionAction[]>>>;

export const DEFAULT_PERMISSION_ACTION: CorePermissionAction = "view";

