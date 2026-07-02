import { DEFAULT_NOTE_SORT } from "./note.constants";
import type {
  CreateNoteInput,
  Note,
  NoteActivityPreparation,
  NoteFilters,
  NoteId,
  NoteListResult,
  NoteSearchQuery,
  NoteSort,
  UpdateNoteInput
} from "./note.types";
import type { Activity } from "@/modules/crm/activities";
import type { MeetingId } from "@/modules/crm/meetings";
import type { TaskId } from "@/modules/crm/tasks";
import type { CompanyId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";
import { filterNotes, matchesNoteSearch, normalizeCreateNoteInput, normalizeUpdateNoteInput, prepareNoteActivityInput, sortNotes } from "./note.utils";
import { validateCreateNoteInput, validateUpdateNoteInput } from "./note.validation";

export type NoteServiceOptions = Readonly<{
  seed?: readonly Note[];
  now?: () => string;
  createId?: () => NoteId;
  createActivity?: (input: ReturnType<typeof prepareNoteActivityInput>) => Activity | undefined;
}>;

export class NoteService {
  private readonly notes = new Map<NoteId, Note>();
  private readonly now: () => string;
  private readonly createId: () => NoteId;
  private readonly createActivity?: NoteServiceOptions["createActivity"];

  constructor(options: NoteServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as NoteId);
    this.createActivity = options.createActivity;

    for (const note of options.seed ?? []) {
      this.notes.set(note.id, freezeNote(note));
    }
  }

  listNotes(filters: NoteFilters, sort: NoteSort = DEFAULT_NOTE_SORT): NoteListResult {
    if (filters.permission && !filters.permission.allowed) {
      return createListResult([], 0, filters.workspaceId, filters.companyId, filters.contactId, filters.meetingId, filters.taskId);
    }

    const workspaceNotes = [...this.notes.values()].filter((note) => note.workspaceId === filters.workspaceId);
    const filtered = filterNotes(workspaceNotes, filters);

    return createListResult(sortNotes(filtered, sort), workspaceNotes.length, filters.workspaceId, filters.companyId, filters.contactId, filters.meetingId, filters.taskId);
  }

  getNote(id: NoteId, workspaceId: WorkspaceId, permission = undefined as NoteFilters["permission"]) {
    if (permission && !permission.allowed) return undefined;

    const note = this.notes.get(id);
    return note?.workspaceId === workspaceId ? note : undefined;
  }

  getNotesByCompany(companyId: CompanyId, workspaceId: WorkspaceId, permission = undefined as NoteFilters["permission"], sort: NoteSort = DEFAULT_NOTE_SORT) {
    return this.listNotes({ workspaceId, companyId, permission }, sort);
  }

  getNotesByContact(contactId: ContactId, workspaceId: WorkspaceId, permission = undefined as NoteFilters["permission"], sort: NoteSort = DEFAULT_NOTE_SORT) {
    return this.listNotes({ workspaceId, contactId, permission }, sort);
  }

  getNotesByMeeting(meetingId: MeetingId, workspaceId: WorkspaceId, permission = undefined as NoteFilters["permission"], sort: NoteSort = DEFAULT_NOTE_SORT) {
    return this.listNotes({ workspaceId, meetingId, permission }, sort);
  }

  getNotesByTask(taskId: TaskId, workspaceId: WorkspaceId, permission = undefined as NoteFilters["permission"], sort: NoteSort = DEFAULT_NOTE_SORT) {
    return this.listNotes({ workspaceId, taskId, permission }, sort);
  }

  createNote(input: CreateNoteInput) {
    const validation = validateCreateNoteInput(input);
    if (!validation.valid) return Object.freeze({ note: undefined, validation, activity: undefined, activityInput: undefined });

    const normalized = normalizeCreateNoteInput(input);
    const timestamp = this.now();
    const note = freezeNote({
      id: this.createId(),
      workspaceId: normalized.workspaceId,
      companyId: normalized.companyId,
      contactId: normalized.contactId,
      meetingId: normalized.meetingId,
      taskId: normalized.taskId,
      title: normalized.title,
      content: normalized.content,
      visibility: normalized.visibility,
      authorId: normalized.authorId,
      tags: normalized.tags,
      attachments: normalized.attachments,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    this.notes.set(note.id, note);
    const activityInput = prepareNoteActivityInput(note, "created");
    const activity = this.createActivity?.(activityInput);

    return Object.freeze({ note, validation, activity, activityInput } satisfies NoteActivityPreparation & { validation: typeof validation });
  }

  updateNote(input: UpdateNoteInput) {
    const validation = validateUpdateNoteInput(input);
    if (!validation.valid) return Object.freeze({ note: undefined, validation, activity: undefined, activityInput: undefined });

    const existing = this.getNote(input.id, input.workspaceId, input.permission);
    if (!existing) return Object.freeze({ note: undefined, validation, activity: undefined, activityInput: undefined });

    const normalized = normalizeUpdateNoteInput(input);
    const note = freezeNote({
      ...existing,
      companyId: normalized.companyId ?? existing.companyId,
      contactId: normalized.contactId ?? existing.contactId,
      meetingId: normalized.meetingId ?? existing.meetingId,
      taskId: normalized.taskId ?? existing.taskId,
      title: normalized.title ?? existing.title,
      content: normalized.content ?? existing.content,
      visibility: normalized.visibility ?? existing.visibility,
      authorId: normalized.authorId ?? existing.authorId,
      tags: normalized.tags ?? existing.tags,
      attachments: normalized.attachments ?? existing.attachments,
      archivedAt: normalized.archivedAt ?? existing.archivedAt,
      updatedAt: this.now()
    });

    this.notes.set(note.id, note);
    const activityInput = prepareNoteActivityInput(note, note.archivedAt ? "archived" : "updated");
    const activity = this.createActivity?.(activityInput);

    return Object.freeze({ note, validation, activity, activityInput });
  }

  archiveNote(id: NoteId, workspaceId: WorkspaceId, permission?: UpdateNoteInput["permission"]) {
    return this.updateNote({ id, workspaceId, archivedAt: this.now(), permission });
  }

  searchNotes(search: NoteSearchQuery, sort: NoteSort = DEFAULT_NOTE_SORT): NoteListResult {
    if (search.permission && !search.permission.allowed) {
      return createListResult([], 0, search.workspaceId, search.companyId, search.contactId, search.meetingId, search.taskId);
    }

    const workspaceNotes = [...this.notes.values()].filter((note) => note.workspaceId === search.workspaceId);
    const filtered = workspaceNotes.filter((note) => matchesNoteSearch(note, search));

    return createListResult(sortNotes(filtered, sort), workspaceNotes.length, search.workspaceId, search.companyId, search.contactId, search.meetingId, search.taskId);
  }
}

export function freezeNote(note: Note): Note {
  return Object.freeze({
    ...note,
    tags: Object.freeze([...note.tags]),
    attachments: Object.freeze(note.attachments.map((attachment) => Object.freeze({ ...attachment })))
  });
}

function createListResult(notes: readonly Note[], total: number, workspaceId: WorkspaceId, companyId?: CompanyId, contactId?: ContactId, meetingId?: MeetingId, taskId?: TaskId): NoteListResult {
  return Object.freeze({
    notes: Object.freeze([...notes]),
    total,
    filtered: notes.length,
    workspaceId,
    companyId,
    contactId,
    meetingId,
    taskId
  });
}

export const noteService = new NoteService();
