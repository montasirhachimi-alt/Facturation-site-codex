import { DEFAULT_NOTE_SORT, DEFAULT_NOTE_VISIBILITY } from "./note.constants";
import type { CreateActivityInput } from "@/modules/crm/activities";
import type { CreateNoteInput, Note, NoteFilters, NoteSearchQuery, NoteSort, UpdateNoteInput } from "./note.types";
import { filterCrmEntities, normalizeCrmTags, searchCrmEntities, sortCrmEntities } from "@/modules/crm/shared";

export function normalizeCreateNoteInput(input: CreateNoteInput) {
  return {
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    visibility: input.visibility ?? DEFAULT_NOTE_VISIBILITY,
    tags: normalizeCrmTags(input.tags),
    attachments: Object.freeze((input.attachments ?? []).map((attachment) => Object.freeze({ ...attachment, name: attachment.name.trim() })))
  };
}

export function normalizeUpdateNoteInput(input: UpdateNoteInput) {
  return {
    ...input,
    title: input.title?.trim(),
    content: input.content?.trim(),
    tags: input.tags ? normalizeCrmTags(input.tags) : undefined,
    attachments: input.attachments ? Object.freeze(input.attachments.map((attachment) => Object.freeze({ ...attachment, name: attachment.name.trim() }))) : undefined
  };
}

export function filterNotes(notes: readonly Note[], filters: NoteFilters) {
  return filterCrmEntities(notes, {
    workspaceId: filters.workspaceId,
    ownerId: filters.authorId,
    tags: filters.tags,
    archived: false
  }).filter((note) => {
    if (!filters.includeArchived && isNoteArchived(note)) return false;
    if (filters.companyId && note.companyId !== filters.companyId) return false;
    if (filters.contactId && note.contactId !== filters.contactId) return false;
    if (filters.meetingId && note.meetingId !== filters.meetingId) return false;
    if (filters.taskId && note.taskId !== filters.taskId) return false;
    if (filters.visibility && note.visibility !== filters.visibility) return false;
    return true;
  });
}

export function matchesNoteSearch(note: Note, search: NoteSearchQuery) {
  if (note.workspaceId !== search.workspaceId) return false;
  if (search.companyId && note.companyId !== search.companyId) return false;
  if (search.contactId && note.contactId !== search.contactId) return false;
  if (search.meetingId && note.meetingId !== search.meetingId) return false;
  if (search.taskId && note.taskId !== search.taskId) return false;
  if (!search.includeArchived && isNoteArchived(note)) return false;
  if (!search.query.trim()) return true;

  return searchCrmEntities([note], {
    query: search.query,
    fields: ["title", "content", "visibility", "authorId"]
  }).length > 0;
}

export function sortNotes(notes: readonly Note[], sort: NoteSort = DEFAULT_NOTE_SORT) {
  return sortCrmEntities(notes, [sort]);
}

export function prepareNoteActivityInput(note: Note, event: "created" | "updated" | "archived" = "created"): CreateActivityInput {
  return Object.freeze({
    workspaceId: note.workspaceId,
    companyId: note.companyId,
    contactId: note.contactId,
    type: "note",
    title: createNoteActivityTitle(note, event),
    description: createNoteExcerpt(note.content),
    performedBy: note.authorId,
    performedAt: event === "archived" ? note.archivedAt ?? note.updatedAt : note.updatedAt,
    status: "completed",
    priority: "normal",
    tags: Object.freeze(["note", event, ...note.tags]),
    metadata: Object.freeze({ noteId: note.id, visibility: note.visibility, meetingId: note.meetingId, taskId: note.taskId })
  });
}

export function createNoteExcerpt(content: string, maxLength = 120) {
  const normalized = content.trim().replace(/\s+/g, " ");
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

export function isPinnedNote(note: Note) {
  return note.tags.includes("pinned");
}

export function isNoteArchived(note: Note) {
  return Boolean(note.archivedAt);
}

function createNoteActivityTitle(note: Note, event: "created" | "updated" | "archived") {
  const labels = {
    created: "Note created",
    updated: "Note updated",
    archived: "Note archived"
  };
  return `${labels[event]}: ${note.title}`;
}
