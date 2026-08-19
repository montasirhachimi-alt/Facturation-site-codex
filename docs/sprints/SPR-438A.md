# SPR-438A — GRNI Line-Linkage & Valuation Identity Hardening

## Summary

SPR-438A fixes the Supplier Bill to GRNI classification defect found during manual QA after SPR-438.

The verified case was:

- Supplier: `Fournisseur Test GRNI`
- Purchase Order: `PO-2026-000006`
- Goods Receipt: `GR-2026-000009`
- Supplier Bill: `FB-2026-000001`
- Product: `Honor76`
- Quantity: `10`
- Unit cost HT: `2500 MAD`

The Supplier Bill header was linked to the Purchase Order and Goods Receipt, but the persisted Supplier Bill line did not reference the Goods Receipt line. Finance therefore classified the bill as `Charges`.

## Root Cause

`SupplierBillDialog` populated Supplier Bill lines from Purchase Order lines when a Purchase Order was selected.

Selecting a Goods Receipt only updated the header-level `goodsReceiptId`; it did not map Goods Receipt lines into Supplier Bill lines and therefore did not persist `goodsReceiptLineId`.

GRNI reconciliation requires line-level linkage:

```text
Supplier Bill Line
  -> Goods Receipt Line
  -> Inventory Stock Movement
  -> Inventory Valuation Event
  -> Receipt capitalization entry
```

The second defect was identity mismatch. Goods Receipt posting created Inventory movements from the transient line id held by the submitted receipt, while persisted Goods Receipt lines use deterministic ids from `createGoodsReceiptLinePersistenceId()`. Existing valuation events could therefore point to an older movement id that GRNI reconciliation did not resolve.

## Supplier Bill Line-Linkage Fix

Supplier Bill receipt selection now uses a real receipt-aware mapper.

When a Goods Receipt is selected:

- `goodsReceiptId` is set;
- supplier and Purchase Order context are preserved;
- Supplier Bill lines are rebuilt from Goods Receipt lines;
- `goodsReceiptLineId`, `purchaseOrderLineId` and `productId` are preserved;
- received quantity is used as the invoice quantity;
- unit cost, discount and tax are derived from the matching Purchase Order line when available.

Manual unmatched lines remain supported and continue to use expense behavior.

## Existing Bill Repair Decision

The existing QA Supplier Bill `FB-2026-000001` was not accounted.

A controlled one-record repair was performed after verifying:

- tenant: `company-hicotech`;
- Purchase Order: `PO-2026-000006`;
- Goods Receipt: `GR-2026-000009`;
- Product identity;
- quantity;
- non-accounted status.

The Supplier Bill line was updated to reference:

```text
gr-1787086848435-zkdw0y:po-1787086678253-68cef0a180f7e8:0
```

No accounted history was modified.

## Valuation Identity Fix

Future Goods Receipt posting now creates Inventory movement ids from the persisted Goods Receipt line identity.

GRNI reconciliation no longer depends only on a brittle reconstructed movement id. It resolves actual posted `InventoryStockMovement` records for the Goods Receipt and maps them back to receipt lines.

For legacy data, one safe fallback is allowed only when exactly one posted receipt movement matches:

- same Goods Receipt;
- same Product;
- same received quantity.

Ambiguous movement matches are not guessed.

## Treatment Classification Behavior

Finance `Intégration achats` now avoids calling header-only receipt-linked Supplier Bills `Charges`.

Classification is:

- `Stock / GRNI` when at least one Supplier Bill line has both `goodsReceiptLineId` and `productId`;
- `Non rapproché` when the bill header references a Goods Receipt but lines are not linked;
- `Charges` for true unlinked expense bills.

This keeps the UI aligned with the line-level matching model.

## Pending Capitalization Behavior

SPR-438's accounting rule is preserved.

A stock-backed Supplier Bill can clear GRNI only after the related receipt valuation has been capitalized:

```text
Dr Inventory Asset
Cr GRNI
```

If receipt capitalization is missing, Supplier Bill accounting raises the explicit domain error:

```text
La réception stock doit être comptabilisée en GRNI avant la facture fournisseur.
```

The system does not silently reclassify the line as expense.

## Accounting Posting Behavior

When the receipt is valued and capitalized, a linked stock-backed Supplier Bill posts as:

