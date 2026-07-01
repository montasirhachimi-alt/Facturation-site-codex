# CRM Companies Foundation

## Purpose

The Companies foundation defines the central CRM business entity. Future Contacts, Opportunities, Quotes, Orders and Invoices should reference Companies instead of duplicating organization data.

The domain foundation adds no APIs, Prisma access or database persistence. The visible workspace is isolated under `src/modules/crm/companies/ui/`.

## Domain Model

The `Company` model includes:

- identity fields
- registration and tax numbers
- industry
- contact details
- address fields
- status
- tags and notes
- owner
- workspace and audit metadata

## Service Model

`CompanyService` is an in-memory, workspace-aware and permission-aware service. It supports:

- `listCompanies()`
- `getCompany()`
- `createCompany()`
- `updateCompany()`
- `archiveCompany()`
- `searchCompanies()`

## Shared Foundation Usage

The Companies domain consumes CRM Shared Foundation for:

- filtering
- search
- sorting
- tag normalization

It does not recreate shared CRM infrastructure.

## Workspace Awareness

All operations require `workspaceId`. Listing, search and lookup never return companies from another workspace.

## Permission Awareness

Operations accept optional platform permission decisions. The domain does not implement a new permission engine.

## Future Relationships

Future CRM modules should reference `CompanyId`:

- Contacts
- Opportunities
- Quotes
- Orders
- Invoices
- Activities
- Notes

## Future Persistence

The in-memory store is isolated behind `CompanyService`. A future Prisma migration should preserve the public service shape where possible.

## Professional Workspace

The visible Companies workspace lives in `src/modules/crm/companies/ui/`.

It consumes:

- `CompanyService`
- CRM Shared Foundation
- HicoPilot Enterprise UI Framework
- Permission Runtime through configured CRM company permissions

It does not add Prisma, APIs or backend persistence.
