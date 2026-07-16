# SPR-414 — Delivery Notes & Physical Stock Issue

## Executive Summary

SPR-414 introduces persistent Delivery Notes as the only Sales document that performs the physical stock issue for a customer delivery. Sales Orders continue to represent customer commitment and reservation; Invoices remain financial documents.

The workflow is activation-gated behind `sales.delivery-notes` in the controlled `sales-operations` profile. It is not active in `alpha.crm-sales`.

## Business Boundary

```text
Sales Order confirmation/reservation
        ↓
Delivery Note draft
        ↓
Post delivery
        ↓
Inventory ISSUE + reservation consumption
        ↓
Delivered quantities and Sales Order status update
```

- Creating or editing a draft never changes Inventory or the Sales Order.
- Posting is the single physical stock boundary.
- Invoices do not post stock in this Sprint.
- Posted Delivery Notes are immutable. Reversal and customer returns remain future work.

## Module and Activation

- Module ID: `sales.delivery-notes`
- Label: `Bons de livraison`
- Routes: `/sales/delivery-notes` and `/sales/delivery-notes/[deliveryNoteId]`
- Required dependencies: Sales Orders, Product Catalog, Inventory, CRM Companies and persistence.
- `sales-operations`: active for controlled internal QA.
- `alpha.crm-sales`: inactive; Alpha remains the sole default profile after implementation.

No UI checks an Edition ID directly. Navigation, routes, Command Center and Dashboard metadata use module activation.

## Domain Model

`DeliveryNote` preserves tenant and workspace scope, number, Company and optional Contact snapshots, source Sales Order, Warehouse snapshot, delivery date, lifecycle status, notes, customer reference, posting metadata and timestamps.

`DeliveryNoteLine` preserves the source Sales Order line, canonical Product ID, Product snapshots, description, unit, quantity to deliver, quantity posted and position.

The Product Catalog remains authoritative. Product identity is never reconstructed from a description, name or SKU.

### V1 line policy

Only active Products with `trackInventory = true` are deliverable. Free-form commercial lines and service Products remain on the Sales Order but are excluded from the Delivery Note V1. An invalid Product reference is rejected rather than treated as a free-form line.

## Numbering and Lifecycle

Delivery Notes reuse Commercial Documents numbering with the `BL` prefix, for example `BL-2026-000001`.

The lifecycle is:

```text
draft → posted → archived
```

- `draft`: editable, no stock or Sales Order change.
- `posted`: immutable, physical issue completed.
- `archived`: historical record hidden by the appropriate filter.

## Remaining Quantity and Partial Delivery

The canonical calculation is:

```text
remainingToDeliver = quantityOrdered - quantityDelivered
```

A Delivery Note line cannot exceed the current remainder. Posting a partial delivery increments `quantityDelivered` and moves the Sales Order to `partially_delivered`. Posting the final remainder moves it to `delivered`. No separate backorder document is created.

## Reservation and Availability Policy

Existing reservation is consumed first. Delivery without a complete reservation is permitted only when the Warehouse has enough physical and unreserved availability for the unreserved remainder.

Example for a delivery of 8 with 5 reserved:

- consume 5 from the Sales Order reservation;
- require at least 3 additional units available in the same Warehouse;
- post one physical `ISSUE` for 8;
- reject the transaction if this cannot be satisfied without negative stock or over-delivery.

Reservation consumption occurs inside the Delivery transaction and does not create a separate `RELEASE` movement. This keeps the movement history semantically correct: the Delivery Note produces the single physical `ISSUE`, while the reserved balance is consumed atomically.

## Transaction and Inventory Posting

Posting uses a serializable Prisma transaction and validates:

- tenant and source Sales Order ownership;
- draft and not previously posted state;
- active tenant Warehouse;
- active, stock-tracked Product identity;
- positive quantities within the live Sales Order remainder;
- sufficient on-hand and available quantities;
- valid consumable reservations;
- absence of prior line posting.

