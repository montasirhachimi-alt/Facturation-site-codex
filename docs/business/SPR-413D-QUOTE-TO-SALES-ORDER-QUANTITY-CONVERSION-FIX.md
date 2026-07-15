# SPR-413D — Quote to Sales Order Quantity Conversion Fix

## Executive Summary

SPR-413D fixes a Quote to Sales Order conversion defect found during authenticated Sales Operations QA.

The source Quote preserved Product identity and commercial values, but the Sales Order draft could show converted line quantity as `0`, causing line totals to become `0` until the tester manually corrected the quantity.

The conversion now preserves the canonical commercial line values:

- Product ID
- SKU snapshot
- Product name snapshot
- description
- quantity
- unit
- unit price
- VAT
- recalculated totals

No Inventory, Reservation, Delivery Note, Prisma schema or Alpha activation behavior was changed.

## Exact Root Cause

The pure Quote to Sales Order adapter already mapped:

```text
QuoteItem.quantity → SalesOrderLine.quantityOrdered
```

However, persisted Quote lines were hydrated from Prisma with Decimal-backed numeric fields left as non-plain JavaScript numbers.

The Quote detail table could still display those values, but the Sales Order dialog and commercial calculations expect stable plain numbers. When the converted draft line reached number inputs and normalization paths, quantity could collapse to `0`.

This was a persistence hydration and numeric conversion boundary issue, not an Inventory reservation issue.

## Conversion Mapping

The explicit V1 mapping is:

| Quote field | Sales Order field |
| --- | --- |
| `productId` | `productId` |
| `productSku` | `productSku` |
| `productName` | `productName` |
| `description` | `description` |
| `quantity` | `quantityOrdered` |
| `unit` | `unit` |
| `unitPrice` | `unitPrice` |
| `taxRate` | `taxRate` |

Line discount remains `0` because the current `QuoteItem` model does not expose a line-level discount field.

## Product-Backed Lines

Product-backed Quote lines preserve the Product identity and historical snapshots.

The Sales Order dialog now avoids overwriting a converted line when the same Product is already selected. Product Catalog defaults are applied only when the user explicitly chooses a different Product.

This protects negotiated Quote values such as:

- quantity
- unit price
- VAT
- description

## Free-Form Lines

Free-form Quote lines also convert with their commercial values intact:

- no Product ID
- description preserved
- quantity preserved
- unit preserved
- unit price preserved
- VAT preserved

They remain non-reservable.

No Product is inferred from description, SKU-like text or labels.

## Persisted Numeric Hydration

CRM/Sales repository mapping now converts Prisma Decimal fields to plain numbers for:

- Quote line quantity
- Quote line unit price
- Quote line tax rate
- Quote discount
- Invoice line numeric fields
- Invoice paid amount
- Payment amount
- Sales Order line quantity ordered
- Sales Order line quantity reserved
- Sales Order line quantity delivered
- Sales Order line unit price
- Sales Order line discount
- Sales Order line tax

This keeps the local stores, dialogs, PDFs and calculations working with canonical JavaScript numbers.

## QA Case

Input Quote line:

```text
Product A
SKU P-121
Quantity 8
Unit price 5,000 MAD
VAT 20%
```

Converted Sales Order line:

```text
Product A
SKU P-121
Quantity ordered 8
Unit price 5,000 MAD
VAT 20%
Subtotal 40,000 MAD
Tax 8,000 MAD
Total 48,000 MAD
```

## Calculation Behavior

Sales Order totals are recalculated through the Commercial Documents Foundation via the existing Sales Order total wrapper.

No Quote totals are copied blindly.

## Validation

Completed:

- `npm run validate:runtime` — passed `124/124`
- `npm run typecheck` — passed
- `npx prisma format` — passed
- `npx prisma validate` — passed
- `npx prisma generate` — passed
- `npx prisma migrate status` — passed with local PostgreSQL access
- `npm run build` — passed
- `git diff --check` — passed
- clean `.next` runtime smoke check — passed unauthenticated route/API boundaries

## Known Limitations

- The current Quote line model has no line-level discount, so Sales Order line discount remains `0` after conversion.
- Authenticated browser QA depends on an active local session and controlled `sales-operations` profile.
- Delivery Notes, physical stock `ISSUE`, Returns, Credit Notes, Accounting, Manufacturing, POS, AI and Kanban were not implemented.

## Controlled Profile

Final state remains:

- `alpha.crm-sales` is the only default profile.
- `sales-operations` remains controlled-only for internal QA.
