import type { Quote } from "@/modules/sales/quotes";
import { calculateQuoteTotals } from "@/modules/sales/quotes";
import type { Invoice, InvoiceSort, InvoiceTotals } from "./invoice.types";

export function getInvoiceTotals(invoice: Invoice): InvoiceTotals {
  const totals = calculateQuoteTotals(invoice.items, invoice.discountRate, invoice.currency);
  return Object.freeze({
    ...totals,
    paid: invoice.paidAmount,
    remaining: Math.max(0, totals.total - invoice.paidAmount)
  });
}

export function matchesInvoiceSearch(invoice: Invoice, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    invoice.number,
    invoice.customerName,
    invoice.status,
    invoice.ownerId,
    invoice.notes,
    invoice.quoteId,
    invoice.companyId
  ].join(" ").toLowerCase().includes(normalized);
}

export function sortInvoices(invoices: readonly Invoice[], sort: InvoiceSort) {
  return [...invoices].sort((left, right) => {
    const leftValue = sort.field === "total" ? getInvoiceTotals(left).total : String(left[sort.field] ?? "");
    const rightValue = sort.field === "total" ? getInvoiceTotals(right).total : String(right[sort.field] ?? "");
    const result = typeof leftValue === "number" && typeof rightValue === "number"
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), "fr");
    return sort.direction === "asc" ? result : -result;
  });
}

export function createInvoiceInputFromQuote(quote: Quote) {
  const issueDate = "2026-07-03T11:00:00.000Z";
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);

  return Object.freeze({
    workspaceId: quote.workspaceId,
    customerName: quote.customerName,
    companyId: quote.companyId,
    contactId: quote.contactId,
    opportunityId: quote.opportunityId,
    quoteId: quote.id,
    issueDate,
    dueDate: dueDate.toISOString(),
    currency: quote.currency,
    items: quote.items,
    discountRate: quote.discountRate,
    notes: quote.notes ? `Facture générée depuis ${quote.number}. ${quote.notes}` : `Facture générée depuis ${quote.number}.`,
    ownerId: quote.ownerId,
    status: "issued" as const
  });
}
