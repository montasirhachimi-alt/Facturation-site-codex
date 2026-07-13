# SPR-409 — Reservation & Availability Engine

## Executive Summary

SPR-409 makes Reservation and Availability a canonical Inventory business layer.

The Inventory authority is now explicit:

```text
Quantity On Hand - Reserved Quantity = Available Quantity
```

The UI displays availability; it does not calculate it. Future commercial modules such as Sales Orders, Delivery Notes, POS, Purchasing or Manufacturing must consume the Reservation & Availability engine instead of manipulating balances directly.

## Reservation Engine

Added:

- `ReservationService`
- `reserve()`
- `release()`
- `recalculateAvailability()`
- `canReserve()`
- `canFulfill()`
- `getAvailability()`

`ReservationService` wraps the existing Inventory posting engine. It does not create a second reservation store.

## Availability Engine

Inventory availability is exposed through `InventoryAvailability`:

- `quantityOnHand`
- `quantityReserved`
- `quantityAvailable`
- `quantityIncoming`
- `quantityOutgoing`
- `quantityProjected`

For SPR-409:

- incoming = `0`
- outgoing = `0`
- projected = available

Purchasing, Sales Orders and Delivery Notes are not implemented yet.

## Business Rules

Reservation rules:

- reservation quantity must be greater than zero
- product is required
- warehouse is required
- warehouse must belong to the tenant/company
- inactive warehouses are rejected
- reservation must not exceed available stock
- release must not exceed reserved stock
- failed reservation/release does not mutate availability

Fulfillment validation uses available stock, not on-hand stock.

## Persistence

Reservation state reuses existing `InventoryBalance.quantityReserved`.

Added minimal movement reference fields:

- `InventoryStockMovement.referenceType`
- `InventoryStockMovement.referenceId`

These fields allow future modules to link reservations to commercial documents without making Inventory depend on Sales Orders, Delivery Notes or other modules.

Migration:

- `20260713150000_inventory_reservation_references`

## Workspace Impact

The Inventory workspace now displays:

- on-hand quantity
- reserved quantity
- available quantity
- projected quantity
- recent reservation/release history

No reservation editing UI was added.

## Inventory Integration

Inventory low-stock status continues to use available stock:

```text
quantityAvailable <= reorderPoint
```

This means reserved stock can make an item low even when on-hand stock is still positive.

## Posting Integration

Reservations and releases are posted as normal Inventory movements:

- `RESERVATION`
- `RELEASE`

The write path remains:

```text
Inventory API
  ↓
Inventory repository transaction
  ↓
Balance update
  ↓
Stock movement history
  ↓
Fresh snapshot
```

No separate Reservation API was created. Reservation operations are exposed through the existing Inventory persistence route.

## History Integration

Reservation and Release movements remain visible in the movement history and in the new reservation history surface.

## Validation

Completed:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npx prisma migrate dev`
- `npm run validate:runtime`
- `npm run typecheck`

Runtime validation now covers:

- reserve
- release
- over-reservation
- over-release
- multiple reservations
- availability calculation
- failed mutation preservation
- tenant isolation
- history
- future reference metadata

## Known Limitations

- No reservation creation UI.
- No Sales Order allocation.
- No Delivery Note fulfillment.
- No Purchasing incoming stock.
- No POS.
- No Manufacturing.
- No Accounting valuation.
- No barcode, serial or lot tracking.

## Confirmation

SPR-409 does not implement:

- Purchasing
- Sales Orders
- Delivery Notes
- Accounting
- POS
- Manufacturing
- AI

Current Alpha behavior remains unchanged because Inventory remains inactive unless a controlled Inventory profile activates it.
