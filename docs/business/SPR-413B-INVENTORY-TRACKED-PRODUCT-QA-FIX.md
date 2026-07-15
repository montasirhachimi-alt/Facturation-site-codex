# SPR-413B — Inventory-Tracked Product QA Fix

## Executive Summary

SPR-413B fixes the Product Catalog gap that blocked the controlled Sales Operations QA workflow.

The canonical inventory-tracking contract already existed:

- Prisma: `Product.trackInventory`
- Product domain: `Product.flags.trackInventory`

The issue was that the Product create/edit UI did not expose this classification clearly. Users could create Products, but they could not intentionally choose whether a Product was stockable or non-stocked from the catalog dialog.

The Product Catalog now supports both:

- `Produit stockable`
- `Service / non stocké`

No second Product model, no new tracking field and no database migration were introduced.

## Root Cause

The Product persistence and domain layer already supported inventory tracking, but the dialog copy described Products as:

> prix, TVA et métadonnées produit sans inventaire

The create/edit form did not include `trackInventory`, so UI-created Products used the default non-inventory behavior unless another path set the flag. That made the Product visible commercially but unsuitable for manual receipt, Inventory availability and Sales Order reservation.

## Canonical Tracking Field

Canonical field:

- `Product.flags.trackInventory`

Persistent field:

- `Product.trackInventory`

Type:

- boolean

Meaning:

- `true`: stockable Product, eligible for Inventory posting and reservation.
- `false`: service/non-stocked Product, commercially valid but excluded from Inventory movement and reservation workflows.

## Product Create/Edit UX

The Product dialog now includes `Type de produit`.

Options:

- `Produit stockable`
- `Service / non stocké`

The selected state is visible, keyboard accessible and uses French explanatory copy.

The dialog description now reflects the real contract:

> Gérez les informations commerciales et le comportement de stock du produit.

## Default Classification

New Product default:

- `Produit stockable`

Reason:

The Product Catalog is the canonical source for Product → Inventory → Sales Order QA. Services remain explicitly available, but the default Product creation path should allow the tester to complete receipt and reservation workflows without hidden technical fields.

## Tracking Transition Policy

V1 policy:

- `SERVICE → STOCKABLE`: allowed.
- `STOCKABLE → SERVICE`: rejected if the Product has any Inventory balance or Inventory movement history.

This policy is enforced:

- client-side in the Product page hook
- server-side in the Product Catalog persistence repository

French validation message:

> Ce produit a déjà un historique ou un solde de stock. Il ne peut pas être transformé en service non stocké.

## Inventory Eligibility

Manual Inventory operations now receive only Product picker items where:

- Product is active
- Product is stockable through `flags.trackInventory`

Services/non-stocked Products and archived Products are excluded from new Inventory movements.

Product selection continues to use canonical Product IDs.

## Manual Receipt

Manual Receipt remains unchanged architecturally:

```text
Inventory dialog
  ↓
Inventory persistence operation
  ↓
Inventory posting engine
  ↓
Inventory balance and movement history
```

No UI mutates balances directly.

Expected result after receiving 20 units:

- En main: 20
- Réservé: 0
- Disponible: 20

## Sales Line Integration

Quotes, Invoices and Sales Orders continue to preserve Product IDs from SPR-413A.

Classification is not duplicated into document lines. Product identity remains the stable reference; Product Catalog remains the source of the tracking policy.

## Reservation Eligibility

Sales Order reservation continues to require:

- valid Product ID
- tenant ownership
- active Product
- `trackInventory = true`
- remaining quantity to reserve
- valid Warehouse

Service/non-stocked Products and free-form lines remain non-reservable.

## Controlled Profile

`alpha.crm-sales` is restored as the only default profile.

`sales-operations` remains available for controlled QA but is not default.

Temporary QA switch:

1. In `src/platform/editions/edition.profiles.ts`, set `alphaCrmSalesEditionProfile.defaultForEnvironment` to `false`.
2. Set `salesOperationsEditionProfile.defaultForEnvironment` to `true`.
3. Delete `.next`.
4. Run `npm run dev`.
5. Complete QA.
6. Restore Alpha:
   - `alphaCrmSalesEditionProfile.defaultForEnvironment: true`
   - `salesOperationsEditionProfile.defaultForEnvironment: false`
7. Delete `.next` and restart.

Only one profile should be default at a time.

## Prisma / Migration

No migration was created.

Reason:

The canonical persistence field already existed in `prisma/schema.prisma`:

```prisma
trackInventory Boolean @default(false)
```

SPR-413B updates UI, client form state, Inventory picker eligibility and server-side transition safety only.

## Validation

Completed:

- `npx prisma format`
- `npx prisma validate`
- `npm run validate:runtime`
- `npm run typecheck`

Pending final validation phase:

- `npx prisma generate`
- `npx prisma migrate status`
- `npm run build`
- `git diff --check`
- clean `.next` runtime check

## Known Warnings

The existing Next.js warning in `src/components/pdf-preview.tsx` about `<img>` remains unchanged.

## Known Limitations

- Authenticated end-to-end browser QA depends on an active local session.
- Product import/export does not yet expose the tracking classification.
- Delivery Notes, physical stock `ISSUE`, Returns, Credit Notes, Accounting, Manufacturing, POS, AI and Kanban were not implemented.
