import { NOTE_VISIBILITIES } from "./note.constants";
import type { CreateNoteInput, NoteId, NoteVisibility, UpdateNoteInput } from "./note.types";
import type { CompanyId, WorkspaceId } from "../companies/company.types";

export type NoteValidationIssueCode =
  | "missing_note_id"
  | "missing_workspace"
  | "missing_company"
  | "missing_title"
  | "missing_content"
  | "missing_author"
  | "invalid_visibility"
  | "invalid_archived_date"
  | "permission_denied";

export type NoteValidationIssue = Readonly<{
  code: NoteValidationIssueCode;
  field?: string;
  message: string;
}>;

export type NoteValidationResult = Readonly<{
  valid: boolean;
  issues: readonly NoteValidationIssue[];
}>;

export function validateCreateNoteInput(input: CreateNoteInput): NoteValidationResult {
  const issues: NoteValidationIssue[] = [];

  addWorkspaceIssue(input.workspaceId, issues);
  addCompanyIssue(input.companyId, issues);
  addTitleIssue(input.title, issues);
  addContentIssue(input.content, issues);
  addAuthorIssue(input.authorId, issues);
  addVisibilityIssue(input.visibility, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function validateUpdateNoteInput(input: UpdateNoteInput): NoteValidationResult {
  const issues: NoteValidationIssue[] = [];

  addNoteIdIssue(input.id, issues);
  addWorkspaceIssue(input.workspaceId, issues);
  if (input.companyId !== undefined) addCompanyIssue(input.companyId, issues);
  if (input.title !== undefined) addTitleIssue(input.title, issues);
  if (input.content !== undefined) addContentIssue(input.content, issues);
  if (input.authorId !== undefined) addAuthorIssue(input.authorId, issues);
  addVisibilityIssue(input.visibility, issues);
  addArchivedDateIssue(input.archivedAt, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

function addNoteIdIssue(id: NoteId | undefined, issues: NoteValidationIssue[]) {
  if (!id?.trim()) issues.push({ code: "missing_note_id", field: "id", message: "Note id is required." });
}

function addWorkspaceIssue(workspaceId: WorkspaceId | undefined, issues: NoteValidationIssue[]) {
  if (!workspaceId?.trim()) issues.push({ code: "missing_workspace", field: "workspaceId", message: "Workspace scope is required." });
}

function addCompanyIssue(companyId: CompanyId | undefined, issues: NoteValidationIssue[]) {
  if (!companyId?.trim()) issues.push({ code: "missing_company", field: "companyId", message: "Company id is required." });
}

function addTitleIssue(title: string | undefined, issues: NoteValidationIssue[]) {
  if (!title?.trim()) issues.push({ code: "missing_title", field: "title", message: "Note title is required." });
}

function addContentIssue(content: string | undefined, issues: NoteValidationIssue[]) {
  if (!content?.trim()) issues.push({ code: "missing_content", field: "content", message: "Note content is required." });
}

function addAuthorIssue(authorId: string | undefined, issues: NoteValidationIssue[]) {
  if (!authorId?.trim()) issues.push({ code: "missing_author", field: "authorId", message: "Note author is required." });
}

function addVisibilityIssue(visibility: NoteVisibility | undefined, issues: NoteValidationIssue[]) {
  if (visibility && !NOTE_VISIBILITIES.includes(visibility)) issues.push({ code: "invalid_visibility", field: "visibility", message: "Note visibility is invalid." });
}

function addArchivedDateIssue(value: string | undefined, issues: NoteValidationIssue[]) {
  if (value && Number.isNaN(new Date(value).getTime())) issues.push({ code: "invalid_archived_date", field: "archivedAt", message: "Archived date is invalid." });
}

function addPermissionIssue(permission: CreateNoteInput["permission"], issues: NoteValidationIssue[]) {
  if (permission && !permission.allowed) {
    issues.push({ code: "permission_denied", field: "permission", message: "Note operation is not permitted." });
  }
}

function createValidationResult(issues: readonly NoteValidationIssue[]): NoteValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}
