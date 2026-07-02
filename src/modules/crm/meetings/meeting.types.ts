import type { PermissionDecision } from "@/runtime/permissions";
import type { Activity, CreateActivityInput } from "@/modules/crm/activities";
import type { CompanyId, UserId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";

export type MeetingId = string & { readonly __brand: "MeetingId" };

export type MeetingType =
  | "on_site"
  | "online"
  | "phone_call"
  | "demo"
  | "sales_meeting"
  | "internal"
  | "customer_success"
  | "custom";

export type MeetingStatus = "planned" | "confirmed" | "completed" | "cancelled";

export type MeetingParticipant = Readonly<{
  id: string;
  name: string;
  email?: string;
  role?: string;
}>;

export type Meeting = Readonly<{
  id: MeetingId;
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  contactIds: readonly ContactId[];
  title: string;
  description?: string;
  location?: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  startAt: string;
  endAt: string;
  organizerId: UserId;
  participants: readonly MeetingParticipant[];
  notes?: string;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
}>;

export type CreateMeetingInput = Readonly<{
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  contactIds: readonly ContactId[];
  title: string;
  description?: string;
  location?: string;
  meetingType?: MeetingType;
  status?: MeetingStatus;
  startAt: string;
  endAt: string;
  organizerId: UserId;
  participants?: readonly MeetingParticipant[];
  notes?: string;
  tags?: readonly string[];
  permission?: PermissionDecision;
}>;

export type UpdateMeetingInput = Readonly<{
  id: MeetingId;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactIds?: readonly ContactId[];
  title?: string;
  description?: string;
  location?: string;
  meetingType?: MeetingType;
  status?: MeetingStatus;
  startAt?: string;
  endAt?: string;
  organizerId?: UserId;
  participants?: readonly MeetingParticipant[];
  notes?: string;
  tags?: readonly string[];
  permission?: PermissionDecision;
}>;

export type MeetingFilters = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingType?: MeetingType;
  status?: MeetingStatus;
  organizerId?: UserId;
  dateFrom?: string;
  dateTo?: string;
  tags?: readonly string[];
  includeCancelled?: boolean;
  permission?: PermissionDecision;
}>;

export type MeetingSearchQuery = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  query: string;
  includeCancelled?: boolean;
  permission?: PermissionDecision;
}>;

export type MeetingSortField = "startAt" | "endAt" | "updatedAt" | "title" | "meetingType" | "status";
export type MeetingSortDirection = "asc" | "desc";

export type MeetingSort = Readonly<{
  field: MeetingSortField;
  direction: MeetingSortDirection;
}>;

export type MeetingListResult = Readonly<{
  meetings: readonly Meeting[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
}>;

export type MeetingActivityPreparation = Readonly<{
  meeting: Meeting;
  activityInput: CreateActivityInput;
  activity?: Activity;
}>;
