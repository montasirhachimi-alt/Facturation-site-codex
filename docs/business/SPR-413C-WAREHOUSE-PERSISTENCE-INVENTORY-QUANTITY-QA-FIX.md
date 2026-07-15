# SPR-413C — Warehouse Persistence & Inventory Quantity QA Fix

## Executive Summary

SPR-413C fixes two authenticated Inventory QA defects:

- Warehouses could be persisted successfully but disappear from the Inventory workspace immediately after save.
- Manual Inventory quantity inputs could produce floating-point artifacts such as `0,990001` or `1,050001`.

No Inventory redesign, Prisma schema change, duplicate Warehouse model or second Inventory store was introduced.

## Exact Warehouse Root Cause

The Inventory persistence API correctly scoped writes to the authenticated tenant through `requirePersistenceTenantScope()`.

Authenticated demo users belong to:

```text
company-hicotech
```

The Inventory workspace, however, read the local Inventory snapshot through a stale hardcoded client scope:

```text
company-bosiaco
```

Result:

1. Warehouse creation succeeded in PostgreSQL under the authenticated tenant.
2. The API returned a fresh canonical Inventory snapshot.
3. The client applied the snapshot.
4. The workspace immediately filtered the snapshot by the wrong company ID.
5. The Warehouse table still displayed `Aucun entrepôt`.
6. Manual Receipt selectors had no active Warehouse.

This was a tenant-scope mismatch, not a missing database write.

## Confirmed Warehouse Creation

Warehouse creation remains a confirmed write:

```text
WarehouseDialog
  ↓
persistInventoryOperation("createWarehouse")
  ↓
/api/persistence/inventory
  ↓
createInventoryWarehouse()
  ↓
loadInventorySnapshot()
  ↓
applyInventorySnapshot()
```

The success message `Entrepôt créé.` is shown only after the POST resolves successfully.

On failure, the dialog stays open and the entered form state is preserved.

## Client Store And Hydration Fix

The workspace now uses the same tenant source as authenticated demo sessions:

```text
activeCompanyId
```

The Warehouse table, Manual Receipt selector, movement dialogs, reservation dialogs and Inventory KPIs all consume the same canonical `inventoryLocalService` snapshot.

No component-local Warehouse list was added.

## Manual Receipt Selector Result

Manual Receipt now receives active Warehouses from the same canonical Inventory snapshot as the Warehouse table.

Rules preserved:

- active Warehouses appear
- archived Warehouses are excluded by dialog filtering
- selection uses canonical Warehouse IDs
- no matching by name
- tenant isolation remains server-owned

## Quantity Root Cause

The quantity fields used native `type="number"` inputs with `step="0.01"` and converted values using `Number(form.quantity)`.

Browser/native number stepping can expose binary floating-point noise during incremental changes. The Inventory service rounded balances after arithmetic, but the UI state and submitted payload could still carry noisy values.

## Quantity Precision Policy

Inventory now uses one explicit quantity policy:

- maximum precision: `6` decimal places
- canonical helper: `normalizeInventoryQuantity()`
- locale-aware parser: `parseInventoryQuantityInput()`
- deterministic display helper: `formatInventoryQuantityInput()`
- deterministic Arrow Up/Down helper: `adjustInventoryQuantityInput()`

The policy supports:

- `1`
- `20`
- `2.5`
- `2,5`

It rejects:

- empty invalid values on submit
- `NaN`
- zero
- negative quantities
- non-finite numbers

The V1 precision remains compatible with fractional units without forcing integer stock.

## Numeric Input Behavior

Manual movement and reservation dialogs now use controlled text inputs with `inputMode="decimal"` instead of native number spinners.

Behavior:

- typing is not coerced while the user edits
- comma and dot decimals are accepted
- blur normalizes valid values
- Arrow Up increments by `1`
- Arrow Down decrements by `1`
- Arrow Down never creates a negative quantity
- values such as `20` return exactly to `20`

## Inventory Posting Result

The server repository normalizes the posted quantity once and uses that exact normalized value for:

- balance on-hand update
- reserved quantity update
- available quantity calculation
- persisted movement quantity

The repository also rejects non-stocked Products at the persistence boundary by requiring `Product.trackInventory = true`.

The UI still does not mutate balances directly.

## Prisma / Migration

No migration was created.

Reason:

- Warehouse persistence models already existed.
- Product tracking policy already existed.
- Quantity precision is handled by domain and persistence normalization.

## Controlled Profile

Final state:

- `alpha.crm-sales` is the only default profile.
- `sales-operations` remains available only for controlled authenticated QA.

Inventory, Product Catalog and Sales Orders remain hidden from normal Alpha.

## Validation

Completed:

- `npm run validate:runtime` — passed `122/122`
- `npm run typecheck` — passed

Final validation still required after documentation updates:

- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate status`
- `npm run build`
- `git diff --check`
- clean `.next` runtime check

## Known Limitations

- Authenticated browser QA depends on an active local session and controlled `sales-operations` profile.
- Quantity helpers are Inventory-specific. A future shared numeric-input primitive may reuse the policy if another module needs precise decimal stock-like values.
- Delivery Notes, physical stock `ISSUE`, Returns, Credit Notes, Accounting, Manufacturing, POS, AI and Kanban were not implemented.

## Delivery Note Readiness

SPR-413C keeps the future Delivery Note boundary intact:

- Sales Orders reserve/release stock only.
- Manual Inventory receipt posts `RECEIPT`.
- Physical customer delivery and stock `ISSUE` remain future Delivery Note responsibilities.
