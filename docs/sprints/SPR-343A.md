# SPR-343A — Complete Quote & Invoice Creation Workflow

Date: 2026-07-10

## Objective

Complete the existing Quote and Invoice creation workflows so users can create real local commercial documents with line items, calculated totals and immediate list visibility.

## Scope

- Sales UI and local in-memory workflow completion only.
- Existing QuoteService and InvoiceService remain the creation engines.
- Existing Smart Entity Picker and Inline Entity Creation behavior is preserved.
- No Runtime, Prisma, database schema, permissions, authentication, backend APIs, AI or unsupported accounting rules were changed.

## Audit Result

Quote records were loaded from multiple `QuoteService` instances seeded with `quoteSeed`. The Quotes workspace created a hardcoded demo quote from its private service instance, while Quote details and picker adapters read from separate seed-backed instances. This caused new quotes to be local to one component and not reliably visible elsewhere.

Invoice records already used a shared `invoiceService` singleton, but the Invoice workspace had no direct creation dialog. The Command Center invoice quick-create path used a preview dialog that submitted only UI state and did not create an invoice.

Quote and Invoice models already supported line items through `QuoteItem`, and totals utilities already existed through `calculateQuoteTotals`, `getQuoteTotals` and `getInvoiceTotals`.

Product data did not exist under `src/modules/products/`. A stable stock product source exists in `src/lib/demo-data.ts` with localStorage helpers in `src/lib/product-tools.ts`, so the line editor uses that existing source.

## Shared Line-Item Architecture

Added `src/modules/sales/shared/`:

- `sales-line-item.types.ts`
- `sales-line-item.utils.ts`
- `sales-line-items-editor.tsx`
- `index.ts`

The shared editor supports:

- add line
- remove line
- product selection through Smart Entity Picker
- manual description
- quantity
- unit price
- tax rate
- line HT, tax and TTC display
- responsive stacked layout without horizontal overflow

## Product Data Source

The product picker uses:

- fallback products from `src/lib/demo-data.ts`
- browser-local updates through `readProductsFromStorage`
- `hicotech-products-updated` and `storage` events

No product data was duplicated and no new product module was created.

## Quote Workflow

The Quote dialog now supports:

- customer selection and inline local creation
- company selection and inline local creation
- contact selection and inline local creation
- optional opportunity
- validity days
- currency
- discount rate
- notes
- multiple line items
- product-assisted line population
- manual line editing
- calculated subtotal, discount, tax and total before save

Saving creates a real quote through `quoteService.createQuote`.

## Invoice Workflow

The Invoice dialog now supports:

- customer selection and inline local creation
- company selection and inline local creation
- optional source quote selection
- quote line import when a source quote is selected
- issue date
- due date
- currency
- discount rate
- notes
- multiple line items
- calculated subtotal, discount, tax and total before save

Saving creates a real invoice through `invoiceService.createInvoice`.

## Calculation Behavior

The workflow reuses existing Sales calculations:

- line subtotal = quantity × unit price
- line tax = line subtotal × tax rate
- document subtotal, discount, tax and total use `calculateQuoteTotals`
- invoice totals use `getInvoiceTotals`

No new accounting rules were introduced.

## Validation Behavior

The dialogs validate:

- customer or commercial relation
- required company relation
- at least one valid line
- description on every saved line
- quantity greater than zero
- unit price not negative
- tax rate not negative

The same submit path is used for button click and keyboard form submission.

## Save/List Synchronization

Added a shared Quote store:

- `quote.store.ts`
- singleton `quoteService`
- browser update event
- subscription helper

The existing Invoice store now exposes matching update notification helpers.

Quotes and Invoices workspaces subscribe to their local store events and re-render without full page reload. Created records are not written into imported seed arrays.

## Quick Create Compatibility

Command Center Quick Create now opens the same completed Quote and Invoice dialogs. The previous invoice preview surface is no longer used for invoice creation.

## Desktop Result

Quote and Invoice creation now feel like complete commercial document workflows: select relationships, add products/manual lines, see totals, save and immediately see the record in the list.

## Mobile Result

The shared line editor stacks controls into cards, keeps add/remove controls reachable and avoids horizontal table overflow.

## Clean Runtime Test

Clean runtime policy was executed:

1. Deleted `.next`.
2. Started a fresh Next dev server.
3. Server started on port `3001` because port `3000` was already in use.
4. Root route returned `200 OK`.
5. Protected ERP routes `/sales/quotes`, `/sales/invoices` and `/dashboard` returned `307` to `/` without an authenticated browser session, which matches current route protection behavior.

No stale Next runtime error appeared during the clean runtime start.

## Validation

- `npm run validate:runtime`: Passed.
- `npm run typecheck`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed.

## Known Warnings

- The existing `src/components/pdf-preview.tsx` `@next/next/no-img-element` build warning remains unrelated to this sprint.

## Known Limitations

- Quote and Invoice creation remain local/in-memory and do not persist across reloads.
- Inline-created customers/companies/contacts remain picker-local form values, consistent with SPR-341.
- Product selection stores product-derived description, price and tax on the line; the current Sales `QuoteItem` model does not persist product id/reference.
- Full browser interaction verification behind authenticated ERP routes was limited by route protection in the command environment.
