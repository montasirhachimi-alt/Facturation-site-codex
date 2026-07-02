# CRM Notes Foundation

Notes are the business knowledge layer of the CRM.

Notes enrich companies, contacts, meetings and tasks. They are not standalone business objects. Future AI features will use notes as a permission-aware source of CRM context.

## Domain Model

`Note` includes:

- workspace and company scope
- optional contact, meeting and task references
- title and content
- visibility
- author
- tags
- attachment placeholders
- archive metadata

## Service Model

`NoteService` supports:

- `listNotes()`
- `getNote()`
- `getNotesByCompany()`
- `getNotesByContact()`
- `getNotesByMeeting()`
- `getNotesByTask()`
- `createNote()`
- `updateNote()`
- `archiveNote()`
- `searchNotes()`

## Activity Integration

Note creation, update and archive prepare Activity inputs through existing Activity contracts. `ActivityService` remains unchanged.

## Future AI Usage

Notes are structured to support future AI Knowledge, summarization, account intelligence and contextual recommendations while preserving workspace and permission boundaries.
