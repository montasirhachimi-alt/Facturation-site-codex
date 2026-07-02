import { MEETING_STATUSES, MEETING_TYPES } from "./meeting.constants";
import type { CreateMeetingInput, MeetingId, MeetingStatus, MeetingType, UpdateMeetingInput } from "./meeting.types";
import type { CompanyId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";

export type MeetingValidationIssueCode =
  | "missing_meeting_id"
  | "missing_workspace"
  | "missing_company"
  | "missing_contact"
  | "missing_title"
  | "missing_organizer"
  | "invalid_type"
  | "invalid_status"
  | "invalid_start_date"
  | "invalid_end_date"
  | "invalid_date_range"
  | "permission_denied";

export type MeetingValidationIssue = Readonly<{
  code: MeetingValidationIssueCode;
  field?: string;
  message: string;
}>;

export type MeetingValidationResult = Readonly<{
  valid: boolean;
  issues: readonly MeetingValidationIssue[];
}>;

export function validateCreateMeetingInput(input: CreateMeetingInput): MeetingValidationResult {
  const issues: MeetingValidationIssue[] = [];

  addWorkspaceIssue(input.workspaceId, issues);
  addCompanyIssue(input.companyId, issues);
  addContactIssue(input.contactIds, issues);
  addTitleIssue(input.title, issues);
  addOrganizerIssue(input.organizerId, issues);
  addTypeIssue(input.meetingType, issues);
  addStatusIssue(input.status, issues);
  addDateIssues(input.startAt, input.endAt, issues);
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

export function validateUpdateMeetingInput(input: UpdateMeetingInput): MeetingValidationResult {
  const issues: MeetingValidationIssue[] = [];

  addMeetingIdIssue(input.id, issues);
  addWorkspaceIssue(input.workspaceId, issues);
  if (input.companyId !== undefined) addCompanyIssue(input.companyId, issues);
  if (input.contactIds !== undefined) addContactIssue(input.contactIds, issues);
  if (input.title !== undefined) addTitleIssue(input.title, issues);
  if (input.organizerId !== undefined) addOrganizerIssue(input.organizerId, issues);
  addTypeIssue(input.meetingType, issues);
  addStatusIssue(input.status, issues);
  if (input.startAt !== undefined || input.endAt !== undefined) {
    addDateIssues(input.startAt, input.endAt, issues);
  }
  addPermissionIssue(input.permission, issues);

  return createValidationResult(issues);
}

function addMeetingIdIssue(id: MeetingId | undefined, issues: MeetingValidationIssue[]) {
  if (!id?.trim()) issues.push({ code: "missing_meeting_id", field: "id", message: "Meeting id is required." });
}

function addWorkspaceIssue(workspaceId: WorkspaceId | undefined, issues: MeetingValidationIssue[]) {
  if (!workspaceId?.trim()) issues.push({ code: "missing_workspace", field: "workspaceId", message: "Workspace scope is required." });
}

function addCompanyIssue(companyId: CompanyId | undefined, issues: MeetingValidationIssue[]) {
  if (!companyId?.trim()) issues.push({ code: "missing_company", field: "companyId", message: "Company id is required." });
}

function addContactIssue(contactIds: readonly ContactId[] | undefined, issues: MeetingValidationIssue[]) {
  if (!contactIds?.length || contactIds.some((contactId) => !contactId.trim())) {
    issues.push({ code: "missing_contact", field: "contactIds", message: "At least one contact id is required." });
  }
}

function addTitleIssue(title: string | undefined, issues: MeetingValidationIssue[]) {
  if (!title?.trim()) issues.push({ code: "missing_title", field: "title", message: "Meeting title is required." });
}

function addOrganizerIssue(organizerId: string | undefined, issues: MeetingValidationIssue[]) {
  if (!organizerId?.trim()) issues.push({ code: "missing_organizer", field: "organizerId", message: "Meeting organizer is required." });
}

function addTypeIssue(meetingType: MeetingType | undefined, issues: MeetingValidationIssue[]) {
  if (meetingType && !MEETING_TYPES.includes(meetingType)) issues.push({ code: "invalid_type", field: "meetingType", message: "Meeting type is invalid." });
}

function addStatusIssue(status: MeetingStatus | undefined, issues: MeetingValidationIssue[]) {
  if (status && !MEETING_STATUSES.includes(status)) issues.push({ code: "invalid_status", field: "status", message: "Meeting status is invalid." });
}

function addDateIssues(startAt: string | undefined, endAt: string | undefined, issues: MeetingValidationIssue[]) {
  const startTime = startAt ? new Date(startAt).getTime() : Number.NaN;
  const endTime = endAt ? new Date(endAt).getTime() : Number.NaN;

  if (!startAt || Number.isNaN(startTime)) issues.push({ code: "invalid_start_date", field: "startAt", message: "Meeting start date is invalid." });
  if (!endAt || Number.isNaN(endTime)) issues.push({ code: "invalid_end_date", field: "endAt", message: "Meeting end date is invalid." });
  if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && endTime <= startTime) {
    issues.push({ code: "invalid_date_range", field: "endAt", message: "Meeting end date must be after start date." });
  }
}

function addPermissionIssue(permission: CreateMeetingInput["permission"], issues: MeetingValidationIssue[]) {
  if (permission && !permission.allowed) {
    issues.push({ code: "permission_denied", field: "permission", message: "Meeting operation is not permitted." });
  }
}

function createValidationResult(issues: readonly MeetingValidationIssue[]): MeetingValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}
