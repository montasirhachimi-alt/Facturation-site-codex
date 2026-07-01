import type { CreateCustomerInput, UpdateCustomerInput, WorkspaceId } from "./customer.types";

export type CustomerValidationIssueCode =
  | "missing_display_name"
  | "missing_workspace"
  | "missing_customer_id"
  | "missing_user"
  | "invalid_email"
  | "invalid_phone"
  | "permission_denied";

export type CustomerValidationIssue = Readonly<{
  code: CustomerValidationIssueCode;
  field?: string;
  message: string;
}>;

export type CustomerValidationResult = Readonly<{
  valid: boolean;
  issues: readonly CustomerValidationIssue[];
}>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()0-9\s.-]{6,24}$/;

export function validateCreateCustomerInput(input: CreateCustomerInput): CustomerValidationResult {
  const issues: CustomerValidationIssue[] = [];

  addWorkspaceIssue(input.workspaceId, issues);
  addDisplayNameIssue(input.displayName, issues);
  addUserIssue(input.createdBy, "createdBy", issues);
  addEmailIssue(input.email, issues);
  addPhoneIssue(input.phone, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function validateUpdateCustomerInput(input: UpdateCustomerInput): CustomerValidationResult {
  const issues: CustomerValidationIssue[] = [];

  if (!input.id?.trim()) {
    issues.push({ code: "missing_customer_id", field: "id", message: "Customer id is required." });
  }

  addWorkspaceIssue(input.workspaceId, issues);
  if (input.displayName !== undefined) addDisplayNameIssue(input.displayName, issues);
  addUserIssue(input.updatedBy, "updatedBy", issues);
  addEmailIssue(input.email, issues);
  addPhoneIssue(input.phone, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function isValidEmail(email: string | undefined) {
  return !email || EMAIL_PATTERN.test(email);
}

export function isValidPhone(phone: string | undefined) {
  return !phone || PHONE_PATTERN.test(phone);
}

function addWorkspaceIssue(workspaceId: WorkspaceId | undefined, issues: CustomerValidationIssue[]) {
  if (!workspaceId?.trim()) {
    issues.push({ code: "missing_workspace", field: "workspaceId", message: "Workspace scope is required." });
  }
}

function addDisplayNameIssue(displayName: string | undefined, issues: CustomerValidationIssue[]) {
  if (!displayName?.trim()) {
    issues.push({ code: "missing_display_name", field: "displayName", message: "Customer display name is required." });
  }
}

function addUserIssue(userId: string | undefined, field: string, issues: CustomerValidationIssue[]) {
  if (!userId?.trim()) {
    issues.push({ code: "missing_user", field, message: "User id is required." });
  }
}

function addEmailIssue(email: string | undefined, issues: CustomerValidationIssue[]) {
  if (!isValidEmail(email)) {
    issues.push({ code: "invalid_email", field: "email", message: "Customer email format is invalid." });
  }
}

function addPhoneIssue(phone: string | undefined, issues: CustomerValidationIssue[]) {
  if (!isValidPhone(phone)) {
    issues.push({ code: "invalid_phone", field: "phone", message: "Customer phone format is invalid." });
  }
}

function addPermissionIssue(permission: CreateCustomerInput["permission"], issues: CustomerValidationIssue[]) {
  if (permission && !permission.allowed) {
    issues.push({ code: "permission_denied", field: "permission", message: "Customer operation is not permitted." });
  }
}

function createValidationResult(issues: readonly CustomerValidationIssue[]): CustomerValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}

