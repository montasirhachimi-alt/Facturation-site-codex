# SPR-411 — Procurement Foundation

## Executive Summary

SPR-411 introduces the first Procurement foundation for BOSIACO:

- canonical Suppliers
- Purchase Orders
- Purchase Order Lines
- tenant-scoped Prisma persistence
- Procurement API and client hydration bridge
- controlled Procurement routes
- Command Center metadata
- Dashboard contribution metadata
- Supplier import/export definitions using the shared Import/Export framework

Procurement remains inactive in `alpha.crm-sales`.

## Supplier Architecture

Suppliers are dedicated Procurement entities.

They do not reuse CRM Company.

Supported fields:

- company name
- trade name
- ICE
- IF
- RC
- VAT
- phone
- email
- address
- country
- currency
- payment terms
- notes
- status
- active/archive state

## Purchase Order Architecture

Purchase Orders are Procurement commercial documents.

They support:

- supplier
- document number
- issue date
- expected date
- currency
- reference
- notes
- status
- lines
- discount
- totals

Purchase Order lines support:

- product reference
- SKU/product name snapshot
- description
- quantity
- unit
- purchase price
- discount
- tax

## Commercial Document Integration

Purchase Orders reuse the Commercial Documents Foundation for:

- numbering
- line calculation
- document totals
- discount
- tax
- validation
- status metadata
- lifecycle metadata

The Purchase Order prefix is:

```text
PO
```

Example:

```text
PO-2026-000001
```

## Import / Export Integration

Suppliers define:

- importer metadata
- exporter metadata
- template rows
- column mapping
- row validation
- duplicate policy support

This uses `src/platform/import-export/`.

Purchase Orders support export metadata through the document/domain model, while Purchase Order import is deferred.

## Persistence

Added tenant-scoped Prisma models:

- `ProcurementSupplier`
- `ProcurementPurchaseOrder`
- `ProcurementPurchaseOrderLine`

Write path:

```text
Procurement UI / Quick Create
  ↓
Procurement client persistence bridge
  ↓
/api/persistence/procurement
  ↓
Procurement repository
  ↓
Prisma
```

UI does not call Prisma directly.

## UI

Prepared controlled workspaces:

- `/procurement`
- `/procurement/suppliers`
- `/procurement/purchase-orders`

The pages use existing BOSIACO product styling and remain activation-gated.

## Activation

New module descriptors:

- `procurement.overview`
- `procurement.suppliers`
- `procurement.purchase-orders`

The Purchasing profile activates Procurement plus the Product Catalog dependency.

Alpha does not activate Procurement.

## Dashboard

Prepared contribution metadata:

- Active Suppliers
- Pending Purchase Orders
- Recent Purchases

These contributions remain hidden until Procurement is active.

## Command Center

When Procurement is active:

- New Supplier
- New Purchase Order
- Supplier record search
- Purchase Order record search

In Alpha these actions and records remain hidden.

## Validation

Completed:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate dev`
- `npm run validate:runtime`
- `npm run typecheck`
- `npm run build`

Runtime validation covers:

- Procurement inactive in Alpha
- Procurement active through the Purchasing profile
- route availability
- Product Catalog dependency activation
- Supplier creation
- Purchase Order creation
- PO numbering
- Commercial Documents totals
- Supplier import/export framework integration

## Known Limitations

- No Goods Receipt.
- No Supplier Invoice.
- No Accounting.
- No Payments.
- No Inventory posting.
- No automatic stock increase.
- No purchase approval workflow.
- No purchase requests.
- No RFQ workflow.
- Purchase Order import is deferred.
- Authenticated manual QA was not performed in this session.

## Confirmation

SPR-411 does not implement Goods Receipt, Supplier Invoice, Accounting, Payments, Inventory posting, Manufacturing, POS or AI.

Current Alpha behavior remains unchanged.
