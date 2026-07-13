# SPR-410 — Commercial Documents Foundation

## Executive Summary

SPR-410 creates the canonical Commercial Documents platform foundation for BOSIACO.

Quotes and Invoices now consume shared platform primitives for document lines, totals, validation, numbering metadata, statuses and lifecycle transitions while preserving their existing Alpha behavior.

No Purchasing, Sales Orders, Delivery Notes, Goods Receipt, Inventory reservation integration or database redesign was introduced.

## Document Platform

The shared foundation lives under:

- `src/platform/commercial-documents/`

The intended flow is:

```text
Header
  ↓
Lines
  ↓
Totals
  ↓
Status
  ↓
Lifecycle
  ↓
Persistence
  ↓
Rendering
```

Persistence and rendering remain owned by business modules. The platform only provides reusable document primitives and deterministic engines.

## Header Model

`CommercialDocumentHeader` captures shared document identity:

- document type
- number
- issue date
- due/expiration date
- currency
- status
- primary party
- secondary party
- contact party
- reference
- notes
- timestamps
- metadata

## Line Model

`CommercialDocumentLine` captures shared commercial line behavior:

- product reference metadata
- description
- quantity
- unit
- unit price
- line discount
- tax
- metadata

Current Sales line items remain compatible through adapters in the existing Sales utilities.

## Calculation Engine

`document-calculation.ts` owns:

- line subtotal
- line discount
- taxable base
- tax amount
- line total
- document subtotal
- document discount
- document tax
- grand total

The engine is deterministic and rounds monetary values through one shared helper.

It prepares future hooks for:

- multi-tax
- compound tax
- rounding policies
- currency conversion
- document-level discount policies

These future policies are not implemented in SPR-410.

## Status Engine

`document.status.ts` defines supported statuses by document type.

Current Alpha-ready types:

- Quote
- Invoice

Planned document types are metadata only:

- Sales Order
- Delivery Note
- Purchase Order
- Goods Receipt
- Supplier Invoice

## Lifecycle

`document.lifecycle.ts` defines allowed lightweight transitions.

Examples:

- Quote: draft → sent → accepted/refused/expired
- Invoice: draft → issued → partially paid/paid/overdue/cancelled

The lifecycle engine validates transitions only. It does not execute persistence or business side effects.

## Registry

`CommercialDocumentRegistry` stores document definitions:

- type
- label
- plural label
- numbering prefix
- Alpha readiness
- lifecycle status
- default status
- metadata

The registry validates missing labels and prefixes and rejects duplicate definitions.

## Quote Migration

Quote totals now use `calculateDocumentTotals()` through the existing `calculateQuoteTotals()` wrapper.

The public Quote API remains unchanged:

- `Quote`
- `QuoteItem`
- `QuoteTotals`
- `calculateQuoteTotals()`
- `getQuoteTotals()`

Existing quote dialogs, details, PDF preview and persistence behavior remain unchanged.

## Invoice Migration

Invoice totals continue to reuse Quote totals through `getInvoiceTotals()`.

Because Quote totals now consume the platform calculation engine, Invoice totals also benefit from the shared foundation without changing Invoice public types or persistence behavior.

## Sales Line Items

Shared Sales line-item helpers now delegate line subtotal, tax, total and validation primitives to the Commercial Documents platform.

The editor UI and validation messages remain unchanged.

## Import Safety

The platform foundation does not import:

- React
- Next.js
- Prisma
- CRM modules
- Sales UI
- Inventory
- repositories
- API routes

Sales modules import the platform, not the reverse.

## Validation

Runtime validation covers:

- registry validation
- Alpha-ready Quote and Invoice definitions
- planned future commercial document metadata
- document-level discount calculation
- tax calculation
- lifecycle acceptance/rejection
- Quote totals through the existing wrapper
- Invoice totals through the existing wrapper

## Known Limitations

- No Sales Order workflow.
- No Delivery Note workflow.
- No Purchase Order workflow.
- No Goods Receipt workflow.
- No Supplier Invoice workflow.
- No tenant-specific numbering settings UI.
- No multi-tax, compound tax, withholding tax or currency conversion policy.
- No direct Inventory Reservation integration.

## Confirmation

SPR-410 does not change:

- Runtime
- Prisma schema
- persistence architecture
- authentication
- permissions
- Inventory
- Reservation Engine
- Product Catalog behavior
- current Alpha navigation
- current Quote or Invoice user workflows
