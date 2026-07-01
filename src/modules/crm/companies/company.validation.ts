import type { CreateCompanyInput, UpdateCompanyInput, WorkspaceId } from "./company.types";

export type CompanyValidationIssueCode =
  | "missing_company_name"
  | "missing_workspace"
  | "missing_company_id"
  | "missing_user"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_website"
  | "permission_denied";

export type CompanyValidationIssue = Readonly<{
  code: CompanyValidationIssueCode;
  field?: string;
  message: string;
}>;

export type CompanyValidationResult = Readonly<{
  valid: boolean;
  issues: readonly CompanyValidationIssue[];
}>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()0-9\s.-]{6,24}$/;
const WEBSITE_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;

export function validateCreateCompanyInput(input: CreateCompanyInput): CompanyValidationResult {
  const issues: CompanyValidationIssue[] = [];

  addWorkspaceIssue(input.workspaceId, issues);
  addCompanyNameIssue(input.legalName, issues);
  addUserIssue(input.createdBy, "createdBy", issues);
  addEmailIssue(input.email, issues);
  addPhoneIssue(input.phone, issues);
  addWebsiteIssue(input.website, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function validateUpdateCompanyInput(input: UpdateCompanyInput): CompanyValidationResult {
  const issues: CompanyValidationIssue[] = [];

  if (!input.id?.trim()) {
    issues.push({ code: "missing_company_id", field: "id", message: "Company id is required." });
  }

  addWorkspaceIssue(input.workspaceId, issues);
  if (input.legalName !== undefined) addCompanyNameIssue(input.legalName, issues);
  addUserIssue(input.updatedBy, "updatedBy", issues);
  addEmailIssue(input.email, issues);
  addPhoneIssue(input.phone, issues);
  addWebsiteIssue(input.website, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function isValidCompanyEmail(email: string | undefined) {
  return !email || EMAIL_PATTERN.test(email);
}

export function isValidCompanyPhone(phone: string | undefined) {
  return !phone || PHONE_PATTERN.test(phone);
}

export function isValidCompanyWebsite(website: string | undefined) {
  return !website || WEBSITE_PATTERN.test(website);
}

function addWorkspaceIssue(workspaceId: WorkspaceId | undefined, issues: CompanyValidationIssue[]) {
  if (!workspaceId?.trim()) {
    issues.push({ code: "missing_workspace", field: "workspaceId", message: "Workspace scope is required." });
  }
}

function addCompanyNameIssue(name: string | undefined, issues: CompanyValidationIssue[]) {
  if (!name?.trim()) {
    issues.push({ code: "missing_company_name", field: "legalName", message: "Company legal name is required." });
  }
}

function addUserIssue(userId: string | undefined, field: string, issues: CompanyValidationIssue[]) {
  if (!userId?.trim()) {
    issues.push({ code: "missing_user", field, message: "User id is required." });
  }
}

function addEmailIssue(email: string | undefined, issues: CompanyValidationIssue[]) {
  if (!isValidCompanyEmail(email)) {
    issues.push({ code: "invalid_email", field: "email", message: "Company email format is invalid." });
  }
}

function addPhoneIssue(phone: string | undefined, issues: CompanyValidationIssue[]) {
  if (!isValidCompanyPhone(phone)) {
    issues.push({ code: "invalid_phone", field: "phone", message: "Company phone format is invalid." });
  }
}

function addWebsiteIssue(website: string | undefined, issues: CompanyValidationIssue[]) {
  if (!isValidCompanyWebsite(website)) {
    issues.push({ code: "invalid_website", field: "website", message: "Company website format is invalid." });
  }
}

function addPermissionIssue(permission: CreateCompanyInput["permission"], issues: CompanyValidationIssue[]) {
  if (permission && !permission.allowed) {
    issues.push({ code: "permission_denied", field: "permission", message: "Company operation is not permitted." });
  }
}

function createValidationResult(issues: readonly CompanyValidationIssue[]): CompanyValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}

