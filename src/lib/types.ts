export type Role =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "SALES"
  | "STOCK_MANAGER"
  | "ACCOUNTANT"
  | "HR"
  | "WAREHOUSE"
  | "READ_ONLY";

export type UserStatus = "active" | "disabled";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "export" | "print" | "approve";

export type PermissionModule =
  | "dashboard"
  | "quotes"
  | "invoices"
  | "delivery_notes"
  | "purchases"
  | "stock"
  | "clients"
  | "suppliers"
  | "cash"
  | "expenses"
  | "payments"
  | "reports"
  | "pdf_documents"
  | "hr"
  | "settings"
  | "users"
  | "assistant";

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
  companyId?: string;
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

export type Supplier = {
  id: string;
  companyId: string;
  name: string;
  contactName: string;
  ice: string;
  taxId: string;
  rc: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  balance: number;
};

export type CompanyProfile = {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  ice?: string;
  taxId?: string;
  rc?: string;
  logoUrl?: string;
  stampUrl?: string;
  signUrl?: string;
};

export type AppUser = {
  id: string;
  companyId: string | null;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
};

export type AuthSession = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
};

export type QuoteStatus = "Brouillon" | "Envoyé" | "Accepté" | "Refusé";

export type QuoteLine = {
  id: string;
  productId: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  vat: number;
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

export type DeliveryNoteStatus = "Brouillon" | "Validé" | "Livré" | "Annulé";

export type DeliveryNoteLine = {
  id: string;
  productId: string;
  reference: string;
  designation: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  unit: string;
  observations: string;
};

export type DeliveryNote = {
  id: string;
  companyId: string;
  number: string;
  date: string;
  status: DeliveryNoteStatus;
  internalReference: string;
  clientId: string;
  deliveryAddress: string;
  city: string;
  lines: DeliveryNoteLine[];
  deliveryTerms: string;
  internalNotes: string;
};

export type PurchaseStatus = "Brouillon" | "Validée" | "Partiellement payée" | "Payée" | "En retard";

export type PurchaseInvoiceLine = {
  id: string;
  productId: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  vat: number;
};

export type PurchaseInvoice = {
  id: string;
  companyId: string;
  number: string;
  date: string;
  dueDate: string;
  supplierId: string;
  status: PurchaseStatus;
  lines: PurchaseInvoiceLine[];
  paid: number;
};

export type CashEntryType = "Entrée" | "Sortie";

export type CashEntryCategory = "Vente" | "Achat" | "Dépense" | "Paiement client" | "Paiement fournisseur" | "Ajustement";

export type CashEntry = {
  id: string;
  companyId: string;
  date: string;
  type: CashEntryType;
  category: CashEntryCategory;
  label: string;
  amount: number;
  mode: PaymentModeLabel;
  reference: string;
};

export type EmployeeStatus = "actif" | "suspendu" | "quitté";
export type ContractType = "CDI" | "CDD" | "stage" | "freelance";
export type HrRequestStatus = "en attente" | "validé" | "refusé";

export type Employee = {
  id: string;
  companyId: string;
  photoUrl: string;
  firstName: string;
  lastName: string;
  cin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  birthDate: string;
  hireDate: string;
  position: string;
  department: string;
  contractType: ContractType;
  baseSalary: number;
  status: EmployeeStatus;
};

export type EmployeeContract = {
  id: string;
  companyId: string;
  employeeId: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  salary: number;
  position: string;
  signedFileUrl: string;
};

export type Attendance = {
  id: string;
  companyId: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  lateMinutes: number;
  workedHours: number;
};

export type HrLeave = {
  id: string;
  companyId: string;
  employeeId: string;
  type: "absence" | "congé";
  reason: string;
  startDate: string;
  endDate: string;
  days: number;
  status: HrRequestStatus;
  balance: number;
};

export type SalarySlip = {
  id: string;
  companyId: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  bonuses: number;
  advances: number;
  deductions: number;
  unpaidAbsences: number;
  netSalary: number;
};

export type SalaryAdvance = {
  id: string;
  companyId: string;
  employeeId: string;
  amount: number;
  date: string;
  mode: PaymentModeLabel;
  deducted: boolean;
};

export type HrDocument = {
  id: string;
  companyId: string;
  employeeId: string;
  type: "CIN" | "Contrat" | "Attestation de travail" | "Certificat de salaire" | "Document scanné";
  title: string;
  fileUrl: string;
  issuedAt: string;
};

export type TenantScope = {
  companyId: string;
  userId: string;
  role: Role;
};
