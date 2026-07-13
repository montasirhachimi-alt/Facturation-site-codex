# SPR-412 — Goods Receipt & Inventory Posting

## Executive Summary

SPR-412 completes the first Procurement-to-Inventory flow:

Purchase Order -> Goods Receipt -> Inventory Posting Engine -> Inventory Balance -> Inventory Movement.

Goods Receipts are persistent, tenant-scoped Procurement documents. A posted receipt creates `RECEIPT` stock movements through the Inventory posting engine and updates Purchase Order receipt progress.

The current Alpha `alpha.crm-sales` remains unchanged. Goods Receipt is available only through controlled internal profiles that activate Procurement and Inventory.

## Scope

Implemented:

- Goods Receipt domain types, local service state and receipt progress helpers.
- Persistent `ProcurementGoodsReceipt` and `ProcurementGoodsReceiptLine` models.
- Transactional server posting through Inventory repository helpers.
- `/procurement/goods-receipts` workspace.
- `Recevoir` action from Purchase Orders.
- Command Center Quick Create action and record search metadata when the module is active.
- Hidden dashboard contribution metadata for future receipt widgets.
- Runtime checks for Purchasing profile activation and receipt progress.

Not implemented:

- Supplier Invoice.
- Accounting journal entries.
- Supplier payments.
- Returns.
- Purchase approval workflow.
- Barcode, serial or lot tracking.
- Manufacturing, POS or AI.

## Data Model

### ProcurementGoodsReceipt

Stores:

- tenant company scope
- workspace id
- receipt number
- supplier relation and display name
- source Purchase Order relation and number
- warehouse relation and display name
- receipt date
- status
- reference
- notes
- posted/archive timestamps
- owner id
- lines

### ProcurementGoodsReceiptLine

Stores:

- Goods Receipt relation
- Purchase Order line relation
- Product relation
- Product SKU/name fallback
- description
- ordered quantity
- previously received quantity
- received quantity
- unit
- line position

## Status Lifecycle

Goods Receipt supports:

- `draft`
- `posted`
- `cancelled`
- `archived`

Only `posted` creates Inventory movements and changes stock balances.

## Posting Rules

Posting is server-confirmed and transactional.

Rules:

- Supplier must belong to the current tenant.
- Purchase Order must belong to the current tenant.
- Warehouse must belong to the current tenant and be active.
- Product must belong to the current tenant and be active.
- Received quantity must be greater than zero.
- Received quantity must not exceed remaining Purchase Order quantity.
- The same Goods Receipt cannot be posted twice.
- Stock balance updates and stock movement creation happen through Inventory repository posting helpers.
- Failure rolls back the entire transaction.

## Inventory Movement

Each posted Goods Receipt line creates one movement:

- type: `RECEIPT`
- referenceType: `GOODS_RECEIPT`
- referenceId: Goods Receipt id
- reference: Goods Receipt number + Purchase Order number + Supplier
- reason: `Réception fournisseur <number>`

The UI does not mutate Inventory balances directly.

## Purchase Order Synchronization

Purchase Order progress is calculated from posted Goods Receipts.

Partial receipt:

- received quantity is lower than ordered quantity
- Purchase Order status becomes `partially_received`

Complete receipt:

- all ordered quantities are received
- Purchase Order status becomes `received`

## UI

Added:

- `/procurement/goods-receipts`
- Goods Receipt table
- Goods Receipt creation/posting dialog
- empty state
- Purchase Order table receipt progress
- `Recevoir` row action

The receipt dialog shows:

- source Purchase Order
- active Warehouse
- receipt date
- reference
- notes
- line-level ordered, already received, remaining and received quantities

## Command Center

When `procurement.goods-receipts` is active:

- Quick Create exposes `Nouvelle réception`.
- Record Search includes Goods Receipts.
- Hidden/inactive Alpha profiles do not expose Goods Receipts.

## Dashboard Contributions

Prepared as hidden metadata:

- `dashboard.procurement.goods-receipts-today`
- `dashboard.procurement.pending-goods-receipts`
- `dashboard.procurement.received-today`

No dashboard widget is rendered in Alpha.

## Activation

The module descriptor is:

- `procurement.goods-receipts`

Dependencies:

- `procurement.purchase-orders`
- `inventory.stock`
- `sales.products`
- `platform.persistence`

The internal Purchasing profile now activates:

- `sales.products`
- `inventory.stock`
- `procurement.overview`
- `procurement.suppliers`
- `procurement.purchase-orders`
- `procurement.goods-receipts`

The current Alpha profile remains unchanged.

## Migration

Created migration:

- `20260713231916_goods_receipt_posting`

The migration adds Goods Receipt tables and relations without rewriting existing Procurement or Inventory migrations.

## Validation

Completed during implementation:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate dev --name goods_receipt_posting`
- `npm run validate:runtime`
- `npm run typecheck`
- `npm run build`

Known warning:

- Existing `src/components/pdf-preview.tsx` Next.js `<img>` warning remains unchanged.

## Known Limitations

- Goods Receipt export is prepared by module metadata but not exposed as a dedicated export button in this sprint.
- Cancelling a posted Goods Receipt does not reverse inventory; returns/corrections are future work.
- Manual authenticated browser QA must be performed with a local user session and the controlled Purchasing/Inventory profile active.
- Supplier Invoice and accounting remain future Procurement work.