Each posted line creates one Inventory movement:

- `type = ISSUE`
- `referenceType = DELIVERY_NOTE`
- `referenceId = DeliveryNote.id`

The same transaction consumes reservations, updates Inventory balances, increments Sales Order delivered quantities, recalculates reservation status, updates the Sales Order status and marks the Delivery Note posted. Any failure rolls back every change.

Stable movement identifiers plus the persisted lifecycle guard prevent double posting. A retry of an already posted Delivery Note is rejected with a French business error.

## Sales Order Integration

Eligible Sales Order details expose contextual actions only when the module is active:

- `Créer un bon de livraison` when no delivery exists and quantities remain;
- `Livrer le reliquat` after a partial delivery;
- `Ouvrir les bons de livraison` after full delivery.

Creating the draft preserves Company, Contact, Sales Order, Product, unit, customer reference and relevant notes without changing the source order. Simple cancellation is blocked server-side as soon as any `quantityDelivered` is greater than zero.

## Persistence Architecture

The Prisma models are `SalesDeliveryNote` and `SalesDeliveryNoteLine`. The `Sales` prefix avoids collision with the pre-existing legacy `DeliveryNote` model while the module domain keeps the business name `DeliveryNote`.

The persistence direction is:

```text
Workspace/dialog
        ↓
Module service and local cache
        ↓
Client persistence bridge
        ↓
Tenant-scoped API
        ↓
Delivery Note repository
        ↓
Prisma transaction + Inventory repository
```

The UI never calls Prisma or mutates `InventoryBalance` directly. Prisma Decimal values are normalized at the repository boundary.

Migration: `20260715171406_delivery_notes_physical_issue`.

## Workspace and Dialogs

The workspace provides compact metrics, search, status filtering, a Delivery Note table, controlled draft creation and links to the source order and Company.

The XL creation/edit dialog supports eligible order selection, active Warehouse selection, per-line remainder and available stock, controlled Inventory quantities and notes. Saving creates a draft only.

The detail page displays source context, Warehouse, lines, quantities, notes and posting metadata. Drafts may be edited and posted after explicit confirmation. Posted documents are read-only and may be archived.

## PDF and Print

Delivery Note rendering reuses the Sales PDF architecture. The document includes Company, Contact, source Sales Order, Warehouse, Product/SKU, delivered quantity, unit, notes and a simple reception/signature area.

The V1 Delivery Note is non-financial: prices, VAT and financial totals are intentionally omitted.

## Command Center and Dashboard

When `sales.delivery-notes` is active, the Command Center can expose:

- navigation to `Bons de livraison`;
- Quick Create `Nouveau bon de livraison`;
- record search by BL number, Sales Order number and Company.

All three disappear when the module is inactive.

Dashboard contributions are registered as inactive metadata for deliveries to prepare, partial deliveries, deliveries today and orders remaining to deliver. No fake trend or Alpha-visible widget was added.

## Validation

Runtime validation covers draft invariants, Product and Sales Order identity, partial/full posting, reservation consumption, Inventory `ISSUE`, over-delivery, duplicate posting, Warehouse/Product guards, cancellation protection, tenant isolation, activation and non-financial PDF behavior.

The final command results and clean-runtime observations are recorded in the Sprint report and project status.

## Known Limitations

- Authenticated end-to-end browser QA requires a valid local demo credential/session.
- No reversal or Customer Return workflow exists for posted Delivery Notes.
- Free-form and service lines are excluded from Delivery Notes V1.
- One active Warehouse is used per Delivery Note.
- No invoice automation, carrier, packing, barcode, lot, serial number, proof of delivery, accounting, Manufacturing, POS, AI or Kanban behavior is included.

## Future Work

Future work may add Customer Returns and controlled reversal, multi-Warehouse fulfillment, picking/packing and proof of delivery. Those capabilities must preserve the posting boundary and must not mutate posted Delivery Notes.
