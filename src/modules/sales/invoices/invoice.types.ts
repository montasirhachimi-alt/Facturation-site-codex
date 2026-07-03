import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import type { OpportunityId } from "@/modules/crm/opportunities";
import type { QuoteCurrency, QuoteId, QuoteItem, UserId, WorkspaceId } from "@/modules/sales/quotes";

export type InvoiceId = string & { readonly __brand: "InvoiceId" };

export type InvoiceStatus = "draft" | "issued" | "paid" | "partially_paid" | "cancelled" | "overdue";

export type Invoice = Readonly<{
  id: InvoiceId;
  workspaceId: WorkspaceId;
  number: string;
  customerName: string;
  companyId: CompanyId;
  contactId?: ContactId;
  opportunityId?: OpportunityId;
  quoteId?: QuoteId;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: QuoteCurrency;
  items: readonly QuoteItem[];
  discountRate: number;
  notes?: string;
  ownerId: UserId;
  paidAmount: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type InvoiceTotals = Readonly<{
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  remaining: number;
  currency: QuoteCurrency;
}>;

export type CreateInvoiceInput = Readonly<Omit<Invoice, "id" | "number" | "status" | "paidAmount" | "createdAt" | "updatedAt"> & {
  status?: InvoiceStatus;
  paidAmount?: number;
}>;

export type UpdateInvoiceInput = Readonly<Partial<Pick<Invoice, "status" | "dueDate" | "notes" | "paidAmount">>>;

export type InvoiceFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: InvoiceStatus | "all";
  companyId?: CompanyId | "all";
  contactId?: ContactId | "all";
  quoteId?: QuoteId | "all";
  includeArchived?: boolean;
}>;

export type InvoiceSort = Readonly<{
  field: "number" | "customerName" | "status" | "issueDate" | "dueDate" | "total" | "ownerId";
  direction: "asc" | "desc";
}>;

export type InvoiceListResult = Readonly<{
  invoices: readonly Invoice[];
  total: number;
}>;
