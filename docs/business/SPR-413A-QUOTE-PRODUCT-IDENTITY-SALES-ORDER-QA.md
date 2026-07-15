# SPR-413A — Quote Product Identity & Sales Order QA

## Executive Summary

SPR-413A closes the Product identity gap between Product Catalog, Quote lines, Invoice lines and Sales Order lines.

Commercial document lines now explicitly support two valid modes:

- Product-backed line
- free-form line

Product-backed lines preserve canonical Product identity through Quote persistence, Invoice creation and Quote-to-Sales-Order conversion. Free-form lines remain valid commercial/service lines and never participate in Inventory reservation.

Sales Orders also gained the minimum Draft edit workflow and clearer reservation eligibility/availability display needed for controlled Sales Operations QA before Delivery Notes are built.

## Root Cause

Before SPR-413A, the shared Sales line editor populated commercial text, quantity, price and VAT from Product selection, but it did not store the canonical `productId`.

Consequences:

- Quote lines looked correct but lost Product identity.
- Quote to Sales Order conversion preserved visual line content but could not reserve stock.
- Future Delivery Notes would not have a safe Product reference for physical stock issue.

## Product-Backed vs Free-Form Lines

Product-backed line:

- has `productId`
- stores `productSku` and `productName` snapshots for historical display
- may participate in Inventory reservation when Product is active and inventory-tracked

Free-form line:

- has no `productId`
- remains valid for services/manual commercial text
- is marked as reservation not applicable
- must never be treated as Inventory stock

## Quote Line Product Identity

`QuoteItem` now supports:

- `productId`
- `productSku`
- `productName`
- `unit`

The shared line editor writes these fields only when a Product is selected. Clearing Product selection removes the hidden Product identity.

## Invoice Compatibility

Invoices continue to reuse Quote line items.

Quote to Invoice now preserves Product identity automatically because Product identity is part of the shared Sales line model.

No Inventory behavior was added to Invoices.

## Persistence

Added optional Product identity fields to:

- `SalesQuoteLine`
- `SalesInvoiceLine`

Fields:

- `productId`
- `productSku`
- `productName`
- `unit`

`productId` is an optional relation to canonical `Product` with `onDelete: SetNull`. Snapshot fields preserve historical display when a Product is archived or deleted.

Migration:

- `20260714171135_quote_product_identity`

## Product Picker Behavior

The shared Sales line editor now reads active Products from the canonical Product Catalog local cache and hydration bridge.

Rules:

- selection is by stable Product ID
- inactive/archived Products are excluded from new selection
- Product selection populates SKU, name, unit, price and VAT snapshots
- clearing selection removes `productId`, `productSku` and `productName`
- no Product is inferred from description, SKU text or display label

## Quote to Sales Order Conversion

Conversion now transfers:

- `productId`
- `productSku`
- `productName`
- description
- quantity
- unit
- unit price
- VAT

Free-form lines remain free-form after conversion.

Duplicate conversion remains blocked by the existing source Quote rule.

## Reservation Eligibility

A Sales Order line is reservation-applicable only when:

- `productId` exists
- Product belongs to the tenant
- Product is active
- Product is inventory-tracked
- ordered quantity is greater than zero

Non-applicable lines include:

- free-form lines
- non-inventory Products
- invalid/missing Product references

The Sales Order detail page explains non-applicable lines without exposing raw Product IDs.

## Availability Display

Sales Order details now show Product-backed line availability context:

- on hand
- reserved
- available
- remaining quantity to reserve
- shortage

Free-form/non-inventory lines display that reservation is not applicable.

Availability comes from Inventory balances, not legacy Product stock fields.

## Draft Sales Order Edit

Draft Sales Orders can now be edited from the detail page.

Allowed while Draft:

- Company
- Contact
- dates
- customer/internal reference
- notes
- discount
- Product-backed and free-form lines
- quantity
- unit
- unit price
- VAT

Confirmed, reserved, cancelled and archived orders are not editable through this dialog.

Draft edits reuse the existing Sales Order dialog and persistence path. On persistence failure, the dialog remains open and the local store rolls back.

## Reservation Retry Protection

Reservation now uses:

```text
remainingToReserve = quantityOrdered - quantityReserved
```

This prevents retry/reload flows from reserving the full ordered quantity twice.

Cancellation rejects already-cancelled or archived Sales Orders and releases only active reserved quantities.

## PDF Compatibility

Quote, Invoice and Sales Order PDFs remain visually compatible.

Product IDs are never displayed in PDFs. SKU snapshots may be used as line references where the existing PDF template already supports a reference field.

## Controlled QA Profile

Use the existing `sales-operations` profile for manual QA.

Required active modules:

- Companies
- Contacts
- Product Catalog
- Inventory
- Quotes
- Sales Orders

`alpha.crm-sales` remains unchanged and does not expose Sales Orders, Product Catalog or Inventory.

## Local QA Switch

Current Edition activation is resolved by:

- `src/platform/editions/edition.current.ts`

It calls `bosiacoEditionProfileRegistry.getDefaultEdition()`, which reads the `defaultForEnvironment` flag from:

- `src/platform/editions/edition.profiles.ts`

To activate Sales Operations locally:

1. In `alphaCrmSalesEditionProfile`, set `defaultForEnvironment: false`.
2. In `salesOperationsEditionProfile`, set `defaultForEnvironment: true`.
3. Delete `.next`.
4. Run `npm run dev`.
5. Perform controlled QA.

To restore Alpha:

1. In `alphaCrmSalesEditionProfile`, set `defaultForEnvironment: true`.
2. In `salesOperationsEditionProfile`, set `defaultForEnvironment: false`.
3. Delete `.next`.
4. Run `npm run dev`.

No user-facing Edition selector was added.

## Manual QA Workflow

Target flow:

1. Create Product A.
2. Create Warehouse A.
3. Receive 20 units of Product A.
4. Create Quote with Product A quantity 8 and one free-form service line.
5. Save and refresh.
6. Reopen Quote and verify Product SKU/name remains visible.
7. Convert Quote to Sales Order.
8. Verify Product line remains Product-backed and service line is reservation not applicable.
9. Confirm and reserve.
10. Verify Inventory reserved/available quantities.
11. Retry reservation and confirm no duplicate reservation.
12. Cancel Sales Order and verify release.
13. Convert Product-backed Quote to Invoice and verify no stock movement occurs.

## Validation

Completed:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate dev --name quote_product_identity`
- `npm run validate:runtime`
- `npm run typecheck`

Pending final validation phase:

- `npx prisma migrate status`
- `npm run build`
- `git diff --check`
- clean `.next` runtime check

## Known Warnings

The existing Next.js warning in `src/components/pdf-preview.tsx` about `<img>` remains unchanged.

## Known Limitations

- Delivery Notes are not implemented.
- Physical stock `ISSUE` is not implemented.
- Sales Order edit is intentionally Draft-only.
- Authenticated end-to-end browser QA depends on an active local session.
- No Customer Returns, Credit Notes, Accounting, Manufacturing, POS, AI or Kanban work was added.
