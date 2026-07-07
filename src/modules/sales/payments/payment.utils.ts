import type { Invoice } from "@/modules/sales/invoices";
import { getInvoiceTotals } from "@/modules/sales/invoices";
import type { CreatePaymentInput, Payment, PaymentSort } from "./payment.types";

export function matchesPaymentSearch(payment: Payment, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    payment.number,
    payment.invoiceNumber,
    payment.customerName,
    payment.status,
    payment.method,
    payment.reference,
    payment.notes,
    payment.ownerId,
    payment.companyId
  ].join(" ").toLowerCase().includes(normalized);
}

export function sortPayments(payments: readonly Payment[], sort: PaymentSort) {
  return [...payments].sort((left, right) => {
    const leftValue = sort.field === "amount" ? left.amount : String(left[sort.field] ?? "");
    const rightValue = sort.field === "amount" ? right.amount : String(right[sort.field] ?? "");
    const result = typeof leftValue === "number" && typeof rightValue === "number"
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), "fr");

    return sort.direction === "asc" ? result : -result;
  });
}

export function createPaymentInputFromInvoice(invoice: Invoice): CreatePaymentInput {
  const totals = getInvoiceTotals(invoice);
  const receivedAt = "2026-07-06T10:00:00.000Z";

  return Object.freeze({
    workspaceId: invoice.workspaceId,
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    customerName: invoice.customerName,
    companyId: invoice.companyId,
    contactId: invoice.contactId,
    opportunityId: invoice.opportunityId,
    method: "bank_transfer" as const,
    amount: totals.remaining,
    currency: invoice.currency,
    receivedAt,
    reference: `REG-${invoice.number}`,
    notes: `Paiement enregistré depuis ${invoice.number}.`,
    ownerId: invoice.ownerId,
    status: "recorded" as const
  });
}
