# SPR-413 — Sales Orders Foundation

## Executive Summary

SPR-413 introduces the Sales Orders foundation as an activation-gated Sales capability.

A Sales Order represents a customer commitment after quote acceptance or manual order entry. It can optionally reserve Inventory availability, but it never physically decreases stock. Physical stock decrement remains reserved for future Delivery Notes.

The current `alpha.crm-sales` Edition remains visually unchanged. Sales Orders are registered, persisted and route-ready, but only active through the controlled internal Sales Operations profile.

## Scope

Implemented:

- `sales.orders` module descriptor and route ownership.
- Sales Operations internal activation profile.
- Persistent `SalesOrder` and `SalesOrderLine` Prisma models.
- Server repository support for create, confirm, reserve and cancel.
- Client persistence bridge and local cache synchronization.
- Sales Orders workspace and detail page.
- Manual Sales Order creation.
- Quote to Sales Order conversion from accepted Quote details.
- PDF preview, download and print for saved Sales Orders.
- Command Center navigation, Quick Create and record search metadata when active.
- Hidden Dashboard contribution metadata for future Sales Order widgets.

Not implemented:

- Delivery Notes.
- Physical stock issue from Sales Orders.
- Sales Order edit workflow.
- Advanced allocation, substitutions, backorders or fulfillment planning.
- Accounting or invoicing automation from Sales Orders.

## Business Boundary

Sales Orders are commercial commitments.

Inventory effects:

- Draft Sales Orders create no reservation.
- Confirming without reservation creates no Inventory movement.
- Confirming with reservation posts Inventory `RESERVATION` movements.
- Cancelling a reserved Sales Order posts Inventory `RELEASE` movements.
- Sales Orders never post Inventory `ISSUE` movements.

This preserves the operational boundary:

```text
Sales Order = commitment / reservation
Delivery Note = future physical stock issue
Invoice = billing
Payment = settlement
```

## Activation

`sales.orders` is registered as a planned module.

It remains inactive in `alpha.crm-sales`.

It is active only in the controlled internal `sales-operations` profile with:

- `crm.companies`
- `crm.contacts`
- `sales.quotes`
- `sales.invoices`
- `sales.payments`
- `sales.products`
- `inventory.stock`
- `sales.orders`

## Routes

Prepared routes:

- `/sales/orders`
- `/sales/orders/[orderId]`

Route availability is governed by Module Activation. Alpha users do not see Sales Orders.

## Persistence

Added Prisma models:

- `SalesOrder`
- `SalesOrderLine`

Relationships:

- tenant `Company`
- CRM Company
- optional CRM Contact
- optional source Quote
- optional Product on each line

Sales Order numbers use the `SO-YYYY-000001` prefix.

## Reservation Flow

Confirmation with reservation:

1. Validate tenant scope.
2. Validate active warehouse.
3. Validate active product for reservable lines.
4. Read Inventory availability.
5. Reserve available quantity without oversubscribing.
6. Persist Inventory `RESERVATION` movements.
7. Update Sales Order line reserved quantities.
8. Update Sales Order reservation status.

Cancellation:

1. Load active reserved lines.
2. Post Inventory `RELEASE` movements.
3. Reset reserved quantities to zero.
4. Mark order cancelled and reservation released.

Partial reservation is allowed only when explicitly requested by the caller.

## Quote Conversion

Accepted Quote details expose a Sales Order action only when `sales.orders` is active.

Conversion preserves:

- source Quote ID and number
- Company ID and name
- Contact ID and name
- currency
- notes
- discount
- line descriptions, quantities, prices and VAT

Duplicate conversion is blocked by source Quote relation.

SPR-413A extends Quote lines with optional Product identity, so Product-backed Quote lines can now become reservable Sales Order lines. Free-form Quote lines remain valid and non-reservable.

## Product Integration

Manual Sales Order lines use the canonical Product Catalog.

Product selection populates:

- product ID
- SKU
- name
- unit
- selling price
- VAT rate

Inactive Products are not listed for new Sales Order lines.

## PDF

Sales Order PDF export uses the existing Sales document renderer.

The PDF displays:

- document title `BON DE COMMANDE`
- Sales Order number
- Company recipient
- optional contact attention line
- source/internal reference
- line items
- totals
- notes

The PDF matches the persisted Sales Order data.

## Command Center

When `sales.orders` is active:

- Navigation includes Sales Orders.
- Quick Create includes `Nouvelle commande client`.
- Record Search includes saved Sales Orders.

When inactive, Sales Orders do not appear in Command Center.

## Dashboard Contributions

Hidden Sales Order dashboard contribution metadata was registered for future widgets:

- orders to confirm
- reserved orders
- shortage risk
- recent orders

No visible dashboard redesign was made.

## Validation

Completed:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate dev --name sales_orders_foundation`
- `npx prisma migrate status`
- `npm run validate:runtime`
- `npm run typecheck`

Pending in final validation phase:

- `npm run build`
- `git diff --check`
- clean `.next` runtime check

## Known Warnings

The existing Next.js warning in `src/components/pdf-preview.tsx` about `<img>` remains unchanged.

## Known Limitations

- Sales Orders are inactive in Alpha by design.
- Sales Order edit is not implemented.
- Delivery Notes and physical fulfillment are future work.
- Free-form Quote-converted lines remain non-reservable by design.
- Authenticated browser QA depends on an active local session.
