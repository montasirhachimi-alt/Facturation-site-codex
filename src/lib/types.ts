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

export type TenantScope = {
  companyId: string;
  userId: string;
  role: Role;
};
