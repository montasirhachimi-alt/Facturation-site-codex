import type { Quote, QuoteId, WorkspaceId } from "@/modules/sales/quotes";
import { DEFAULT_INVOICE_SORT } from "./invoice.constants";
import type { CreateInvoiceInput, Invoice, InvoiceFilters, InvoiceId, InvoiceListResult, InvoiceSort, UpdateInvoiceInput } from "./invoice.types";
import { createInvoiceInputFromQuote, matchesInvoiceSearch, sortInvoices } from "./invoice.utils";

export class InvoiceService {
  private readonly invoices = new Map<InvoiceId, Invoice>();

  constructor(options: { seed?: readonly Invoice[] } = {}) {
    for (const invoice of options.seed ?? []) {
      this.invoices.set(invoice.id, freezeInvoice(invoice));
    }
  }

  listInvoices(filters: InvoiceFilters, sort: InvoiceSort = DEFAULT_INVOICE_SORT): InvoiceListResult {
    const invoices = [...this.invoices.values()]
      .filter((invoice) => invoice.workspaceId === filters.workspaceId)
      .filter((invoice) => filters.includeArchived || !invoice.archivedAt)
      .filter((invoice) => !filters.query || matchesInvoiceSearch(invoice, filters.query))
      .filter((invoice) => !filters.status || filters.status === "all" || invoice.status === filters.status)
      .filter((invoice) => !filters.companyId || filters.companyId === "all" || invoice.companyId === filters.companyId)
      .filter((invoice) => !filters.contactId || filters.contactId === "all" || invoice.contactId === filters.contactId)
      .filter((invoice) => !filters.quoteId || filters.quoteId === "all" || invoice.quoteId === filters.quoteId);

    const sorted = sortInvoices(invoices, sort);
    return Object.freeze({ invoices: sorted, total: sorted.length });
  }

  getInvoice(id: InvoiceId, workspaceId: WorkspaceId) {
    const invoice = this.invoices.get(id);
    return invoice?.workspaceId === workspaceId ? invoice : undefined;
  }

  getInvoiceByQuote(quoteId: QuoteId, workspaceId: WorkspaceId) {
    return [...this.invoices.values()].find((invoice) => invoice.workspaceId === workspaceId && invoice.quoteId === quoteId);
  }

  createInvoice(input: CreateInvoiceInput) {
    const now = "2026-07-03T11:00:00.000Z";
    const invoice = freezeInvoice({
      id: `invoice-${Date.now()}` as InvoiceId,
      workspaceId: input.workspaceId,
      number: `FAC-2026-${String(this.invoices.size + 1).padStart(3, "0")}`,
      customerName: input.customerName.trim(),
      companyId: input.companyId,
      contactId: input.contactId,
      opportunityId: input.opportunityId,
      quoteId: input.quoteId,
      status: input.status ?? "draft",
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency,
      items: input.items,
      discountRate: input.discountRate,
      notes: input.notes?.trim(),
      ownerId: input.ownerId,
      paidAmount: input.paidAmount ?? 0,
      createdAt: now,
      updatedAt: now
    });
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  createFromQuote(quote: Quote) {
    const existing = this.getInvoiceByQuote(quote.id, quote.workspaceId);
    if (existing) return existing;
    return this.createInvoice(createInvoiceInputFromQuote(quote));
  }

  updateInvoice(id: InvoiceId, workspaceId: WorkspaceId, input: UpdateInvoiceInput) {
    const existing = this.getInvoice(id, workspaceId);
    if (!existing) return undefined;
    const updated = freezeInvoice({ ...existing, ...input, updatedAt: "2026-07-03T11:30:00.000Z" });
    this.invoices.set(updated.id, updated);
    return updated;
  }

  archiveInvoice(id: InvoiceId, workspaceId: WorkspaceId) {
    return this.updateInvoice(id, workspaceId, { status: "cancelled", notes: "Facture archivée." }) ;
  }
}

export function freezeInvoice(invoice: Invoice): Invoice {
  return Object.freeze({
    ...invoice,
    items: Object.freeze(invoice.items.map((item) => Object.freeze({ ...item })))
  });
}
