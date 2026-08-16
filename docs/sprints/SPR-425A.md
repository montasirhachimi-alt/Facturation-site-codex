# SPR-425A — Sales Order Remaining Reservation Accuracy

Status: Completed
Date: 2026-08-16

## Executive Summary

SPR-425A fixes the Sales Order detail projection for the quantity displayed as `À réserver`.

After partial or full Delivery Note posting, the Sales Order detail page could still display a quantity to reserve based only on:

```text
orderedQuantity - currentlyReservedQuantity
```

That ignored quantities already delivered. The corrected canonical projection is:

```text
remainingToReserve = max(orderedQuantity - deliveredQuantity - currentlyReservedQuantity, 0)
```

No Inventory posting, Delivery Note transaction, reservation consumption or Sales Order delivery aggregation behavior changed.

## Observed Bug

After this validated flow:

```text
Sales Order quantity: 8
Reserve: 8
Partial Delivery Note: 3
Final Delivery Note: 5
```

Inventory and Sales Order state were correct:

- on hand decreased from 200 to 192;
- reserved decreased from 8 to 0;
- available returned to 192;
- Sales Order reached delivered state.

However the Sales Order detail availability text displayed:

```text
En main 192 · Réservé 0 · Disponible 192 · À réserver 8
```

The correct display is:

```text
En main 192 · Réservé 0 · Disponible 192 · À réserver 0
```

## Root Cause

The Sales Order detail UI calculated the display-only remainder locally with:

```text
quantityOrdered - quantityReserved
```

This was correct before any delivery, but wrong after Delivery Notes started updating `quantityDelivered`.

The issue was not caused by:

- Inventory `ISSUE` posting;
- reservation consumption;
- Delivery Note transaction logic;
- persisted Inventory balances;
- Sales Order delivered quantity updates.

## Canonical Calculation

Added `getSalesOrderLineRemainingToReserve()` in the Sales Order domain utilities.

The helper:

- subtracts delivered quantity;
- subtracts currently reserved quantity;
- clamps at zero;
- reuses the canonical Inventory quantity normalization policy.

## Files Modified

- `src/modules/sales/orders/order.utils.ts`
- `src/modules/sales/orders/ui/order-details-workspace.tsx`
- `scripts/validate-runtime.cjs`
- `docs/02_PROJECT_STATUS.md`

## Runtime Validation

Focused runtime coverage verifies:

| Scenario | Expected `À réserver` |
| --- | ---: |
| ordered 8, delivered 0, reserved 0 | 8 |
| ordered 8, delivered 0, reserved 8 | 0 |
| ordered 8, delivered 3, reserved 5 | 0 |
| ordered 8, delivered 3, reserved 2 | 3 |
| ordered 8, delivered 8, reserved 0 | 0 |
| ordered 8, delivered 6, reserved 5 | 0 |

The validation also confirms that the Sales Order detail workspace consumes the canonical helper instead of reimplementing the formula inline.

## Validation

Commands run:

- `npm run typecheck`: passed
- `npm run validate:runtime`: passed, 166/166 checks
- `npm run build`: passed
- `git diff --check`: passed

## Known Limitations

- `npm run build` still reports the known `src/components/pdf-preview.tsx` `<img>` warning from Next.js.
- Authenticated Sales Operations browser QA still depends on a local authenticated session with the internal `sales-operations` profile.
- Sales Orders, Delivery Notes and Shipments remain activation-gated outside the default `alpha.crm-sales` profile.
