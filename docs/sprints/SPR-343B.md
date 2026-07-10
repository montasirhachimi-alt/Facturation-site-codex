# SPR-343B — Quote & Invoice PDF Export

Date: 2026-07-10

## Objective

Add a stable local PDF preview, download and print workflow for saved Quotes and Invoices without changing Runtime, Services, APIs, Prisma, database schema, permissions, authentication or business rules.

## Scope

- Sales document experience only.
- Existing local Quote and Invoice records remain the source of truth.
- Existing `jsPDF` premium renderer remains the PDF engine.
- Existing Sales totals utilities remain the commercial calculation source.
- No backend PDF generation, external PDF service, AI or new persistence was introduced.

## Audit Result

The project already contained a mature PDF renderer in `src/lib/pdf.ts`, but its public Quote and Invoice helpers accepted legacy document types from `src/lib/types.ts`.

The current Sales module uses newer local records from:

- `src/modules/sales/quotes/quote.types.ts`
- `src/modules/sales/invoices/invoice.types.ts`
- `src/modules/sales/quotes/quote.store.ts`
- `src/modules/sales/invoices/invoice.store.ts`

Because those newer module records were not adapted to `PdfLayoutDocument`, Quote and Invoice detail workspaces had no stable preview/download/print actions for documents created through SPR-343A.

## PDF Architecture

Added a Sales document PDF layer under `src/modules/sales/documents/`.

The layer maps current local Sales records into the existing `PdfLayoutDocument` contract, then calls the existing premium renderer through a narrow exported helper:

- `buildQuotePdfDocument`
- `buildInvoicePdfDocument`
- `downloadSalesDocumentPdf`
- `printSalesDocumentPdf`
- `SalesDocumentPreviewDialog`
- `SalesDocumentTemplate`

The generic PDF renderer stays centralized in `src/lib/pdf.ts`.

## Data Source

The PDF workflow uses saved local records only:

- Saved Quote from `quoteService`
- Saved Invoice from `invoiceService`
- Linked company/contact seed data where available
- Active company profile from existing demo company settings

No hardcoded quote or invoice was introduced.

## Supported Quote PDF Fields

- document type
- quote number
- issue date
- expiration date
- status
- customer
- linked company
- linked contact where available
- line descriptions
- quantities
- unit prices
- tax rates
- calculated totals
- notes
- company identity

## Supported Invoice PDF Fields

- document type
- invoice number
- issue date
- due date
- status
- customer
- linked company
- linked contact where available
- source quote reference where available
- line descriptions
- quantities
- unit prices
- tax rates
- calculated totals
- paid amount
- remaining amount
- notes
- company identity

## Calculation Behavior

Quote and Invoice module totals continue to use:

- `getQuoteTotals`
- `getInvoiceTotals`

The PDF adapter aligns the exported grand total with those Sales utilities before handing the payload to the existing PDF renderer.

No new accounting rules were added.

## User Experience

Quote and Invoice detail pages now expose:

- `Aperçu PDF`
- `Télécharger PDF`
- `Imprimer`

The actions are placed inside the existing Contextual Actions strip so they feel like natural next steps on saved commercial documents.

The preview opens as a compact document dialog with:

- ESC close
- explicit close button
- download button
- print button
- responsive document preview

## Post-Save Behavior

After creating a Quote or Invoice from its workspace dialog, the app now routes to the saved document detail page. This makes PDF preview, download and print immediately discoverable after save.

Command Center Quick Create uses the same completed Quote and Invoice dialogs and routes to the same saved document detail pages after success.

No auto-download or auto-print behavior was added.

## Contextual Actions Integration

Quote details now include PDF actions alongside:

- create/open invoice
- open company
- open pipeline

Invoice details now include PDF actions alongside:

- record payment
- open company
- open source quote

## Desktop Result

Saved Quote and Invoice details now feel complete for daily commercial work: users can review the record, inspect totals and immediately preview, download or print the client-facing PDF.

## Mobile Result

The preview dialog uses stacked controls, responsive spacing and horizontal overflow only inside the line-item table so the document remains readable without changing the business flow.

## Accessibility

- PDF actions are real buttons with visible focus states.
- Preview dialog uses `role="dialog"` and `aria-modal`.
- ESC closes the preview.
- The close/download/print controls remain keyboard reachable.

## Files Created

- `src/modules/sales/documents/index.ts`
- `src/modules/sales/documents/sales-document-actions.tsx`
- `src/modules/sales/documents/sales-document-pdf.types.ts`
- `src/modules/sales/documents/sales-document-pdf.utils.ts`
- `src/modules/sales/documents/sales-document-template.tsx`

## Files Modified

- `src/lib/pdf.ts`
- `src/modules/sales/quotes/ui/quote-details-workspace.tsx`
- `src/modules/sales/quotes/ui/quotes-workspace.tsx`
- `src/modules/sales/invoices/ui/invoice-details-workspace.tsx`
- `src/modules/sales/invoices/ui/invoices-workspace.tsx`
- `src/platform/search/providers/quick-create-dialog-host.tsx`
- `docs/02_PROJECT_STATUS.md`
- `docs/sprints/SPR-343B.md`

## Validation

- `npm run validate:runtime`: Passed.
- `npm run typecheck`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed.
- clean local runtime test: Passed.

## Known Warnings

- The existing `src/components/pdf-preview.tsx` `@next/next/no-img-element` build warning remains unrelated to this sprint.

## Known Limitations

- Quote and Invoice data remain local/in-memory and do not persist across reloads.
- The current Sales `QuoteItem` model stores line description, quantity, unit price and tax rate, but not a stable product id/reference; PDF line reference therefore uses the local line id.
- Browser-level authenticated route testing depends on the local dev session state.
