# PERSIST-001 — Durable CRM and Sales Data Foundation

Date: 2026-07-10

## Objective

Move core CRM and Sales records from session-only memory to tenant-scoped durable persistence while preserving the existing dialogs, lists, details, Smart Entity Picker, Command Center and PDF workflows.

## Previous Limitation

ZF-R5 synchronized CRM and Sales during the current browser session, but the authoritative sources remained module-owned in-memory services:

- Companies: `crmCompanyLocalService`
- Customers: `crmCustomerLocalService`
- Contacts: `crmContactLocalService`
- Quotes: `quoteService`
- Invoices: `invoiceService`

After a browser refresh or dev-server restart, those services were recreated from seeds and user-created records disappeared.

## Existing Database Architecture Found

The project already uses Prisma with PostgreSQL.

Existing persistent models include:

- Tenant/company profile: `Company`
- Users: `User`
- Legacy client/commercial documents: `Client`, `Document`, `DocumentLine`, `Payment`
- Products, suppliers, purchases, HR, stock and cash models

Existing tenant isolation is based on `companyId`. The authenticated session exposes `companyId`, and existing tenant helpers already use `TenantScope`.

## Persistent Models Added

PERSIST-001 adds dedicated product-experience CRM/Sales models instead of overloading the existing tenant `Company` or legacy `Document` tables:

- `CrmCompany`
- `CrmCustomer`
- `CrmContact`
- `SalesQuote`
- `SalesQuoteLine`
- `SalesInvoice`
- `SalesInvoiceLine`
- `SalesPayment`

Each model is scoped by `tenantCompanyId`, which references the existing `Company` tenant model.

## Relationships

Durable relationships preserve stable IDs and display fallbacks:

- Customer → Company through `crmCompanyId`
- Contact → Company through `crmCompanyId`
- Quote → Customer, Company, Contact and optional Opportunity
- Invoice → Customer, Company, Contact, optional Opportunity and optional source Quote
- Payment → Invoice, Company and optional Contact

Display labels such as `companyName`, `contactName`, `customerName` and `opportunityName` remain stored where the current UI uses them as safe fallbacks.

## Service and Repository Architecture

The persistence flow follows the existing product architecture:

Database / Prisma
↓
Server persistence repository
↓
Tenant-scoped persistence route
↓
Client persistence bridge
↓
Existing module local services as live caches
↓
Existing dialogs, lists, details, pickers and Command Center

UI components do not call Prisma directly. Generic Smart Entity Picker stays client-safe and does not import database code.

## Local Store Transition

The existing local services are no longer the intended durable authority. They now expose cache methods:

- `replaceCompanies`, `upsertCompany`
- `replaceCustomers`, `upsertCustomer`
- `replaceContacts`, `upsertContact`
- `replaceQuotes`, `upsertQuote`
- `replaceInvoices`, `upsertInvoice`
- `replacePayments`, `upsertPayment`

`CrmSalesPersistenceProvider` hydrates those stores from Prisma when the ERP shell loads.

## Write-Through Coverage

The following flows write through to persistence after successful local validation:

- Company create, edit and archive
- Customer create, edit and archive
- Contact create, edit and archive
- Inline Company, Customer and Contact creation from Smart Entity Picker
- Quick Create Company, Customer and Contact
- Quote creation with line items
- Invoice creation with line items
- Quote-to-Invoice conversion
- Payment recording from Invoice details

## PERSIST-001A Confirmation Update

PERSIST-001A tightened the write flow so dialogs no longer close before confirmed persistence.

Updated order:

Validate
↓
Persist to database
↓
Update local cache and notify subscribers
↓
Close dialog

If the database write fails, the form remains open, entered values remain, local cache changes are rolled back and a French error message is shown where the surface supports errors.

## Smart Picker and Command Center

Smart Entity Picker and Command Center continue reading from the same module-owned live local services. Because those stores hydrate from persistence and are notified after create/edit/archive, persisted records become available to:

- CRM lists and details
- Quote and Invoice pickers
- Command Center Record Search
- Quick Create workflows

## Seed Policy

Business records are not reseeded on page refresh.

Demo seed data may still exist in source files for development and fixtures, but persisted business data is loaded from the database through the new persistence bridge. The bridge does not merge seeds into persisted records repeatedly.

## Workspace and Tenant Safety

Persistence uses the current authenticated session on the server. The client does not send or choose the tenant/company boundary.

Current implementation requires a session with `companyId`. Super-admin sessions without an active company are intentionally rejected for CRM/Sales persistence until a real workspace/company switcher exists.

## Migration

Migration created:

- `prisma/migrations/20260710230000_persist_crm_sales/migration.sql`

Schema validation passed with the documented local PostgreSQL URL.

Applying the migration could not be completed in this environment because the local PostgreSQL service at `localhost:5432` was not reachable by Prisma. PERSIST-001A confirmed that no repository Docker/Compose or managed database configuration exists; PostgreSQL must be started/provisioned externally using the documented `DATABASE_URL`.

## Limitations

- Full refresh/restart persistence verification is still blocked until PostgreSQL is reachable and the migration is applied.
- Opportunities remain seed-backed.
- CRM Home summary widgets may still use seed-backed aggregation.
- Existing authentication is demo-cookie based; PERSIST-001 scopes persistence to the current project convention but does not redesign authentication.

## Validation Notes

Completed:

- Prisma client generation passed.
- Prisma schema validation passed with `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hicotech_erp?schema=public"`.
- `npm run typecheck` passed.

Blocked locally:

- Prisma migration application because local PostgreSQL was not reachable.
- Full browser refresh/dev-server restart persistence verification depends on applying the migration to a reachable local database.