```text
Dr GRNI
Dr Recoverable Tax
Cr Accounts Payable
```

Price variance protection remains unchanged. If tax-exclusive bill value differs from proportional receipt valuation by 0.01 or more, posting is rejected for future controlled variance handling.

## Files Created

- `docs/sprints/SPR-438A.md`

## Files Modified

- `src/modules/procurement/ui/dialogs/supplier-bill-dialog.tsx`
- `src/server/persistence/procurement-repository.ts`
- `src/server/persistence/accounting-repository.ts`
- `src/modules/accounting/ui/pages/accounting-workspace.tsx`
- `scripts/validate-runtime.cjs`
- `docs/02_PROJECT_STATUS.md`
- `docs/03_DECISIONS_LOG.md`

## Migration

No Prisma schema change and no migration were required.

## Validation

Required validation:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npm run validate:runtime`
- `npm run typecheck`
- `npm run build`
- `git diff --check`

Runtime validation includes dedicated checks for:

- Supplier Bill receipt selection persists line-level `goodsReceiptLineId`;
- Supplier Bill lines retain Goods Receipt line, Purchase Order line and Product identities;
- Goods Receipt posting uses persisted line identity for future Inventory movement ids;
- GRNI reconciliation resolves actual posted receipt movements;
- header-only receipt links are shown as `Non rapproché`, not `Charges`;
- pending receipt capitalization remains an explicit blocking reason.

## Manual End-to-End QA — PASSED

Manual E2E QA passed on 2026-08-19 for tenant `company-hicotech`.

Verified source documents:

- Purchase Order: `PO-2026-000006`;
- Goods Receipt: `GR-2026-000009`;
- Supplier Bill: `FB-2026-000001`;
- Supplier: `Fournisseur Test GRNI`;
- Product: `Honor76`;
- Quantity: `10`;
- Unit purchase cost: `2500 MAD`;
- HT: `25000 MAD`;
- Recoverable VAT: `5000 MAD`;
- TTC: `30000 MAD`.

The verified operational chain was:

```text
Purchase Order
  -> Goods Receipt
  -> stock movement
  -> inventory valuation
  -> receipt capitalization
  -> Dr Inventory / Cr GRNI
  -> Supplier Bill line-level receipt matching
  -> Stock / GRNI classification
  -> Supplier Bill accounting
  -> Dr GRNI / Dr Recoverable VAT / Cr Accounts Payable
```

Finance `Intégration stock` successfully capitalized the inbound receipt valuation for `25000 MAD`. The receipt accounting status became `Comptabilisé`.

Finance `Intégration achats` then recognized `FB-2026-000001` as `Stock / GRNI`, not `Charges`.

The Supplier Bill was posted successfully as canonical accounting entry:

```text
AP-FB-2026-000001
```

Verified accounting lines:

```text
Dr GRNI · Réceptions non facturées        25000 MAD
Dr TVA-REC · TVA récupérable               5000 MAD
Cr AP · Fournisseurs à payer              30000 MAD
```

Verified totals:

- Total Debit: `30000 MAD`;
- Total Credit: `30000 MAD`;
- Difference: `0 MAD`;
- Entry status: `Comptabilisé`;
- Equation: `Équilibrée`.

Critically, the Supplier Bill did not debit `PURCHASE · Achats / Charges` for the stock-backed amount. This confirms that `Stock / GRNI` is not only a UI label; the accounting posting engine clears GRNI for the verified receipt-backed Supplier Bill.

## Manual QA Instructions

1. Open Finance -> `Intégration stock`.
2. Confirm the inbound valuation for the target Goods Receipt is available.
3. Post the receipt capitalization.
4. Open Finance -> `Intégration achats`.
5. Confirm the Supplier Bill is treated as `Stock / GRNI`.
6. Configure AP and Inventory GRNI accounts if missing.
7. Post the Supplier Bill.
8. Expected accounting:

```text
Dr GRNI
Dr Recoverable Tax
Cr Accounts Payable
```

## Deferred Scope

Deferred intentionally:

- supplier payment/AP settlement;
- full 3-way matching persistence;
- price variance accounting;
- landed costs;
- automated background posting;
- VAT localization;
- FX;
- FIFO/LIFO.
