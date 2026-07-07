import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import type { OpportunityId } from "@/modules/crm/opportunities";
import type { InvoiceId } from "@/modules/sales/invoices";
import type { QuoteCurrency, UserId, WorkspaceId } from "@/modules/sales/quotes";

export type PaymentId = string & { readonly __brand: "PaymentId" };

export type PaymentStatus = "draft" | "recorded" | "reconciled" | "cancelled";
export type PaymentMethod = "bank_transfer" | "cash" | "card" | "cheque" | "other";

export type Payment = Readonly<{
  id: PaymentId;
  workspaceId: WorkspaceId;
  number: string;
  invoiceId: InvoiceId;
  invoiceNumber: string;
  customerName: string;
  companyId: CompanyId;
  contactId?: ContactId;
  opportunityId?: OpportunityId;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  currency: QuoteCurrency;
  receivedAt: string;
  reference?: string;
  notes?: string;
  ownerId: UserId;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type CreatePaymentInput = Readonly<Omit<Payment, "id" | "number" | "status" | "createdAt" | "updatedAt"> & {
  status?: PaymentStatus;
}>;

export type UpdatePaymentInput = Readonly<Partial<Pick<Payment, "status" | "method" | "receivedAt" | "reference" | "notes">>>;

export type PaymentFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: PaymentStatus | "all";
  method?: PaymentMethod | "all";
  companyId?: CompanyId | "all";
  invoiceId?: InvoiceId | "all";
  includeArchived?: boolean;
}>;

export type PaymentSort = Readonly<{
  field: "number" | "invoiceNumber" | "customerName" | "status" | "method" | "receivedAt" | "amount" | "ownerId";
  direction: "asc" | "desc";
}>;

export type PaymentListResult = Readonly<{
  payments: readonly Payment[];
  total: number;
}>;
