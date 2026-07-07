import { invoiceService } from "@/modules/sales/invoices";
import type { Invoice, InvoiceId } from "@/modules/sales/invoices";
import { getInvoiceTotals } from "@/modules/sales/invoices";
import type { WorkspaceId } from "@/modules/sales/quotes";
import { DEFAULT_PAYMENT_SORT } from "./payment.constants";
import type { CreatePaymentInput, Payment, PaymentFilters, PaymentId, PaymentListResult, PaymentSort, UpdatePaymentInput } from "./payment.types";
import { createPaymentInputFromInvoice, matchesPaymentSearch, sortPayments } from "./payment.utils";

export class PaymentService {
  private readonly payments = new Map<PaymentId, Payment>();

  constructor(options: { seed?: readonly Payment[] } = {}) {
    for (const payment of options.seed ?? []) {
      this.payments.set(payment.id, freezePayment(payment));
    }
  }

  listPayments(filters: PaymentFilters, sort: PaymentSort = DEFAULT_PAYMENT_SORT): PaymentListResult {
    const payments = [...this.payments.values()]
      .filter((payment) => payment.workspaceId === filters.workspaceId)
      .filter((payment) => filters.includeArchived || !payment.archivedAt)
      .filter((payment) => !filters.query || matchesPaymentSearch(payment, filters.query))
      .filter((payment) => !filters.status || filters.status === "all" || payment.status === filters.status)
      .filter((payment) => !filters.method || filters.method === "all" || payment.method === filters.method)
      .filter((payment) => !filters.companyId || filters.companyId === "all" || payment.companyId === filters.companyId)
      .filter((payment) => !filters.invoiceId || filters.invoiceId === "all" || payment.invoiceId === filters.invoiceId);

    const sorted = sortPayments(payments, sort);
    return Object.freeze({ payments: sorted, total: sorted.length });
  }

  getPayment(id: PaymentId, workspaceId: WorkspaceId) {
    const payment = this.payments.get(id);
    return payment?.workspaceId === workspaceId ? payment : undefined;
  }

  listPaymentsForInvoice(invoiceId: InvoiceId, workspaceId: WorkspaceId) {
    return this.listPayments({ workspaceId, invoiceId }).payments;
  }

  createPayment(input: CreatePaymentInput) {
    const now = "2026-07-06T10:00:00.000Z";
    const payment = freezePayment({
      id: `payment-${Date.now()}` as PaymentId,
      workspaceId: input.workspaceId,
      number: `REG-2026-${String(this.payments.size + 1).padStart(3, "0")}`,
      invoiceId: input.invoiceId,
      invoiceNumber: input.invoiceNumber,
      customerName: input.customerName.trim(),
      companyId: input.companyId,
      contactId: input.contactId,
      opportunityId: input.opportunityId,
      status: input.status ?? "recorded",
      method: input.method,
      amount: input.amount,
      currency: input.currency,
      receivedAt: input.receivedAt,
      reference: input.reference?.trim(),
      notes: input.notes?.trim(),
      ownerId: input.ownerId,
      createdAt: now,
      updatedAt: now
    });

    this.payments.set(payment.id, payment);
    this.syncInvoicePaidAmount(payment.invoiceId, payment.workspaceId);
    return payment;
  }

  createFromInvoice(invoice: Invoice) {
    const totals = getInvoiceTotals(invoice);
    if (totals.remaining <= 0) return undefined;
    return this.createPayment(createPaymentInputFromInvoice(invoice));
  }

  updatePayment(id: PaymentId, workspaceId: WorkspaceId, input: UpdatePaymentInput) {
    const existing = this.getPayment(id, workspaceId);
    if (!existing) return undefined;

    const updated = freezePayment({ ...existing, ...input, updatedAt: "2026-07-06T10:30:00.000Z" });
    this.payments.set(updated.id, updated);
    this.syncInvoicePaidAmount(updated.invoiceId, updated.workspaceId);
    return updated;
  }

  archivePayment(id: PaymentId, workspaceId: WorkspaceId) {
    const existing = this.getPayment(id, workspaceId);
    if (!existing) return undefined;

    const updated = freezePayment({
      ...existing,
      status: "cancelled",
      archivedAt: "2026-07-06T10:30:00.000Z",
      updatedAt: "2026-07-06T10:30:00.000Z"
    });
    this.payments.set(updated.id, updated);
    this.syncInvoicePaidAmount(updated.invoiceId, updated.workspaceId);
    return updated;
  }

  private syncInvoicePaidAmount(invoiceId: InvoiceId, workspaceId: WorkspaceId) {
    const invoice = invoiceService.getInvoice(invoiceId, workspaceId);
    if (!invoice) return;

    const paidAmount = this.listPaymentsForInvoice(invoiceId, workspaceId)
      .filter((payment) => payment.status !== "cancelled")
      .reduce((total, payment) => total + payment.amount, 0);
    const totals = getInvoiceTotals(invoice);
    const nextPaidAmount = Math.min(paidAmount, totals.total);
    const nextStatus = nextPaidAmount >= totals.total ? "paid" : nextPaidAmount > 0 ? "partially_paid" : invoice.status;

    invoiceService.updateInvoice(invoiceId, workspaceId, {
      paidAmount: nextPaidAmount,
      status: nextStatus
    });
  }
}

export function freezePayment(payment: Payment): Payment {
  return Object.freeze({ ...payment });
}
