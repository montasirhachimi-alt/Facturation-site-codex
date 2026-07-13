# SPR-407 — Inventory Domain Foundation

## Executive Summary

SPR-407 creates the Inventory Domain Foundation that will power future inventory workflows.

The sprint does not create any inventory page, sidebar entry, dashboard widget, purchasing workflow, delivery workflow or Sales integration.

Inventory now describes where products are, how much exists and how much is available. Product remains the canonical source for what the company sells.

## Domain Architecture

```text
Product Catalog
  ↓
Inventory Domain Types
  ↓
InventoryService / Posting Engine
  ↓
Inventory Repository
  ↓
Prisma Inventory Tables
```

The Product Catalog is referenced by ID. Inventory never duplicates Product data.

## Warehouse Model

`Warehouse` supports:

- `id`
- `code`
- `name`
- `description`
- `companyId`
- `active`
- `isDefault`
- `createdAt`
- `updatedAt`

Validation:

- warehouse code is normalized to uppercase
- warehouse code is unique per company
- only one active default warehouse is allowed per company

## Balance Model

`InventoryBalance` supports:

- `productId`
- `warehouseId`
- `quantityOnHand`
- `quantityReserved`
- `quantityAvailable`
- `lastMovementDate`
- `companyId`

Rule:

```text
quantityAvailable = quantityOnHand - quantityReserved
```

## Movement Model

`StockMovement` supports:

- `RECEIPT`
- `ISSUE`
- `TRANSFER`
- `ADJUSTMENT_IN`
- `ADJUSTMENT_OUT`
- `RESERVATION`
- `RELEASE`

Movement statuses:

- `DRAFT`
- `POSTED`
- `CANCELLED`

SPR-407 posts movements directly through the posting engine. Draft lifecycle UI is intentionally not implemented.

## Posting Engine

`InventoryService` supports:

- `createWarehouse`
- `archiveWarehouse`
- `getBalance`
- `getAvailability`
- `postMovement`
- `postReceipt`
- `postIssue`
- `postTransfer`
- `postAdjustment`
- `reserve`
- `release`

Rules:

- movement quantity must be positive
- products must exist when a product resolver is provided
- inactive warehouses cannot be used
- posted movements cannot be posted twice
- insufficient available stock blocks issues, transfers and reservations
- insufficient reserved stock blocks release
- failed service postings restore the previous snapshot

## Persistence

Created server repository:

- `src/server/persistence/inventory-repository.ts`

Created API boundary:

- `src/app/api/persistence/inventory/route.ts`

Created client hydration bridge:

- `src/platform/persistence/inventory-persistence.client.ts`
- `src/platform/persistence/inventory-persistence-provider.tsx`

## Transactions

Repository posting uses `prisma.$transaction`.

Movement creation and balance update are committed together.

If product validation, warehouse validation, idempotency checks or balance updates fail, the transaction rolls back.

## Prisma Models

Added:

- `InventoryWarehouse`
- `InventoryBalance`
- `InventoryStockMovement`

Added enums:

- `InventoryMovementType`
- `InventoryMovementStatus`

The models are tenant-scoped through `companyId`.

`InventoryBalance` and `InventoryStockMovement` reference the canonical `Product` table.

Product fields were not changed for business behavior. Prisma relation metadata is present only so the Product relation is valid.

## Platform Activation

`inventory.stock` remains:

- `planned`
- `hidden`
- `defaultEnabled: false`
- inactive in the current Alpha profile

No inventory surface appears in Alpha.

## Validation Results

Completed:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npm run validate:runtime`
- `npm run typecheck`
- `npm run build`

Migration note:

- migration SQL was created at `prisma/migrations/20260713130000_inventory_domain_foundation/migration.sql`
- local `npx prisma migrate dev` and `npx prisma migrate status` returned a Prisma `Schema engine error`; a direct Prisma DB execute check confirmed `P1001`, PostgreSQL was not reachable at `localhost:5432`
- the schema validates and Prisma can generate the client successfully
- `migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` produced valid SQL including Inventory tables

## Known Limitations

- no Inventory UI
- no Warehouse UI
- no stock table
- no Dashboard widget
- no Sidebar entry
- no Command Center entry
- no Purchasing
- no Supplier receipt workflow
- no Delivery note integration
- no Sales integration
- no Reservation UI
- no barcode scanner
- no POS
- no manufacturing
- no accounting valuation
