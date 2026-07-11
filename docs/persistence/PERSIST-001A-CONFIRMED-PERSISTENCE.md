# PERSIST-001A — Database Activation & Persistence Verification

Date: 2026-07-11

## Objective

Activate and verify the PERSIST-001 durable CRM/Sales foundation, then make creation flows wait for database confirmation before updating visible local state and closing dialogs.

## Database Connection Result

The project expects PostgreSQL through `DATABASE_URL`.

Observed configuration:

- Prisma datasource: `postgresql`
- Documented local URL: `postgresql://postgres:postgres@localhost:5432/hicotech_erp?schema=public`
- Official project migration command: `npm run prisma:migrate` → `prisma migrate dev`
- No Dockerfile or Docker Compose file exists in the repository.
- No Supabase, Neon or managed database config exists in the repository.

Connectivity result:

- `localhost:5432` is now reachable with the documented local PostgreSQL URL.
- `npx prisma migrate status` can inspect the database.
- `npx prisma validate` passes when the documented `DATABASE_URL` is supplied.

Conclusion: database activation is complete for local development. PERSIST-001B repaired the migration baseline so Prisma can rebuild the full schema from an empty database.

## Migration Result

Migration history now includes:

- `prisma/migrations/20260710220000_baseline/migration.sql`
- `prisma/migrations/20260710230000_persist_crm_sales/migration.sql`

Migration application now completes successfully on the local `hicotech_erp` database.

## Tables To Verify After Database Activation

Once PostgreSQL is running and the migration is applied, verify:

- `CrmCompany`
- `CrmCustomer`
- `CrmContact`
- `SalesQuote`
- `SalesQuoteLine`
- `SalesInvoice`
- `SalesInvoiceLine`
- `SalesPayment`

## Confirmed Write Architecture

PERSIST-001A changes the write order from optimistic local mutation to confirmed persistence:

Validate
↓
Create/update local draft through the existing service
↓
Persist to database
↓
If success: notify subscribers and close dialog
↓
If failure: rollback local cache, keep dialog open, preserve form data and show a French error

This keeps existing service validation and workflows intact while preventing visible ghost records.

## Updated Surfaces

Confirmed persistence now applies to:

- Company create/edit/archive
- Customer create/edit/archive
- Contact create/edit/archive
- Company detail edit
- Contact detail edit
- Quote creation with line items
- Invoice creation with line items
- Quote-to-Invoice conversion
- Invoice payment recording
- Command Center Quick Create Company/Customer/Contact
- Smart Entity Picker inline Company/Customer/Contact creation

## Failure Handling

If persistence fails:

- The dialog or inline creation panel remains open.
- Entered values remain in the form.
- A clear French error is shown where the form has an error surface.
- Local stores are rolled back to the previous snapshot.
- No subscriber notification is emitted for the failed save.
- Retry is possible without recreating the form.

## Hydration

ERP shell hydration still uses `CrmSalesPersistenceProvider`.

When the database is reachable, startup fetches:

- Companies
- Customers
- Contacts
- Quotes
- Invoices
- Payments

and replaces the module-owned local caches with persisted records.

## Verification Status

Confirmed by automated validation:

- Prisma Client generation passes.
- Prisma schema validation passes with the documented `DATABASE_URL`.
- Prisma migration status reports the local database as up to date.
- Prisma migration replay passes against a fresh empty development database.
- Runtime validation passes.
- TypeScript typecheck passes.
- Production build passes.

Confirmed after database activation:

- Migration application.
- Database table existence checks.
- App persistence snapshot after dev-server restart.
- Company, Customer, Contact, Quote, Invoice and Payment persistence through the app API.

## Remaining Limitations

- PostgreSQL must still be started/provisioned externally; the repository does not currently provide a database startup command.
- Full browser click-through QA remains manual, although app-level persistence was verified after restart.
- Opportunities remain seed-backed.
- Some CRM Home summary aggregation remains seed-backed.
