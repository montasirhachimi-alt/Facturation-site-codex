# SPR-437A — Inventory Valuation Synchronization Transaction Hardening

## Summary

SPR-437A fixes a real runtime failure in Inventory valuation synchronization.

Clicking `Synchroniser valorisation` could keep a Prisma interactive transaction open long enough for Prisma's default 5000 ms timeout to expire. The failure happened while resolving Procurement Goods Receipt costs during valuation reconstruction.

The fix preserves the SPR-437 architecture:

- `InventoryStockMovement` remains the canonical physical stock source;
- valuation still uses `moving_average_v1`;
- `InventoryValuationEvent` remains the durable valuation source;
- Accounting COGS posting remains Finance-owned;
- inbound Stock/GRNI accounting remains deferred.

## Root Cause

`reconcileInventoryValuation()` previously performed the full reconstruction inside one interactive Prisma transaction.

For each missing valuation event, inbound Goods Receipt movements could call:

```text
procurementGoodsReceipt.findUnique()
```

inside the transaction loop.

That created an N+1 lookup pattern and kept the transaction open while it performed read-heavy source resolution. With enough posted stock movements and Procurement references, the transaction exceeded Prisma's 5000 ms interactive transaction timeout.

## Fix

The synchronization path now follows the intended pattern:

```text
Read posted movements and existing valuation events
        ↓
Batch preload Product cost references
        ↓
Batch preload Goods Receipt / Purchase Order references
        ↓
Build deterministic valuation plan in memory
        ↓
Short write transaction
        ↓
Create missing InventoryValuationEvent records
```

The write transaction no longer performs Product or Procurement lookups. It only persists the already planned valuation events.

## Cost Semantics Preserved

Goods Receipt valuation still uses the linked Purchase Order line cost and discount.

Manual inbound valuation still uses Product purchase cost only when a positive cost exists.

Legacy or unpriced inbound stock remains explicitly unvalued. SPR-437A does not fabricate costs for historical movements without reliable acquisition cost.

## Runtime Guard

Runtime validation now includes a regression check confirming that:

- Goods Receipt references are batch preloaded;
- Product cost references are batch preloaded;
- the valuation transaction creates valuation events only;
- Procurement/Product lookups do not run inside the valuation write transaction.

## Files Modified

- `src/server/persistence/inventory-repository.ts`
- `scripts/validate-runtime.cjs`
- `docs/02_PROJECT_STATUS.md`
- `docs/03_DECISIONS_LOG.md`

## Validation

Required validation:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npm run validate:runtime`
- `npm run typecheck`
- `npm run build`
- `git diff --check`

## Known Limitations

- Browser authenticated QA depends on a valid local authenticated dataset.
- Historical stock movements without reliable purchase cost remain unvalued by design.
- Inbound Stock/GRNI accounting remains deferred until GRNI clearing and 3-way matching are implemented.
