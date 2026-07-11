import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "./task.constants";
import type { CreateTaskInput, TaskId, TaskPriority, TaskStatus, TaskType, UpdateTaskInput } from "./task.types";
import type { CompanyId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";

export type TaskValidationIssueCode =
  | "missing_task_id"
  | "missing_workspace"
  | "missing_company"
  | "invalid_contact"
  | "missing_title"
  | "missing_assignee"
  | "invalid_type"
  | "invalid_status"
  | "invalid_priority"
  | "invalid_due_date"
  | "invalid_completed_date"
  | "permission_denied";

export type TaskValidationIssue = Readonly<{
  code: TaskValidationIssueCode;
  field?: string;
  message: string;
}>;

export type TaskValidationResult = Readonly<{
  valid: boolean;
  issues: readonly TaskValidationIssue[];
}>;

export function validateCreateTaskInput(input: CreateTaskInput): TaskValidationResult {
  const issues: TaskValidationIssue[] = [];

  addWorkspaceIssue(input.workspaceId, issues);
  addCompanyIssue(input.companyId, issues);
  addTitleIssue(input.title, issues);
  addAssigneeIssue(input.assignedTo, issues);
  addTypeIssue(input.taskType, issues);
  addStatusIssue(input.status, issues);
  addPriorityIssue(input.priority, issues);
  addDueDateIssue(input.dueDate, issues);
  addCompletedDateIssue(input.completedAt, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function validateUpdateTaskInput(input: UpdateTaskInput): TaskValidationResult {
  const issues: TaskValidationIssue[] = [];

  addTaskIdIssue(input.id, issues);
  addWorkspaceIssue(input.workspaceId, issues);
  if (input.companyId !== undefined) addCompanyIssue(input.companyId, issues);
  if (input.contactId !== undefined) addContactIssue(input.contactId, issues);
  if (input.title !== undefined) addTitleIssue(input.title, issues);
  if (input.assignedTo !== undefined) addAssigneeIssue(input.assignedTo, issues);
  addTypeIssue(input.taskType, issues);
  addStatusIssue(input.status, issues);
  addPriorityIssue(input.priority, issues);
  if (input.dueDate !== undefined) addDueDateIssue(input.dueDate, issues);
  addCompletedDateIssue(input.completedAt, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

function addTaskIdIssue(id: TaskId | undefined, issues: TaskValidationIssue[]) {
  if (!id?.trim()) issues.push({ code: "missing_task_id", field: "id", message: "Task id is required." });
}

function addWorkspaceIssue(workspaceId: WorkspaceId | undefined, issues: TaskValidationIssue[]) {
  if (!workspaceId?.trim()) issues.push({ code: "missing_workspace", field: "workspaceId", message: "Workspace scope is required." });
}

function addCompanyIssue(companyId: CompanyId | undefined, issues: TaskValidationIssue[]) {
  if (!companyId?.trim()) issues.push({ code: "missing_company", field: "companyId", message: "Company id is required." });
}

function addContactIssue(contactId: ContactId | undefined, issues: TaskValidationIssue[]) {
  if (!contactId?.trim()) issues.push({ code: "invalid_contact", field: "contactId", message: "Contact id is invalid." });
}

function addTitleIssue(title: string | undefined, issues: TaskValidationIssue[]) {
  if (!title?.trim()) issues.push({ code: "missing_title", field: "title", message: "Task title is required." });
}

function addAssigneeIssue(userId: string | undefined, issues: TaskValidationIssue[]) {
  if (!userId?.trim()) issues.push({ code: "missing_assignee", field: "assignedTo", message: "Task assignee is required." });
}

function addTypeIssue(taskType: TaskType | undefined, issues: TaskValidationIssue[]) {
  if (taskType && !TASK_TYPES.includes(taskType)) issues.push({ code: "invalid_type", field: "taskType", message: "Task type is invalid." });
}

function addStatusIssue(status: TaskStatus | undefined, issues: TaskValidationIssue[]) {
  if (status && !TASK_STATUSES.includes(status)) issues.push({ code: "invalid_status", field: "status", message: "Task status is invalid." });
}

function addPriorityIssue(priority: TaskPriority | undefined, issues: TaskValidationIssue[]) {
  if (priority && !TASK_PRIORITIES.includes(priority)) issues.push({ code: "invalid_priority", field: "priority", message: "Task priority is invalid." });
}

function addDueDateIssue(value: string | undefined, issues: TaskValidationIssue[]) {
  if (!value || Number.isNaN(new Date(value).getTime())) issues.push({ code: "invalid_due_date", field: "dueDate", message: "Task due date is invalid." });
}

function addCompletedDateIssue(value: string | undefined, issues: TaskValidationIssue[]) {
  if (value && Number.isNaN(new Date(value).getTime())) issues.push({ code: "invalid_completed_date", field: "completedAt", message: "Task completed date is invalid." });
}

function addPermissionIssue(permission: CreateTaskInput["permission"], issues: TaskValidationIssue[]) {
  if (permission && !permission.allowed) {
    issues.push({ code: "permission_denied", field: "permission", message: "Task operation is not permitted." });
  }
}

function createValidationResult(issues: readonly TaskValidationIssue[]): TaskValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}
