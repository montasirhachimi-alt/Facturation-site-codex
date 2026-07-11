import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import type { CustomerId } from "@/modules/crm/customers";
import type { OpportunityId } from "@/modules/crm/opportunities";

export type QuoteId = string & { readonly __brand: "QuoteId" };
export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type UserId = string & { readonly __brand: "UserId" };

export type QuoteStatus = "draft" | "sent" | "accepted" | "refused" | "expired";
export type QuoteCurrency = "MAD" | "EUR" | "USD";

export type QuoteItem = Readonly<{
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}>;

export type Quote = Readonly<{
  id: QuoteId;
  workspaceId: WorkspaceId;
  number: string;
  customerId?: CustomerId;
  customerName: string;
  companyId: CompanyId;
  companyName?: string;
  contactId?: ContactId;
  contactName?: string;
  opportunityId?: OpportunityId;
  opportunityName?: string;
  status: QuoteStatus;
  issueDate: string;
  expirationDate: string;
  validityDays?: number;
  currency: QuoteCurrency;
  items: readonly QuoteItem[];
  discountRate: number;
  notes?: string;
  ownerId: UserId;
  createdAt: string;
  updatedAt: string;
}>;

export type QuoteTotals = Readonly<{
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: QuoteCurrency;
}>;

export type CreateQuoteInput = Readonly<{
  workspaceId: WorkspaceId;
  customerId?: CustomerId;
  customerName: string;
  companyId: CompanyId;
  companyName?: string;
  contactId?: ContactId;
  contactName?: string;
  opportunityId?: OpportunityId;
  opportunityName?: string;
  validityDays: number;
  currency: QuoteCurrency;
  items: readonly QuoteItem[];
  discountRate?: number;
  notes?: string;
  ownerId: UserId;
}>;

export type QuoteFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: QuoteStatus | "all";
  companyId?: CompanyId | "all";
  opportunityId?: OpportunityId | "all";
}>;

export type QuoteSort = Readonly<{
  field: "number" | "customerName" | "status" | "issueDate" | "expirationDate" | "total" | "ownerId";
  direction: "asc" | "desc";
}>;

export type QuoteListResult = Readonly<{
  quotes: readonly Quote[];
  total: number;
}>;
