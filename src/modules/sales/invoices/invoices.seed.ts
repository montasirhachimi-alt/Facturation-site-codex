import type { Invoice, InvoiceId } from "./invoice.types";
import { SALES_QUOTES_WORKSPACE_ID, SALES_QUOTES_USER_ID, quoteSeed } from "@/modules/sales/quotes";
import { createInvoiceInputFromQuote } from "./invoice.utils";

const acceptedQuote = quoteSeed.find((quote) => quote.status === "accepted");

export const invoiceSeed: readonly Invoice[] = Object.freeze([
  ...(acceptedQuote
    ? [{
        ...createInvoiceInputFromQuote(acceptedQuote),
        id: "invoice-fac-2026-001" as InvoiceId,
        workspaceId: SALES_QUOTES_WORKSPACE_ID,
        number: "FAC-2026-001",
        status: "issued" as const,
        paidAmount: 0,
        createdAt: "2026-07-03T09:00:00.000Z",
        updatedAt: "2026-07-03T09:00:00.000Z"
      }]
    : []),
  {
    id: "invoice-fac-2026-002" as InvoiceId,
    workspaceId: SALES_QUOTES_WORKSPACE_ID,
    number: "FAC-2026-002",
    customerName: "Al Hikma Clinic",
    companyId: "company-alhikma" as never,
    contactId: "contact-sara" as never,
    quoteId: "quote-dev-2026-041" as never,
    opportunityId: "opportunity-alhikma-renewal" as never,
    status: "partially_paid",
    issueDate: "2026-07-02T10:00:00.000Z",
    dueDate: "2026-08-01T10:00:00.000Z",
    currency: "MAD",
    discountRate: 5,
    paidAmount: 50000,
    ownerId: SALES_QUOTES_USER_ID,
    notes: "Acompte reçu, solde à suivre.",
    items: [
      { id: "item-1", description: "Modernisation réseau", quantity: 1, unitPrice: 94000, taxRate: 20 }
    ],
    createdAt: "2026-07-02T10:00:00.000Z",
    updatedAt: "2026-07-02T12:00:00.000Z"
  }
]);
