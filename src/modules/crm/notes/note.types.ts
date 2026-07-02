import type { PermissionDecision } from "@/runtime/permissions";
import type { Activity, CreateActivityInput } from "@/modules/crm/activities";
import type { MeetingId } from "@/modules/crm/meetings";
import type { TaskId } from "@/modules/crm/tasks";
import type { CompanyId, UserId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";

export type NoteId = string & { readonly __brand: "NoteId" };

export type NoteVisibility = "private" | "team" | "company";

export type NoteAttachment = Readonly<{
  id: string;
  name: string;
  type?: string;
  url?: string;
}>;

export type Note = Readonly<{
  id: NoteId;
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  taskId?: TaskId;
  title: string;
  content: string;
  visibility: NoteVisibility;
  authorId: UserId;
  tags: readonly string[];
  attachments: readonly NoteAttachment[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}>;

export type CreateNoteInput = Readonly<{
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  taskId?: TaskId;
  title: string;
  content: string;
  visibility?: NoteVisibility;
  authorId: UserId;
  tags?: readonly string[];
  attachments?: readonly NoteAttachment[];
  permission?: PermissionDecision;
}>;

export type UpdateNoteInput = Readonly<{
  id: NoteId;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  taskId?: TaskId;
  title?: string;
  content?: string;
  visibility?: NoteVisibility;
  authorId?: UserId;
  tags?: readonly string[];
  attachments?: readonly NoteAttachment[];
  archivedAt?: string;
  permission?: PermissionDecision;
}>;

export type NoteFilters = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  taskId?: TaskId;
  visibility?: NoteVisibility;
  authorId?: UserId;
  tags?: readonly string[];
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type NoteSearchQuery = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  taskId?: TaskId;
  query: string;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type NoteSortField = "createdAt" | "updatedAt" | "title" | "visibility";
export type NoteSortDirection = "asc" | "desc";

export type NoteSort = Readonly<{
  field: NoteSortField;
  direction: NoteSortDirection;
}>;

export type NoteListResult = Readonly<{
  notes: readonly Note[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  taskId?: TaskId;
}>;

export type NoteActivityPreparation = Readonly<{
  note: Note;
  activityInput: CreateActivityInput;
  activity?: Activity;
}>;
