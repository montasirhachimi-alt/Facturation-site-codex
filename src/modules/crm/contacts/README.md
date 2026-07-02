# CRM Contacts Foundation

## Purpose

Contacts represent people connected to a Company. They are not standalone CRM records.

Every Contact belongs to exactly one Company through `companyId`.

## Domain Model

The `Contact` model includes:

- workspace scope
- company relationship
- identity fields
- role and department
- email and phone details
- preferred language and timezone
- primary contact and decision-maker flags
- LinkedIn profile
- tags and notes
- owner and audit metadata

## Service Model

`ContactService` is an in-memory, workspace-aware, company-aware and permission-aware service. It supports:

- `listContacts()`
- `getContact()`
- `getContactsByCompany()`
- `createContact()`
- `updateContact()`
- `archiveContact()`
- `searchContacts()`

## Relationship With Companies

Contacts consume `CompanyId`, `WorkspaceId` and `UserId` from the Company domain so future CRM modules can attach naturally to the Company Workspace.

Future relationships are prepared for:

- Activities
- Emails
- Meetings
- Tasks
- Sales Opportunities
- Projects
- Invoices

## Shared Foundation Usage

Contacts reuse CRM Shared Foundation for:

- search
- filtering
- sorting
- tag normalization

The domain does not recreate shared CRM infrastructure.

## Permission Awareness

Contact operations accept optional platform permission decisions and use `crm.contact.read` / `crm.contact.write` conventions.

No permission engine is duplicated here.

## Future Persistence

The in-memory store is isolated behind `ContactService`. A future Prisma migration should preserve the public service shape where possible.

## UI

This sprint intentionally adds no React components, no pages and no visible UI.
