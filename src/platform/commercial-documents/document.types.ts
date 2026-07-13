export type CommercialDocumentId = string & { readonly __brand: "CommercialDocumentId" };
export type CommercialDocumentType =
  | "quote"
  | "invoice"
  | "sales-order"
  | "delivery-note"
  | "purchase-order"
  | "goods-receipt"
  | "supplier-invoice";

export type CommercialDocumentStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "confirmed"
  | "refused"
  | "expired"
  | "issued"
  | "partially_received"
  | "received"
  | "posted"
  | "paid"
  | "partially_paid"
  | "cancelled"
  | "overdue"
  | "archived";

export type CommercialDocumentPartyRole = "customer" | "supplier" | "company" | "contact";

export type CommercialDocumentParty = Readonly<{
  id?: string;
  name: string;
  role: CommercialDocumentPartyRole;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CommercialDocumentHeader = Readonly<{
  id?: CommercialDocumentId | string;
  type: CommercialDocumentType;
  number: string;
  issueDate: string;
  dueDate?: string;
  expirationDate?: string;
  currency: string;
  status: CommercialDocumentStatus;
  primaryParty: CommercialDocumentParty;
  secondaryParty?: CommercialDocumentParty;
  contactParty?: CommercialDocumentParty;
  reference?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CommercialDocumentDiscount = Readonly<{
  rate?: number;
  amount?: number;
}>;

export type CommercialDocumentTax = Readonly<{
  rate: number;
  amount?: number;
  code?: string;
}>;

export type CommercialDocumentLine = Readonly<{
  id: string;
  productId?: string;
  productSku?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: CommercialDocumentDiscount;
  tax?: CommercialDocumentTax;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CommercialDocumentLineSummary = Readonly<{
  lineId: string;
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}>;

export type CommercialDocumentTotals = Readonly<{
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
  currency: string;
  lines: readonly CommercialDocumentLineSummary[];
}>;

export type CommercialDocument = Readonly<{
  header: CommercialDocumentHeader;
  lines: readonly CommercialDocumentLine[];
  documentDiscount?: CommercialDocumentDiscount;
}>;

export type CommercialDocumentValidationIssue = Readonly<{
  code: string;
  message: string;
  path?: string;
}>;

export type CommercialDocumentValidationResult = Readonly<{
  valid: boolean;
  issues: readonly CommercialDocumentValidationIssue[];
}>;
