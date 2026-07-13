# SPR-406 — Product Catalog Foundation

## Executive Summary

SPR-406 opens the Business Platform phase by creating the canonical Product Catalog foundation.

BOSIACO now has one Product model, one Product service, one Product repository and one Product Catalog workspace prepared for future activation.

The current Alpha experience remains unchanged: the Product module is registered as planned and hidden, so it does not appear in the Sidebar or Command Center navigation until a future activation sprint enables it.

## Scope

Implemented:

- canonical Product domain model
- Product Category foundation
- canonical product units metadata
- SKU normalization and uniqueness validation
- optional barcode validation and uniqueness validation
- Product service with create, update, archive, restore, search, list, lookup by SKU and lookup by barcode
- tenant-scoped Prisma persistence over the existing `Product` table
- dedicated Product Catalog repository
- client hydration bridge and local cache
- prepared Product workspace route
- Product record search integration gated by module activation
- runtime validation coverage

Not implemented:

- inventory
- warehouses
- stock movements
- purchasing
- supplier invoices
- barcode scanning
- barcode generation
- variants UI
- price lists
- manufacturing
- POS
- accounting
- AI

## Product Architecture

The Product Catalog follows the platform constitution:

```text
Prisma Product / ProductCategory
  ↓
Product Catalog Repository
  ↓
Product Service
  ↓
Product local cache and hydration
  ↓
Prepared Product workspace and search adapters
```

UI components do not call Prisma directly.

The generic Smart Entity Picker and Sales line-item workflows are not rewritten in this sprint.

## Canonical Product Model

The existing Prisma `Product` model is extended instead of replaced.

Canonical fields include:

- `id`
- `sku`
- `barcode`
- `name`
- `description`
- `shortDescription`
- `productCategoryId`
- `brand`
- `unit`
- `purchasePrice`
- `sellingPrice`
- `vatRate`
- `currency`
- `active`
- `imageUrl`
- `notes`
- `status`
- `companyId`
- `createdAt`
- `updatedAt`

Compatibility fields remain:

- `reference`
- `designation`
- `salePrice`
- `stock`
- `minStock`
- legacy `categoryId`

The repository mirrors canonical values into legacy fields where required:

- `sku` → `reference`
- `name` → `designation`
- `sellingPrice` → `salePrice`

This preserves legacy document compatibility while establishing the canonical catalog.

## Category Model

`ProductCategory` is added as the catalog category foundation.

Fields:

- `id`
- `companyId`
- `name`
- `parentId`
- `description`
- `order`
- `active`
- `createdAt`
- `updatedAt`

No tree editor was created.

## Unit Metadata

Canonical units are metadata only:

- `piece`
- `kg`
- `meter`
- `liter`
- `box`
- `pack`

No inventory quantity logic is attached to units in this sprint.

## Service Layer

`ProductService` supports:

- `createProduct`
- `updateProduct`
- `archiveProduct`
- `restoreProduct`
- `listProducts`
- `getProduct`
- `lookupBySku`
- `lookupByBarcode`
- category create/update/list support

The service owns validation and local session behavior. Persistence is handled through the repository/API bridge.

## Persistence

Persistence is tenant-scoped through the existing authenticated company scope.

New server boundary:

- `src/server/persistence/product-catalog-repository.ts`

New API boundary:

- `src/app/api/persistence/product-catalog/route.ts`

New client hydration bridge:

- `src/platform/persistence/product-catalog-persistence.client.ts`
- `src/platform/persistence/product-catalog-persistence-provider.tsx`

Confirmed writes are used for Product create/update/archive/restore from the prepared workspace.

## Workspace

A Product workspace is prepared at:

- `/sales/products`

It includes:

- list view
- search
- status filter
- unit filter
- category filter
- create dialog
- edit dialog
- archive
- restore

The route is owned by the hidden/planned `sales.products` module and remains unavailable in the current Alpha activation profile.

## Search Integration

Product record search is prepared in the Command Center record registry.

Products are indexed only when `sales.products` is active.

Current Alpha behavior remains unchanged because `sales.products` is not active.

## Validation

Validation includes:

- required SKU
- normalized uppercase SKU
- duplicate SKU rejection
- optional barcode format
- duplicate barcode rejection
- required name
- non-negative prices
- valid VAT range
- ISO-style currency code
- archive/restore lifecycle
- tenant ownership in repository writes

## Migration

Created migration:

- `prisma/migrations/20260713120000_product_catalog_foundation/migration.sql`

The migration:

- creates `ProductCategory`
- extends the existing `Product` table
- backfills `sku`, `name` and `sellingPrice` from legacy fields
- adds uniqueness constraints for SKU and barcode per tenant company
- adds ProductCategory relations and indexes

## Known Limitations

- Product Catalog is not active in Alpha navigation.
- Product Catalog does not yet replace Quote/Invoice line item product lookup.
- Product Categories have no dedicated tree management UI.
- Stock fields remain legacy compatibility only; no inventory behavior was implemented.
- Product images are stored as URL metadata only.
- No price history or price list behavior exists.

## Validation Results

Completed during SPR-406:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npm run validate:runtime`
- `npm run typecheck`

Build and final diff validation are tracked in the sprint final report.
