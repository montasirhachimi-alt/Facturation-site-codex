# SPR-414A — Delivery Note Quantity Precision QA Fix

## Executive Summary

SPR-414A removes native floating-point stepping from Delivery Note quantities and applies the canonical Inventory six-decimal policy across form input, domain normalization, server persistence, posting, Inventory issue, reservation consumption and Sales Order delivery updates.

No schema or migration change was required. `alpha.crm-sales` remains the sole runtime default.

## Exact Root Cause

The `À livrer` field used:

```tsx
<input type="number" step="0.000001" />
```

Every native Arrow Up/Down operation applied a micro-step and the change handler immediately converted the browser value with `Number(...)`. Repeated stepping could therefore put values such as `3.000003` into React form state before the existing Inventory normalization policy was reached.

The defect originated in the Delivery Note dialog. It was not caused by Prisma Decimal, Inventory posting or reservation calculations.

## Canonical Quantity Policy

Delivery Notes now reuse direct imports from `src/modules/inventory/inventory.utils.ts`:

- `normalizeInventoryQuantity()`
- `parseInventoryQuantityInput()`
- `formatInventoryQuantityInput()`
- `adjustInventoryQuantityInput()`

The shared policy keeps at most six decimals, accepts integers and decimals, accepts both `2,5` and `2.5`, rejects empty/zero/negative/non-finite quantities on submit and normalizes every arithmetic boundary.

No separate Delivery Note precision constant was created.

## Controlled Input

The form state now preserves the editable quantity as a string. The input uses `type="text"` with `inputMode="decimal"`, so users may temporarily clear or partially type a value without React coercing it.

- Change preserves the entered string.
- Blur formats a valid value canonically.
- Arrow Up and Arrow Down use deterministic step `1` through the Inventory helper.
- `3 → Arrow Up → Arrow Down` produces exactly `3`.
- Mobile retains a decimal keyboard hint.

Form values are converted to domain numbers explicitly before entering `DeliveryNoteService`.

## Trusted Server Normalization

`persistDeliveryNoteDraft()` normalizes every line before validation or Prisma writes. The repository accepts supported number, locale string and Decimal-like representations, then rejects any non-finite or non-positive quantity.

Posting normalizes the persisted Decimal once into `quantity`. That same value drives:

- reservation consumption;
- Inventory `ISSUE` quantity;
- `SalesOrderLine.quantityDelivered` increment;
- posted Delivery Note line quantity;
- remaining quantity and status calculations.

Delivered and reserved Sales Order quantities are normalized after arithmetic. This prevents subsystem drift.

## Draft Remainder Display

A draft no longer labels the pre-posting order remainder simply as `Reliquat`.

It now displays:

```text
Reliquat après ce BL = ordered - already delivered - this BL quantity
```

For an order of 8 and a draft quantity of 3, the displayed projected remainder is 5. Posted documents continue to display the canonical current remainder from the Sales Order.

This is a display clarification only. Draft creation still does not change stock, reservation or delivered quantities.

## Existing Data Inspection

The local PostgreSQL database contained one posted Delivery Note line:

- BL: `BL-2026-000001`
- status: `posted`
- quantity to deliver: `3.000000000000000000000000000000`
- quantity posted: `3.000000000000000000000000000000`

No persisted `3.000003` artifact was found. No historical record was modified. Existing drafts, if any are later edited and saved, pass through the new canonical normalization boundary.

## Tests

Focused runtime coverage verifies:

- stable integer input;
- comma and dot parsing;
- exact Arrow Up/Down regression;
- binary artifact normalization;
- zero, negative, NaN and Infinity rejection;
- projected remainder `8 - 0 - 3 = 5`;
- controlled decimal input contract;
- trusted server normalization;
- one normalized posting quantity for reservation, ISSUE and delivered quantity;
- Alpha activation remains unchanged.

## Prisma and Migration

No Prisma model changed and no migration was created. Existing Decimal columns already support the required precision; the problem was UI stepping and missing normalization at selected application boundaries.

## Validation and QA

Automated validation results and clean runtime observations are recorded in `docs/02_PROJECT_STATUS.md` and the final Sprint report.

Authenticated end-to-end Sales Operations QA remains dependent on an authenticated local browser session. The persisted record inspection was completed directly against the local development database in read-only mode.

## Limitations

- Posted Delivery Notes remain immutable; this Sprint does not repair historical values automatically.
- Delivery reversal and Customer Returns remain future workflows.
- No accounting, automatic invoicing, Manufacturing, POS or AI behavior was added.
