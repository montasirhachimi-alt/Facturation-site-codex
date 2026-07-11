# ZF-R6 — CRM Contacts Directory & Activities Foundation

Date: 2026-07-11

## Executive Summary

ZF-R6 converts Contacts, Meetings, Tasks and Notes from disconnected/demo CRM surfaces into coherent workspace foundations.

The global Contacts directory now reads the same persisted Contact source as Company contact tabs, Contact details, Smart Entity Picker and Command Center record search.

Meetings, Tasks and Notes now have minimal persisted V1 models, local synchronization stores, shared persistence hydration and functional global/company/contact workspaces.

## Contacts Directory Root Cause

The global `/crm/contacts` page still rendered the old contextual demo workspace from `crm/home/contextual-workspaces.tsx`.

That workspace read static seed arrays, while Company Contacts used `crmContactLocalService` and persisted write-through behavior. A Contact created from a Company therefore appeared in the Company tab but not in the global directory.

## Unified Contact Source

All Contact surfaces now converge on `crmContactLocalService`, hydrated by the CRM/Sales persistence bridge:

- Company Contacts tab
- Global Contacts directory
- Contact details
- Smart Entity Picker
- Command Center record search
- Quote and Invoice relationship fields
- Quick Create Contact

The global directory supports persisted listing, search, company filter, status/filter controls, create, edit, archive and detail navigation.

## Meeting Model

`CrmMeeting` persists:

- workspace and tenant scope
- related `CrmCompany`
- optional primary `CrmContact`
- full contact id list for lightweight participants
- title, description, location
- meeting type, status
- start/end date-time
- organizer, participants, notes, tags
- timestamps

V1 intentionally excludes reminders, recurring meetings, calendar sync and video integrations.

## Task Model

`CrmTask` persists:

- workspace and tenant scope
- required `CrmCompany`
- optional `CrmContact`
- optional meeting reference string
- title, description
- task type, priority, status
- assigned user id
- due date and completed date
- tags and timestamps

V1 intentionally excludes subtasks, dependencies, kanban and automation.

## Note Model

`CrmNote` persists:

- workspace and tenant scope
- required `CrmCompany`
- optional `CrmContact`
- optional meeting/task references
- title and content
- visibility
- author id
- tags, attachments and archive timestamp
- timestamps

V1 intentionally excludes rich text, attachments workflows, version history and collaboration.

## Company Integration

Company details now expose functional tabs for:

- Contacts
- Meetings
- Tasks
- Notes
- Opportunities
- Quotes
- Invoices
- Payments

The old demo timeline/notes/tasks overview widgets were removed from the Company overview to avoid unfinished-product signals.

## Contact Integration

Contact details now reuse the functional Meetings, Tasks and Notes workspaces in embedded mode, with the current Company and Contact preselected.

## Global Sidebar Integration

Global pages now use real workspaces:

- `/crm/contacts`
- `/crm/meetings`
- `/crm/tasks`
- `/crm/notes`

The Timeline/Activities navigation entry is hidden because no durable CRM event source exists yet.

## Timeline Decision

Timeline remains a future capability.

ZF-R6 does not create a large event-sourcing system. The existing `/crm/activities` route redirects to Companies for compatibility, and the sidebar no longer exposes Timeline as a visible workspace.

## Persistence and Tenant Isolation

Meetings, Tasks and Notes follow the same tenant-scoped repository pattern as Companies, Contacts, Quotes and Invoices:

Database / Prisma → server persistence repository → API hydration/write-through → local module-owned services → UI subscribers.

UI components do not call Prisma directly.

## Command Center

Command Center record search now indexes real persisted Meetings and Tasks. Notes are intentionally not indexed globally in V1 to avoid noisy or sensitive search results.

Quick Create exposes stable New Meeting, New Task and New Note entries. In V1 these commands open the corresponding real workspace so users can create records without exposing a duplicate modal flow.

## Known Limitations

- Timeline is intentionally hidden until a real persisted event source exists.
- Opportunities remain seed-backed.
- Notes are not globally searchable in Command Center V1.
- Quick Create Meeting/Task/Note opens the real workspace instead of a nested modal until the new activity dialogs are extracted as shared hosts.
