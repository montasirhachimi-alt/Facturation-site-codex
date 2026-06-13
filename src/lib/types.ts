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

export type TenantScope = {
  companyId: string;
  userId: string;
  role: Role;
};
