import type { NoteSort, NoteVisibility } from "./note.types";

export const NOTE_VISIBILITIES = Object.freeze(["private", "team", "company"] satisfies NoteVisibility[]);

export const DEFAULT_NOTE_VISIBILITY: NoteVisibility = "team";
export const DEFAULT_NOTE_SORT: NoteSort = Object.freeze({ field: "updatedAt", direction: "desc" });

export const CRM_NOTE_READ_PERMISSION = Object.freeze({ module: "crm.note", action: "read" as const });
export const CRM_NOTE_WRITE_PERMISSION = Object.freeze({ module: "crm.note", action: "write" as const });
