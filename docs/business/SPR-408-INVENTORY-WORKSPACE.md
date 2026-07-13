# SPR-408 — Inventory Workspace

## Executive Summary

SPR-408 creates the first functional Inventory workspace on top of the SPR-407 Inventory Domain Foundation.

Inventory remains inactive in the current `alpha.crm-sales` runtime. The workspace, route metadata, navigation metadata, Command Center metadata and Dashboard contribution metadata are prepared for the controlled Inventory profile, without changing the visible Alpha product.

## Workspace Information Architecture

The Inventory workspace is organized around four operational surfaces:

- `Vue d'ensemble`: inventory KPIs and primary stock operations.
- `Stock`: searchable balance table by product and warehouse.
- `Entrepôts`: warehouse management with stock summaries.
- `Mouvements`: auditable movement history.

The page is intentionally compact and operational. It does not introduce purchasing, delivery, sales-order allocation, barcode scanning, valuation or accounting workflows.

## Activation Behavior

Inventory is still a planned module.

- Current Alpha activation does not include `inventory.stock`.
- `/inventory` is unavailable in Alpha and redirects to the safe fallback.
- The controlled `inventory` Edition profile resolves `sales.products` and `inventory.stock`.
- Sidebar and Command Center can expose Inventory only when an activation result includes `inventory.stock`.

Registration describes the module. Activation determines availability.

## Controlled QA Profile

The existing planned `inventory` Edition profile is used as the controlled QA activation profile. Runtime validation confirms that this profile activates:

- `sales.products`
- `inventory.stock`

It also confirms that Alpha does not expose `/inventory`.

## Product Catalog Relationship

Inventory uses the canonical Product Catalog as its product source.

The stock operation dialog selects products through `SmartEntityPicker` using Product Catalog records. Inventory does not create a second product model and does not duplicate product authority.

## Warehouse Workflows

Warehouses support:

- list
- create
- edit
- archive
- mark as default
- stock summary display

Only one default warehouse is allowed at a time. Setting a new default clears the previous default through the Inventory service/repository path.

Archived warehouses are excluded from posting dialogs and cannot receive new movements.

## Balance View

The Stock table displays:

- Product
- SKU
- Warehouse
- Quantity on hand
- Reserved quantity
- Available quantity
- Reorder point
- Status

Low-stock indicators are based on `InventoryBalance.reorderPoint`. The field defaults to zero, so balances are not flagged as low stock unless a threshold exists.

## Movement History

Movement history displays posted Inventory movements with:

- date
- type
- product
- source/destination warehouse
- quantity
- reference or reason

The workspace does not expose movement editing or cancellation in V1.

## Operation Dialogs

The workspace supports four manual operations:

- Réception manuelle
- Sortie manuelle
- Transfert
- Ajustement

The UI collects product, quantity, warehouse context, reference and reason, then posts through the persistence API and Inventory posting engine. The UI never mutates balances directly.

## Posting Engine Usage

The write path is:

Inventory workspace
→ Inventory persistence client
→ `/api/persistence/inventory`
→ Inventory repository
→ Inventory posting transaction
→ persisted snapshot
→ local Inventory cache hydration

Successful writes return a fresh snapshot so the workspace updates immediately without a browser reload.

## Error And Success Behavior

Save operations:

- show a saving state inside dialogs
- keep the dialog open on failure
- preserve entered values on failure
- show a French error message
- show compact French success feedback after confirmed persistence

No separate notification system was introduced.

## Command Center Integration

Command Center navigation can now receive an explicit activation result.

Under Alpha, Inventory commands remain absent. Under the controlled Inventory profile, `/inventory` appears as an active navigation command.

Record Search also accepts activation and can include Product and Warehouse records only when their modules are active.

## Dashboard Contribution Integration

Inventory contributes prepared Dashboard metadata for:

- Stock faible
- Stock disponible
- Mouvements récents

These contributions are not visible by default because Inventory is still planned and inactive in Alpha. They are metadata preparation only.

## Route Availability

`inventory.stock` owns `/inventory`.

In Alpha:

- `/inventory` is unavailable and redirects to `/dashboard`.
- `/stock` remains a legacy inactive fallback route.

Under a controlled activation result that includes `inventory.stock`, `/inventory` resolves as available.

## Persistence Changes

`InventoryBalance` now has:

- `reorderPoint Decimal @default(0)`

Migration:

- `20260713140000_inventory_workspace_reorder_point`

The field is intentionally balance-owned because low-stock thresholds may vary by product and warehouse.

## Limitations

- No reservation workflow UI.
- No product replenishment rules UI.
- No valuation or accounting.
- No purchasing integration.
- No sales order allocation.
- No barcode scanning.
- No manufacturing.
- No POS.
- No AI.
- Inventory route activation is prepared through metadata and validation; tenant runtime Edition assignment is still future work.
- Local Prisma migration status could not be confirmed in this environment because Prisma returned a schema engine error before listing migration status.

## Next Sprint Expectations

SPR-409 should focus on Reservation & Availability Engine only after Inventory workspace activation and persistence are stable in the target development database.
