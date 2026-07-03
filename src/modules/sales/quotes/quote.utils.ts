import type { Quote, QuoteCurrency, QuoteItem, QuoteSort, QuoteTotals } from "./quote.types";

export function calculateQuoteTotals(items: readonly QuoteItem[], discountRate = 0, currency: QuoteCurrency): QuoteTotals {
  const subtotal = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const discount = subtotal * (discountRate / 100);
  const taxable = subtotal - discount;
  const tax = items.reduce((total, item) => total + item.quantity * item.unitPrice * (1 - discountRate / 100) * (item.taxRate / 100), 0);

  return Object.freeze({
    subtotal,
    discount,
    tax,
    total: taxable + tax,
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
    quote.companyId
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
