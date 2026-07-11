import { DEFAULT_MEETING_SORT } from "./meeting.constants";
import type {
  CreateMeetingInput,
  Meeting,
  MeetingActivityPreparation,
  MeetingFilters,
  MeetingId,
  MeetingListResult,
  MeetingSearchQuery,
  MeetingSort,
  UpdateMeetingInput
} from "./meeting.types";
import type { Activity } from "@/modules/crm/activities";
import type { CompanyId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";
import { filterMeetings, matchesMeetingSearch, normalizeCreateMeetingInput, normalizeUpdateMeetingInput, prepareMeetingActivityInput, sortMeetings } from "./meeting.utils";
import { validateCreateMeetingInput, validateUpdateMeetingInput } from "./meeting.validation";

export type MeetingServiceOptions = Readonly<{
  seed?: readonly Meeting[];
  now?: () => string;
  createId?: () => MeetingId;
  createActivity?: (input: ReturnType<typeof prepareMeetingActivityInput>) => Activity | undefined;
}>;

export class MeetingService {
  private readonly meetings = new Map<MeetingId, Meeting>();
  private readonly now: () => string;
  private readonly createId: () => MeetingId;
  private readonly createActivity?: MeetingServiceOptions["createActivity"];

  constructor(options: MeetingServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => `meet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as MeetingId);
    this.createActivity = options.createActivity;

    for (const meeting of options.seed ?? []) {
      this.meetings.set(meeting.id, freezeMeeting(meeting));
    }
  }

  replaceMeetings(meetings: readonly Meeting[]) {
    this.meetings.clear();
    for (const meeting of meetings) {
      this.meetings.set(meeting.id, freezeMeeting(meeting));
    }
  }

  listMeetings(filters: MeetingFilters, sort: MeetingSort = DEFAULT_MEETING_SORT): MeetingListResult {
    if (filters.permission && !filters.permission.allowed) {
      return createListResult([], 0, filters.workspaceId, filters.companyId, filters.contactId);
    }

    const workspaceMeetings = [...this.meetings.values()].filter((meeting) => meeting.workspaceId === filters.workspaceId);
    const filtered = filterMeetings(workspaceMeetings, filters);

    return createListResult(sortMeetings(filtered, sort), workspaceMeetings.length, filters.workspaceId, filters.companyId, filters.contactId);
  }

  getMeeting(id: MeetingId, workspaceId: WorkspaceId, permission = undefined as MeetingFilters["permission"]) {
    if (permission && !permission.allowed) return undefined;

    const meeting = this.meetings.get(id);
    return meeting?.workspaceId === workspaceId ? meeting : undefined;
  }

  getMeetingsByCompany(companyId: CompanyId, workspaceId: WorkspaceId, permission = undefined as MeetingFilters["permission"], sort: MeetingSort = DEFAULT_MEETING_SORT) {
    return this.listMeetings({ workspaceId, companyId, permission }, sort);
  }

  getMeetingsByContact(contactId: ContactId, workspaceId: WorkspaceId, permission = undefined as MeetingFilters["permission"], sort: MeetingSort = DEFAULT_MEETING_SORT) {
    return this.listMeetings({ workspaceId, contactId, permission }, sort);
  }

  createMeeting(input: CreateMeetingInput) {
    const validation = validateCreateMeetingInput(input);
    if (!validation.valid) return Object.freeze({ meeting: undefined, validation, activity: undefined, activityInput: undefined });

    const normalized = normalizeCreateMeetingInput(input);
    const timestamp = this.now();
    const meeting = freezeMeeting({
      id: this.createId(),
      workspaceId: normalized.workspaceId,
      companyId: normalized.companyId,
      contactIds: normalized.contactIds,
      title: normalized.title,
      description: normalized.description,
      location: normalized.location,
      meetingType: normalized.meetingType,
      status: normalized.status,
      startAt: normalized.startAt,
      endAt: normalized.endAt,
      organizerId: normalized.organizerId,
      participants: normalized.participants,
      notes: normalized.notes,
      tags: normalized.tags,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    this.meetings.set(meeting.id, meeting);
    const activityInput = prepareMeetingActivityInput(meeting);
    const activity = this.createActivity?.(activityInput);

    return Object.freeze({ meeting, validation, activity, activityInput } satisfies MeetingActivityPreparation & { validation: typeof validation });
  }

  updateMeeting(input: UpdateMeetingInput) {
    const validation = validateUpdateMeetingInput(input);
    if (!validation.valid) return Object.freeze({ meeting: undefined, validation });

    const existing = this.getMeeting(input.id, input.workspaceId, input.permission);
    if (!existing) return Object.freeze({ meeting: undefined, validation });

    const normalized = normalizeUpdateMeetingInput(input);
    const meeting = freezeMeeting({
      ...existing,
      companyId: normalized.companyId ?? existing.companyId,
      contactIds: normalized.contactIds ?? existing.contactIds,
      title: normalized.title ?? existing.title,
      description: normalized.description ?? existing.description,
      location: normalized.location ?? existing.location,
      meetingType: normalized.meetingType ?? existing.meetingType,
      status: normalized.status ?? existing.status,
      startAt: normalized.startAt ?? existing.startAt,
      endAt: normalized.endAt ?? existing.endAt,
      organizerId: normalized.organizerId ?? existing.organizerId,
      participants: normalized.participants ?? existing.participants,
      notes: normalized.notes ?? existing.notes,
      tags: normalized.tags ?? existing.tags,
      updatedAt: this.now()
    });

    this.meetings.set(meeting.id, meeting);
    return Object.freeze({ meeting, validation });
  }

  cancelMeeting(id: MeetingId, workspaceId: WorkspaceId, permission?: UpdateMeetingInput["permission"]) {
    return this.updateMeeting({ id, workspaceId, status: "cancelled", permission });
  }

  completeMeeting(id: MeetingId, workspaceId: WorkspaceId, permission?: UpdateMeetingInput["permission"]) {
    return this.updateMeeting({ id, workspaceId, status: "completed", permission });
  }

  searchMeetings(search: MeetingSearchQuery, sort: MeetingSort = DEFAULT_MEETING_SORT): MeetingListResult {
    if (search.permission && !search.permission.allowed) {
      return createListResult([], 0, search.workspaceId, search.companyId, search.contactId);
    }

    const workspaceMeetings = [...this.meetings.values()].filter((meeting) => meeting.workspaceId === search.workspaceId);
    const filtered = workspaceMeetings.filter((meeting) => matchesMeetingSearch(meeting, search));

    return createListResult(sortMeetings(filtered, sort), workspaceMeetings.length, search.workspaceId, search.companyId, search.contactId);
  }
}

export function freezeMeeting(meeting: Meeting): Meeting {
  return Object.freeze({
    ...meeting,
    contactIds: Object.freeze([...meeting.contactIds]),
    participants: Object.freeze(meeting.participants.map((participant) => Object.freeze({ ...participant }))),
    tags: Object.freeze([...meeting.tags])
  });
}

function createListResult(meetings: readonly Meeting[], total: number, workspaceId: WorkspaceId, companyId?: CompanyId, contactId?: ContactId): MeetingListResult {
  return Object.freeze({
    meetings: Object.freeze([...meetings]),
    total,
    filtered: meetings.length,
    workspaceId,
    companyId,
    contactId
  });
}

export const meetingService = new MeetingService();
