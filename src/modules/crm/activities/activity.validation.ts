import { ACTIVITY_PRIORITIES, ACTIVITY_STATUSES, ACTIVITY_TYPES } from "./activity.constants";
import type { ActivityId, ActivityPriority, ActivityStatus, ActivityType, CreateActivityInput, UpdateActivityInput } from "./activity.types";
import type { CompanyId, WorkspaceId } from "../companies/company.types";

export type ActivityValidationIssueCode =
  | "missing_activity_id"
  | "missing_workspace"
  | "missing_company"
  | "missing_title"
  | "missing_user"
  | "invalid_type"
  | "invalid_status"
  | "invalid_priority"
  | "invalid_date"
  | "permission_denied";

export type ActivityValidationIssue = Readonly<{
  code: ActivityValidationIssueCode;
  field?: string;
  message: string;
}>;

export type ActivityValidationResult = Readonly<{
  valid: boolean;
  issues: readonly ActivityValidationIssue[];
}>;

export function validateCreateActivityInput(input: CreateActivityInput): ActivityValidationResult {
  const issues: ActivityValidationIssue[] = [];

  addWorkspaceIssue(input.workspaceId, issues);
  addCompanyIssue(input.companyId, issues);
  addTitleIssue(input.title, issues);
  addUserIssue(input.performedBy, "performedBy", issues);
  addTypeIssue(input.type, issues);
  addStatusIssue(input.status, issues);
  addPriorityIssue(input.priority, issues);
  addDateIssue(input.performedAt, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function validateUpdateActivityInput(input: UpdateActivityInput): ActivityValidationResult {
  const issues: ActivityValidationIssue[] = [];

  addActivityIdIssue(input.id, issues);
  addWorkspaceIssue(input.workspaceId, issues);
  if (input.companyId !== undefined) addCompanyIssue(input.companyId, issues);
  if (input.title !== undefined) addTitleIssue(input.title, issues);
  if (input.performedBy !== undefined) addUserIssue(input.performedBy, "performedBy", issues);
  addTypeIssue(input.type, issues);
  addStatusIssue(input.status, issues);
  addPriorityIssue(input.priority, issues);
  addDateIssue(input.performedAt, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

function addActivityIdIssue(id: ActivityId | undefined, issues: ActivityValidationIssue[]) {
  if (!id?.trim()) issues.push({ code: "missing_activity_id", field: "id", message: "Activity id is required." });
}

function addWorkspaceIssue(workspaceId: WorkspaceId | undefined, issues: ActivityValidationIssue[]) {
  if (!workspaceId?.trim()) issues.push({ code: "missing_workspace", field: "workspaceId", message: "Workspace scope is required." });
}

function addCompanyIssue(companyId: CompanyId | undefined, issues: ActivityValidationIssue[]) {
  if (!companyId?.trim()) issues.push({ code: "missing_company", field: "companyId", message: "Company id is required." });
}

function addTitleIssue(title: string | undefined, issues: ActivityValidationIssue[]) {
  if (!title?.trim()) issues.push({ code: "missing_title", field: "title", message: "Activity title is required." });
}

function addUserIssue(userId: string | undefined, field: string, issues: ActivityValidationIssue[]) {
  if (!userId?.trim()) issues.push({ code: "missing_user", field, message: "User id is required." });
}

function addTypeIssue(type: ActivityType | undefined, issues: ActivityValidationIssue[]) {
  if (type && !ACTIVITY_TYPES.includes(type)) issues.push({ code: "invalid_type", field: "type", message: "Activity type is invalid." });
}

function addStatusIssue(status: ActivityStatus | undefined, issues: ActivityValidationIssue[]) {
  if (status && !ACTIVITY_STATUSES.includes(status)) issues.push({ code: "invalid_status", field: "status", message: "Activity status is invalid." });
}

function addPriorityIssue(priority: ActivityPriority | undefined, issues: ActivityValidationIssue[]) {
  if (priority && !ACTIVITY_PRIORITIES.includes(priority)) issues.push({ code: "invalid_priority", field: "priority", message: "Activity priority is invalid." });
}

function addDateIssue(value: string | undefined, issues: ActivityValidationIssue[]) {
  if (value && Number.isNaN(new Date(value).getTime())) issues.push({ code: "invalid_date", field: "performedAt", message: "Activity date is invalid." });
}

function addPermissionIssue(permission: CreateActivityInput["permission"], issues: ActivityValidationIssue[]) {
  if (permission && !permission.allowed) {
    issues.push({ code: "permission_denied", field: "permission", message: "Activity operation is not permitted." });
  }
}

function createValidationResult(issues: readonly ActivityValidationIssue[]): ActivityValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}
