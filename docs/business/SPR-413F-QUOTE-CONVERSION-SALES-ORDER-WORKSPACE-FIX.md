# SPR-413F — Quote Conversion Sales Order Workspace Fix

## Executive Summary

SPR-413F fixes the authenticated QA issue where converting an accepted Quote into a Sales Order redirected to a Sales Order detail page that displayed:

```text
Commande client introuvable.
```

The conversion was creating the Sales Order with the Quote workspace ID instead of the Sales Orders workspace ID.

## Root Cause

`SalesOrderService.createFromQuote()` used:

```ts
workspaceId: quote.workspaceId
```

Quotes belong to:

```text
sales-quotes-main
```

Sales Order list and detail workspaces read from:

```text
sales-orders-main
```

As a result, the Sales Order existed in the local service, but `OrderDetailsWorkspace` could not resolve it because it searches only inside the Sales Orders workspace.

## Fix

Quote conversion now:

- searches duplicate Sales Orders by source Quote inside `sales-orders-main`;
- creates the converted Sales Order with `workspaceId = SALES_ORDERS_WORKSPACE_ID`;
- preserves source Quote ID and number;
- preserves Company, Contact, Product/free-form lines, quantities, prices, VAT and notes;
- keeps Sales Orders inactive in normal Alpha and available only through the controlled Sales Operations profile.

## Persistence Guard

The CRM/Sales persistence repository now rejects Sales Orders that are not persisted under the Sales Orders workspace.

This prevents future malformed Sales Orders from being saved under the Quote workspace.

The repository also checks for an existing Sales Order with the same tenant and `sourceQuoteId` before persisting a new converted order. Updating the same Sales Order ID remains allowed; creating a second Sales Order for the same source Quote is rejected with a clear French business error.

## Legacy Data Normalization

Authenticated QA identified one existing malformed Sales Order linked to `DEV-2026-005`:

| Field | Value |
| --- | --- |
| Quote | `DEV-2026-005` |
| Quote ID | `quote-1784064310803` |
| Sales Order | `SO-2026-000004` |
| Sales Order ID | `sales-order-1784107097333-2an3lo` |
| Previous workspace | `workspace-hicopilot` |
| Correct workspace | `sales-orders-main` |

The existing Sales Order was normalized in place:

- ID preserved.
- Number preserved.
- Lines preserved.
- Status preserved.
- Product identity preserved.
- Reservation quantities preserved.
- No replacement record was created.

## Validation Coverage

Runtime validation now asserts that:

- a Quote from `sales-quotes-main` converts into a Sales Order in `sales-orders-main`;
- the source Quote relationship is preserved;
- duplicate conversion checks use the Sales Orders workspace;
- server persistence rejects Sales Orders sent with the wrong workspace.
- server duplicate protection is tenant-scoped by `sourceQuoteId`;
- updating the same existing Sales Order remains allowed by excluding the current ID.

## No Scope Expansion

SPR-413F does not introduce:

- Delivery Notes;
- stock physical `ISSUE`;
- returns;
- accounting;
- manufacturing;
- POS;
- AI;
- Kanban;
- Prisma schema changes;
- route changes;
- permission changes.

## Known Limitation

Previously malformed Sales Orders created during QA may need the same targeted in-place normalization if they were created before SPR-413F and are not linked to `DEV-2026-005`.
