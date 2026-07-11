# PERSIST-001B — Migration Baseline Repair

Date: 2026-07-11

## Objective

Repair the Prisma migration history so a fresh PostgreSQL database can rebuild the complete BOSIACO schema from zero before applying the CRM/Sales persistence migration.

## Root Cause

The repository contained the PERSIST-001 CRM/Sales migration:

- `prisma/migrations/20260710230000_persist_crm_sales/migration.sql`

but did not contain the earlier baseline migration that creates the legacy schema.

The CRM/Sales migration adds foreign keys from persisted CRM/Sales tables to legacy tables, including `Company`. When Prisma replayed migrations against the shadow database, `Company` did not exist yet, so Prisma failed with:

- `P3006`
- `P1014: The underlying table for model Company does not exist`

## Existing Migrations Found

Before this repair, the migrations directory only contained:

- `20260710230000_persist_crm_sales`

No older migration files were present in the repository.

## Baseline Recovery

The pre-PERSIST Prisma schema was recovered from Git history using the previous committed version of `prisma/schema.prisma`.

That schema represented the legacy application data model before the CRM/Sales durable persistence models were added. It includes:

- `Company`
- `User`
- `Client`
- `Document`
- `Product`
- HR models
- Stock models
- Cash models
- legacy enums and indexes

## Baseline Strategy

The chosen strategy keeps CRM/Sales persistence as an incremental migration and adds a preceding baseline:

```text
prisma/migrations/
  20260710220000_baseline/
    migration.sql

  20260710230000_persist_crm_sales/
    migration.sql
```

The baseline was generated from an empty database to the recovered pre-PERSIST schema, not from the current full schema. This avoids creating CRM/Sales persistence tables twice and preserves the intent of the PERSIST migration as a separate incremental change.

## Why This Is Safe

- The local database `hicotech_erp` was newly created for development.
- No production or non-development database was reset.
- No migration was manually marked as applied.
- No foreign key, tenant or workspace scoping was weakened.
- `db push` was not used as the final solution.
- The existing CRM/Sales persistence migration was preserved.
- The full migration history now replays cleanly from an empty database.

## Migration Order

1. `20260710220000_baseline`
2. `20260710230000_persist_crm_sales`

## Commands Run

Prisma/database:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npx prisma migrate dev`

Fresh replay database:

- Created `hicotech_erp_replay_001b`
- Ran `npx prisma migrate dev` against the empty replay database
- Verified tables and `_prisma_migrations`

Application persistence verification:

- Started the local app with `npm run dev`
- Created a Company, Customer, Contact, Quote, Invoice and Payment through the persistence API using a valid demo session cookie
- Restarted the dev server
- Confirmed the same records and relationships were still returned by the app persistence snapshot

## Shadow Database Result

`npx prisma migrate dev` now applies successfully. The previous shadow database failure no longer occurs because `Company` and all legacy tables are created by the baseline before the CRM/Sales migration runs.

## Main Development Database Result

The local development database applied:

- `20260710220000_baseline`
- `20260710230000_persist_crm_sales`

`npx prisma migrate status` reports the database schema as up to date.

## Fresh Database Replay Result

A fresh empty PostgreSQL database named `hicotech_erp_replay_001b` successfully replayed the complete migration history from zero.

Verified migration order:

- `20260710220000_baseline`
- `20260710230000_persist_crm_sales`

Verified expected tables include:

- `Company`
- `User`
- `Client`
- `Document`
- `Product`
- `CrmCompany`
- `CrmCustomer`
- `CrmContact`
- `SalesQuote`
- `SalesQuoteLine`
- `SalesInvoice`
- `SalesInvoiceLine`
- `SalesPayment`
- `_prisma_migrations`

## Persistence Refresh/Restart Result

After migration repair, app-level persistence was verified with:

- Company: persisted
- Customer linked to Company: persisted
- Contact linked to Company: persisted
- Quote linked to Customer, Company and Contact: persisted
- Invoice linked to Quote and Company: persisted
- Payment linked to Invoice: persisted

The records remained available after a dev-server restart through the app persistence snapshot.

## Remaining Limitations

- Verification was performed against the local development PostgreSQL database.
- The replay database was intentionally left as a verification database and can be removed manually if no longer needed.
- Full browser UI walkthrough remains a manual QA activity, but the same app persistence endpoint used by the UI confirmed refresh/restart durability.
- Opportunities remain outside the PERSIST-001 durable scope.
- Platform engines such as favorites, recent items and preferences still have their existing storage model.
