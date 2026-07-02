import { DEFAULT_MEETING_SORT, DEFAULT_MEETING_STATUS, DEFAULT_MEETING_TYPE } from "./meeting.constants";
import type { CreateActivityInput } from "@/modules/crm/activities";
import type { Meeting, MeetingFilters, MeetingSearchQuery, MeetingSort, CreateMeetingInput, UpdateMeetingInput } from "./meeting.types";
import { filterCrmEntities, normalizeCrmTags, searchCrmEntities, sortCrmEntities } from "@/modules/crm/shared";

export function normalizeCreateMeetingInput(input: CreateMeetingInput) {
  return {
    ...input,
    contactIds: Object.freeze(Array.from(new Set(input.contactIds))),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    location: input.location?.trim() || undefined,
    meetingType: input.meetingType ?? DEFAULT_MEETING_TYPE,
    status: input.status ?? DEFAULT_MEETING_STATUS,
    participants: Object.freeze((input.participants ?? []).map((participant) => Object.freeze({ ...participant, name: participant.name.trim(), email: participant.email?.trim().toLowerCase() || undefined }))),
    notes: input.notes?.trim() || undefined,
    tags: normalizeCrmTags(input.tags)
  };
}

export function normalizeUpdateMeetingInput(input: UpdateMeetingInput) {
  return {
    ...input,
    contactIds: input.contactIds ? Object.freeze(Array.from(new Set(input.contactIds))) : undefined,
    title: input.title?.trim(),
    description: input.description?.trim() || undefined,
    location: input.location?.trim() || undefined,
    participants: input.participants
      ? Object.freeze(input.participants.map((participant) => Object.freeze({ ...participant, name: participant.name.trim(), email: participant.email?.trim().toLowerCase() || undefined })))
      : undefined,
    notes: input.notes?.trim() || undefined,
    tags: input.tags ? normalizeCrmTags(input.tags) : undefined
  };
}

export function filterMeetings(meetings: readonly Meeting[], filters: MeetingFilters) {
  return filterCrmEntities(meetings, {
    workspaceId: filters.workspaceId,
    status: filters.status,
    ownerId: filters.organizerId,
    tags: filters.tags,
    archived: false
  }).filter((meeting) => {
    if (!filters.includeCancelled && isMeetingCancelled(meeting)) return false;
    if (filters.companyId && meeting.companyId !== filters.companyId) return false;
    if (filters.contactId && !meeting.contactIds.includes(filters.contactId)) return false;
    if (filters.meetingType && meeting.meetingType !== filters.meetingType) return false;
    if (filters.dateFrom && meeting.startAt < filters.dateFrom) return false;
    if (filters.dateTo && meeting.startAt > filters.dateTo) return false;
    return true;
  });
}

export function matchesMeetingSearch(meeting: Meeting, search: MeetingSearchQuery) {
  if (meeting.workspaceId !== search.workspaceId) return false;
  if (search.companyId && meeting.companyId !== search.companyId) return false;
  if (search.contactId && !meeting.contactIds.includes(search.contactId)) return false;
  if (!search.includeCancelled && isMeetingCancelled(meeting)) return false;
  if (!search.query.trim()) return true;

  return searchCrmEntities([meeting], {
    query: search.query,
    fields: ["title", "description", "location", "meetingType", "status", "organizerId", "notes"]
  }).length > 0;
}

export function sortMeetings(meetings: readonly Meeting[], sort: MeetingSort = DEFAULT_MEETING_SORT) {
  return sortCrmEntities(meetings, [sort]);
}

export function createMeetingDisplayLabel(meeting: Pick<Meeting, "title" | "startAt">) {
  return `${meeting.title} · ${new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(meeting.startAt))}`;
}

export function prepareMeetingActivityInput(meeting: Meeting): CreateActivityInput {
  return Object.freeze({
    workspaceId: meeting.workspaceId,
    companyId: meeting.companyId,
    contactId: meeting.contactIds[0],
    type: "meeting",
    title: meeting.title,
    description: meeting.description ?? `Meeting ${meeting.status} with ${meeting.participants.length} participant(s).`,
    performedBy: meeting.organizerId,
    performedAt: meeting.startAt,
    status: meeting.status === "completed" ? "completed" : "open",
    priority: "normal",
    tags: Object.freeze(["meeting", ...meeting.tags]),
    metadata: Object.freeze({ meetingId: meeting.id, meetingType: meeting.meetingType })
  });
}

export function isMeetingUpcoming(meeting: Meeting, now = new Date().toISOString()) {
  return !isMeetingCancelled(meeting) && meeting.startAt >= now;
}

export function isMeetingPast(meeting: Meeting, now = new Date().toISOString()) {
  return meeting.startAt < now || meeting.status === "completed";
}

export function isMeetingCancelled(meeting: Meeting) {
  return meeting.status === "cancelled";
}
