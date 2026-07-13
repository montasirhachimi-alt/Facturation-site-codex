# SPR-409A — Reservation QA Workspace

## Executive Summary

SPR-409A adds a minimal Reservation QA workspace inside the controlled Inventory workspace.

The goal is manual verification of the SPR-409 Reservation & Availability Engine before Sales Orders, Delivery Notes, Purchasing or POS integrations exist.

The workspace allows authenticated QA users, under the controlled Inventory profile, to:

- create a manual reservation
- release reserved quantity
- view reservation and release history
- verify on-hand, reserved and available quantities
- validate over-reservation and over-release rejection
- confirm persistence after refresh and restart

## QA Workspace Architecture

The QA surface is a new `Réservations` tab inside `/inventory`.

No new top-level route, Sidebar group or module was introduced.

```text
Inventory Workspace
  ↓
Réservations tab
  ↓
ReservationDialog
  ↓
persistInventoryOperation("reserve" | "release")
  ↓
/api/persistence/inventory
  ↓
postInventoryMovement()
  ↓
Inventory repository transaction
```

## Activation Behavior

The Reservation QA tab belongs to `inventory.stock`.

- unavailable in `alpha.crm-sales`
- available only when the controlled Inventory profile activates `sales.products` and `inventory.stock`
- no Edition ID checks in UI
- no current default Edition change

## Reservation List / History

The list is a filtered view over existing persisted Inventory movements:

- `RESERVATION`
- `RELEASE`

Columns include:

- Date
- Product
- SKU
- Warehouse
- Type
- Quantity
- Reference
- Reason
- Action

The tab does not create a duplicate reservation table or a second history source.

## Current Balance Context

The tab displays:

- En main
- Réservé
- Disponible
- Projeté

The formula remains:

```text
Disponible = En main - Réservé
```

The UI displays values from Inventory balances and does not mutate balances directly.

## Reservation Dialog

Dialog:

- `Nouvelle réservation manuelle`

Fields:

- Product
- Warehouse
- Quantity
- Reference type
- Reference
- Linked reference ID
- Reason

Product selection uses the existing Smart Entity Picker and Product Catalog records.

## Reservation Preview

Before save, the dialog shows:

- current on-hand quantity
- current reserved quantity
- current available quantity
- quantity to reserve
- available after reservation
- reorder point

The preview is informational. Server validation remains authoritative.

## Save Behavior

Successful reservation flow:

```text
Validate
  ↓
Inventory persistence API
  ↓
Reservation movement
  ↓
Fresh Inventory snapshot
  ↓
Close dialog
  ↓
Réservation enregistrée.
```

On failure:

- dialog stays open
- values are preserved
- French error is shown
- no optimistic balance mutation happens

## Release Behavior

Release dialog:

- `Libérer une réservation`

It can be opened from reservation rows.

The dialog displays:

- current reserved quantity
- quantity to release
- reserved after release
- available after release

Over-release is rejected before submit and still remains server-protected.

Success message:

- `Réservation libérée.`

## Consume / Cancel Decision

No consume or cancel actions were added.

SPR-409 exposes stable `reserve()` and `release()` semantics only. Consumption will belong to future Sales Order or Delivery Note fulfillment work, where physical stock issue semantics can be defined safely.

## Movement Integration

Reservation and release actions remain auditable through Inventory stock movements.

The QA tab filters the same source used by movement history; it does not duplicate history.

## Persistence / Hydration

The workspace reuses:

- existing Inventory persistence API
- existing client cache
- existing snapshot hydration
- server-confirmed writes

Balances and movements refresh together after each confirmed write.

## Command Center Integration

No Command Center Quick Create action was added in SPR-409A.

This avoids exposing a QA workflow outside the Inventory workspace before the commercial reservation lifecycle exists.

## Route Availability

No `/inventory/reservations` route was added.

Route availability remains governed by `/inventory` and `inventory.stock`.

## Manual QA Steps

Use the controlled Inventory profile.

1. Create or select a Product.
2. Create or select an active Warehouse.
3. Post a receipt of `20`.
4. Open `Réservations`.
5. Create a reservation of `8`.
6. Confirm:
   - En main = `20`
   - Réservé = `8`
   - Disponible = `12`
7. Attempt a reservation of `15`.
8. Confirm the error and unchanged values.
9. Release `3`.
10. Confirm:
    - En main = `20`
    - Réservé = `5`
    - Disponible = `15`
11. Attempt release of `10`.
12. Confirm rejection and unchanged values.
13. Refresh browser and confirm persistence.
14. Restart dev server and confirm persistence.
15. Restore `alpha.crm-sales` and confirm Product, Inventory and Reservations remain hidden.

## Validation

Completed:

- `npm run validate:runtime`
- `npm run typecheck`

Runtime validation confirms:

- Reservation QA tab exists inside Inventory.
- Dialog uses `reserve` / `release` through existing Inventory persistence operations.
- Inventory API exposes reservation operations without a separate route.
- `/inventory` remains unavailable in Alpha.
- `/inventory` is available under controlled Inventory activation.

## Known Limitations

- QA workspace only; no commercial reservation lifecycle.
- No consume/cancel action.
- No Sales Order allocation.
- No Delivery Note fulfillment.
- No Purchasing incoming stock.
- No Reservation Quick Create in Command Center.
- No separate `/inventory/reservations` route.

## Confirmation

SPR-409A does not implement:

- Sales Orders
- Delivery Notes
- Purchasing
- automatic Quote reservation
- automatic Invoice stock issue
- Manufacturing
- POS
- Barcode
- Serial/lot tracking
- Accounting
- AI
- Kanban

Current `alpha.crm-sales` remains unchanged.
