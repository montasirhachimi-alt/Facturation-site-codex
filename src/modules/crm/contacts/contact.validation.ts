import type { ContactId, ContactStatus, CreateContactInput, UpdateContactInput } from "./contact.types";
import type { CompanyId, WorkspaceId } from "../companies/company.types";

export type ContactValidationIssueCode =
  | "missing_contact_id"
  | "missing_workspace"
  | "missing_company"
  | "missing_first_name"
  | "missing_last_name"
  | "missing_user"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_linkedin"
  | "invalid_status"
  | "permission_denied";

export type ContactValidationIssue = Readonly<{
  code: ContactValidationIssueCode;
  field?: string;
  message: string;
}>;

export type ContactValidationResult = Readonly<{
  valid: boolean;
  issues: readonly ContactValidationIssue[];
}>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()0-9\s.-]{6,24}$/;
const LINKEDIN_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i;
const CONTACT_STATUSES: readonly ContactStatus[] = ["active", "inactive", "archived"];

export function validateCreateContactInput(input: CreateContactInput): ContactValidationResult {
  const issues: ContactValidationIssue[] = [];

  addWorkspaceIssue(input.workspaceId, issues);
  addCompanyIssue(input.companyId, issues);
  addNameIssue(input.firstName, "firstName", "missing_first_name", "Contact first name is required.", issues);
  addNameIssue(input.lastName, "lastName", "missing_last_name", "Contact last name is required.", issues);
  addUserIssue(input.createdBy, "createdBy", issues);
  addEmailIssue(input.email, issues);
  addPhoneIssue(input.mobilePhone, "mobilePhone", issues);
  addPhoneIssue(input.officePhone, "officePhone", issues);
  addLinkedinIssue(input.linkedin, issues);
  addStatusIssue(input.status, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function validateUpdateContactInput(input: UpdateContactInput): ContactValidationResult {
  const issues: ContactValidationIssue[] = [];

  addContactIdIssue(input.id, issues);
  addWorkspaceIssue(input.workspaceId, issues);
  if (input.companyId !== undefined) addCompanyIssue(input.companyId, issues);
  if (input.firstName !== undefined) addNameIssue(input.firstName, "firstName", "missing_first_name", "Contact first name is required.", issues);
  if (input.lastName !== undefined) addNameIssue(input.lastName, "lastName", "missing_last_name", "Contact last name is required.", issues);
  addUserIssue(input.updatedBy, "updatedBy", issues);
  addEmailIssue(input.email, issues);
  addPhoneIssue(input.mobilePhone, "mobilePhone", issues);
  addPhoneIssue(input.officePhone, "officePhone", issues);
  addLinkedinIssue(input.linkedin, issues);
  addStatusIssue(input.status, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function isValidContactEmail(email: string | undefined) {
  return !email || EMAIL_PATTERN.test(email);
}

export function isValidContactPhone(phone: string | undefined) {
  return !phone || PHONE_PATTERN.test(phone);
}

export function isValidContactLinkedin(linkedin: string | undefined) {
  return !linkedin || LINKEDIN_PATTERN.test(linkedin);
}

function addContactIdIssue(contactId: ContactId | undefined, issues: ContactValidationIssue[]) {
  if (!contactId?.trim()) {
    issues.push({ code: "missing_contact_id", field: "id", message: "Contact id is required." });
  }
}

function addWorkspaceIssue(workspaceId: WorkspaceId | undefined, issues: ContactValidationIssue[]) {
  if (!workspaceId?.trim()) {
    issues.push({ code: "missing_workspace", field: "workspaceId", message: "Workspace scope is required." });
  }
}

function addCompanyIssue(companyId: CompanyId | undefined, issues: ContactValidationIssue[]) {
  if (!companyId?.trim()) {
    issues.push({ code: "missing_company", field: "companyId", message: "Company id is required." });
  }
}

function addNameIssue(value: string | undefined, field: string, code: ContactValidationIssueCode, message: string, issues: ContactValidationIssue[]) {
  if (!value?.trim()) {
    issues.push({ code, field, message });
  }
}

function addUserIssue(userId: string | undefined, field: string, issues: ContactValidationIssue[]) {
  if (!userId?.trim()) {
    issues.push({ code: "missing_user", field, message: "User id is required." });
  }
}

function addEmailIssue(email: string | undefined, issues: ContactValidationIssue[]) {
  if (!isValidContactEmail(email)) {
    issues.push({ code: "invalid_email", field: "email", message: "Contact email format is invalid." });
  }
}

function addPhoneIssue(phone: string | undefined, field: string, issues: ContactValidationIssue[]) {
  if (!isValidContactPhone(phone)) {
    issues.push({ code: "invalid_phone", field, message: "Contact phone format is invalid." });
  }
}

function addLinkedinIssue(linkedin: string | undefined, issues: ContactValidationIssue[]) {
  if (!isValidContactLinkedin(linkedin)) {
    issues.push({ code: "invalid_linkedin", field: "linkedin", message: "LinkedIn profile format is invalid." });
  }
}

function addStatusIssue(status: ContactStatus | undefined, issues: ContactValidationIssue[]) {
  if (status && !CONTACT_STATUSES.includes(status)) {
    issues.push({ code: "invalid_status", field: "status", message: "Contact status is invalid." });
  }
}

function addPermissionIssue(permission: CreateContactInput["permission"], issues: ContactValidationIssue[]) {
  if (permission && !permission.allowed) {
    issues.push({ code: "permission_denied", field: "permission", message: "Contact operation is not permitted." });
  }
}

function createValidationResult(issues: readonly ContactValidationIssue[]): ContactValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}
