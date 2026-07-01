import type { CorePermissionRequirement } from "@/core/types";
import {
  DEFAULT_PERMISSION_ACTION,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_SUPPORTED_PERMISSION_MODULES
} from "./permission-enforcement.constants";
import type { PermissionContext, PermissionDecision, PermissionReason, PermissionResource } from "./permission-enforcement.types";

export function createPermissionRequirement(context: PermissionContext): CorePermissionRequirement {
  return Object.freeze({
    module: context.permission?.module ?? context.resource.module ?? context.resource.id,
    action: context.permission?.action ?? context.action ?? DEFAULT_PERMISSION_ACTION,
    scope: context.permission?.scope
  });
}

export function createPermissionDecision(
  context: PermissionContext,
  allowed: boolean,
  reason: PermissionReason,
  permission: CorePermissionRequirement,
  metadata?: Record<string, unknown>
): PermissionDecision {
  return Object.freeze({
    allowed,
    reason,
    permission,
    resource: freezeResource(context.resource),
    workspaceId: context.workspaceId ?? context.subject?.workspaceId,
    companyId: context.companyId ?? context.subject?.companyId,
    userId: context.subject?.userId,
    role: context.subject?.role,
    metadata: metadata ? Object.freeze({ ...metadata }) : undefined
  });
}

export function freezeResource(resource: PermissionResource): PermissionResource {
  return Object.freeze({
    ...resource,
    metadata: resource.metadata ? Object.freeze({ ...resource.metadata }) : undefined
  });
}

export function isSupportedPermissionModule(module: string, supportedModules: readonly string[] = DEFAULT_SUPPORTED_PERMISSION_MODULES) {
  return supportedModules.includes(module as never);
}

export function roleAllows(
  role: string,
  permission: CorePermissionRequirement,
  rolePermissionMap = DEFAULT_ROLE_PERMISSIONS
) {
  return rolePermissionMap[role]?.[permission.module]?.includes(permission.action) ?? false;
}

export function explicitPermissionAllows(permissions: readonly CorePermissionRequirement[] | undefined, required: CorePermissionRequirement) {
  return permissions?.some((permission) => {
    return permission.module === required.module && permission.action === required.action && (!required.scope || permission.scope === required.scope);
  }) ?? false;
}
