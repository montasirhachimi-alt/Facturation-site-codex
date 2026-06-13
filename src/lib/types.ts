export type Role =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "SALES"
  | "ACCOUNTANT"
  | "WAREHOUSE"
  | "READ_ONLY";

export type DocumentStatus =
  | "Brouillon"
  | "Envoyé"
  | "Accepté"
  | "Refusé"
  | "Payé"
  | "Partiellement payé"
  | "En retard";

export type SalesDocument = {
  type: "FACTURE" | "DEVIS" | "BON DE LIVRAISON" | "PROFORMA" | "AVOIR";
  number: string;
  date: string;
  customer: {
    name: string;
    address: string;
    city: string;
    ice: string;
    phone: string;
  };
  lines: Array<{
    designation: string;
    quantity: number;
    unitPrice: number;
    vat: number;
  }>;
  amountInWords: string;
};

export type StockProduct = {
  id: string;
  reference: string;
  designation: string;
  description: string;
  category: string;
  imageUrl: string;
  purchasePrice: number;
  salePrice: number;
  vat: number;
  stock: number;
  minStock: number;
};

export type StockMovementType = "Entrée" | "Sortie" | "Ajustement";

export type StockMovement = {
  id: string;
  productReference: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  reference?: string;
  date: string;
};

export type ClientDocumentType = "Devis" | "Facture";

export type ClientDocument = {
  id: string;
  clientId: string;
  number: string;
  type: ClientDocumentType;
  status: DocumentStatus;
  date: string;
  total: number;
  paid: number;
};

export type BusinessClient = {
  id: string;
  name: string;
  company: string;
  ice: string;
  taxId: string;
  rc: string;
  phone: string;
  email: string;
  address: string;
  city: string;
};

export type QuoteStatus = "Brouillon" | "Envoyé" | "Accepté" | "Refusé";

export type QuoteLine = {
  id: string;
  productId: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  vat: number;
  discount: number;
};

export type Quote = {
  id: string;
  number: string;
  date: string;
  clientId: string;
  status: QuoteStatus;
  lines: QuoteLine[];
};

export type InvoiceStatus = "Payée" | "Partiellement payée" | "En retard";

export type InvoiceLine = QuoteLine;

export type PaymentModeLabel = "Espèces" | "Chèque" | "Virement" | "Carte bancaire";

export type InvoicePayment = {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  mode: PaymentModeLabel;
  reference: string;
};

export type Invoice = {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  clientId: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  payments: InvoicePayment[];
};

export type TenantScope = {
  companyId: string;
  userId: string;
  role: Role;
};
