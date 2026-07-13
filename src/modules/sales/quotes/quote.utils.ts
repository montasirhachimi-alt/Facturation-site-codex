import { calculateDocumentTotals } from "@/platform/commercial-documents";
import type { Quote, QuoteCurrency, QuoteItem, QuoteSort, QuoteTotals } from "./quote.types";

export function calculateQuoteTotals(items: readonly QuoteItem[], discountRate = 0, currency: QuoteCurrency): QuoteTotals {
  const totals = calculateDocumentTotals(
    items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: { rate: item.taxRate }
    })),
    currency,
    { rate: discountRate }
  );

  return Object.freeze({
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
    currency
  });
}

export function formatQuoteMoney(amount: number, currency: QuoteCurrency) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function getQuoteTotals(quote: Quote) {
  return calculateQuoteTotals(quote.items, quote.discountRate, quote.currency);
}

export function matchesQuoteSearch(quote: Quote, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    quote.number,
    quote.customerName,
    quote.status,
    quote.ownerId,
    quote.notes,
    quote.opportunityId,
    quote.opportunityName,
    quote.companyId,
    quote.companyName,
    quote.contactId,
    quote.contactName
  ].join(" ").toLowerCase().includes(normalized);
}

export function sortQuotes(quotes: readonly Quote[], sort: QuoteSort) {
  return [...quotes].sort((left, right) => {
    const leftValue = sort.field === "total" ? getQuoteTotals(left).total : String(left[sort.field] ?? "");
    const rightValue = sort.field === "total" ? getQuoteTotals(right).total : String(right[sort.field] ?? "");
    const result = typeof leftValue === "number" && typeof rightValue === "number"
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), "fr");

    return sort.direction === "asc" ? result : -result;
  });
}

export function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}
