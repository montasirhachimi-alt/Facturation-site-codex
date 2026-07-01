import type { CorePermissionRequirement } from "@/core/types";
import type {
  PermissionContext,
  PermissionDecision,
  PermissionEnforcementOptions,
  PermissionEvaluationInput
} from "./permission-enforcement.types";
import {
  createPermissionDecision,
  createPermissionRequirement,
  explicitPermissionAllows,
  isSupportedPermissionModule,
  roleAllows
} from "./permission-enforcement.utils";
import {
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_SUPPORTED_PERMISSION_MODULES
} from "./permission-enforcement.constants";

export class PermissionDeniedError extends Error {
  readonly decision: PermissionDecision;

  constructor(decision: PermissionDecision) {
    super(`Permission denied: ${decision.permission.module}.${decision.permission.action}`);
    this.name = "PermissionDeniedError";
    this.decision = decision;
  }
}

export class PermissionEnforcement {
  private readonly supportedModules: readonly string[];
  private readonly rolePermissionMap: Record<string, Partial<Record<string, readonly CorePermissionRequirement["action"][]>>>;

  constructor(options: PermissionEnforcementOptions = {}) {
    this.supportedModules = options.supportedModules ?? DEFAULT_SUPPORTED_PERMISSION_MODULES;
    this.rolePermissionMap = options.rolePermissions ?? DEFAULT_ROLE_PERMISSIONS;
  }

  evaluate(context: PermissionContext): PermissionDecision {
    const permission = createPermissionRequirement(context);

    if (!context.subject) {
      return createPermissionDecision(context, false, "denied_missing_subject", permission);
    }

    if (context.resource.enabled === false) {
      return createPermissionDecision(context, false, "denied_resource_disabled", permission);
    }

    if (!isSupportedPermissionModule(permission.module, this.supportedModules)) {
      return createPermissionDecision(context, false, "denied_unsupported_permission", permission);
    }

    if (permission.scope === "workspace" && !(context.workspaceId ?? context.subject.workspaceId)) {
      return createPermissionDecision(context, false, "denied_workspace_required", permission);
    }

    if (permission.scope === "company" && !(context.companyId ?? context.subject.companyId)) {
      return createPermissionDecision(context, false, "denied_company_required", permission);
    }

    if (explicitPermissionAllows(context.subject.permissions, permission)) {
      return createPermissionDecision(context, true, "allowed_by_explicit_permission", permission);
    }

    if (!context.subject.role) {
      return createPermissionDecision(context, false, "denied_missing_role", permission);
    }

    if (roleAllows(context.subject.role, permission, this.rolePermissionMap)) {
      return createPermissionDecision(context, true, "allowed_by_role", permission);
    }

    return createPermissionDecision(context, false, "denied_missing_permission", permission);
  }

  canAccess(context: PermissionContext) {
    return this.evaluate(context);
  }

  canExecute(context: PermissionContext) {
    return this.evaluate(context);
  }

  assertPermission(context: PermissionContext) {
    const decision = this.evaluate(context);

    if (!decision.allowed) {
      throw new PermissionDeniedError(decision);
    }

    return decision;
  }

  filterAllowed<TItem>(items: readonly TItem[], toContext: (item: TItem) => PermissionContext) {
    return items.filter((item) => this.evaluate(toContext(item)).allowed);
  }

  evaluateRequirement(input: PermissionEvaluationInput, subject: PermissionContext["subject"]) {
    if ("resource" in input) {
      return this.evaluate(input);
    }

    return this.evaluate({
      subject,
      resource: {
        id: input.module,
        type: "service",
        module: input.module
      },
      action: input.action,
      permission: input
    });
  }
}

export const permissionEnforcement = new PermissionEnforcement();

