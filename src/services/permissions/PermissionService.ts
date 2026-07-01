import type { CorePermissionRequirement } from "@/core/types";
import type { Role } from "@/lib/types";
import {
  PermissionEnforcement,
  type PermissionContext,
  type PermissionDecision,
  type PermissionResource,
  type PermissionSubject
} from "@/runtime/permissions";
import type { HicoPilotWorkspace } from "@/services/workspace";

export type PermissionRuntimeSubjectInput = Readonly<{
  userId?: string;
  role?: Role | (string & {});
  workspace?: HicoPilotWorkspace | null;
  workspaceId?: string;
  companyId?: string;
  permissions?: CorePermissionRequirement[];
}>;

export class PermissionService {
  private readonly enforcement: PermissionEnforcement;

  constructor(enforcement = new PermissionEnforcement()) {
    this.enforcement = enforcement;
  }

  createSubject(input: PermissionRuntimeSubjectInput = {}): PermissionSubject {
    return {
      userId: input.userId ?? input.workspace?.ownerId ?? "system",
      role: input.role ?? "COMPANY_ADMIN",
      workspaceId: input.workspaceId ?? input.workspace?.id,
      companyId: input.companyId ?? input.workspace?.companyId,
      permissions: input.permissions
    };
  }

  evaluate(context: PermissionContext): PermissionDecision {
    return this.enforcement.evaluate(context);
  }

  evaluateRequirement(
    requirement: CorePermissionRequirement,
    resource: PermissionResource,
    subjectInput: PermissionRuntimeSubjectInput = {}
  ): PermissionDecision {
    return this.enforcement.evaluate({
      subject: this.createSubject(subjectInput),
      resource,
      action: requirement.action,
      permission: requirement,
      workspaceId: subjectInput.workspaceId ?? subjectInput.workspace?.id,
      companyId: subjectInput.companyId ?? subjectInput.workspace?.companyId
    });
  }

  evaluateRequirements(
    requirements: readonly CorePermissionRequirement[],
    resource: PermissionResource,
    subjectInput: PermissionRuntimeSubjectInput = {}
  ): PermissionDecision[] {
    return requirements.map((requirement) => this.evaluateRequirement(requirement, resource, subjectInput));
  }

  areRequirementsAllowed(
    requirements: readonly CorePermissionRequirement[],
    resource: PermissionResource,
    subjectInput: PermissionRuntimeSubjectInput = {}
  ) {
    if (requirements.length === 0) return true;

    return this.evaluateRequirements(requirements, resource, subjectInput).every((decision) => decision.allowed);
  }

  canAccess(context: PermissionContext) {
    return this.enforcement.canAccess(context);
  }

  canExecute(context: PermissionContext) {
    return this.enforcement.canExecute(context);
  }

  assertPermission(context: PermissionContext) {
    return this.enforcement.assertPermission(context);
  }

  filterAllowed<TItem>(items: readonly TItem[], toContext: (item: TItem) => PermissionContext) {
    return this.enforcement.filterAllowed(items, toContext);
  }
}

export const permissionService = new PermissionService();

