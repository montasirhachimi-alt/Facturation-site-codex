import type { CompanyProfile } from "@/lib/types";

export type PdfDocumentTitle =
  | "FACTURE"
  | "DEVIS"
  | "BON DE LIVRAISON"
  | "BON DE COMMANDE"
  | "FACTURE PROFORMA"
  | "AVOIR"
  | "CONTRAT DE TRAVAIL"
  | "FICHE DE PAIE"
  | "RAPPORT RH";

export type PdfParty = {
  label: string;
  name: string;
  company?: string;
  address?: string;
  city?: string;
  ice?: string;
  phone?: string;
  email?: string;
};

export type PdfLineItem = {
  reference: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  vat: number;
};

export type PdfLayoutDocument = {
  title: PdfDocumentTitle;
  number: string;
  date: string;
  dueDate?: string;
  status?: string;
  internalReference?: string;
  currency?: string;
  recipient: PdfParty;
  lines: PdfLineItem[];
  paidAmount?: number;
  discount?: number;
  totals?: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paid?: number;
    remaining?: number;
  };
  amountInWords?: string;
  paymentTerms?: string;
  notes?: string;
  filename?: string;
  company?: CompanyProfile;
  deliverySummary?: {
    totalItems: number;
    totalDelivered: number;
  };
  hideFinancials?: boolean;
};

export const pdfTheme = {
  navy: [10, 30, 63] as const,
  blue: [13, 110, 253] as const,
  lightBlue: [230, 242, 255] as const,
  ink: [28, 38, 56] as const,
  muted: [93, 111, 136] as const,
  border: [214, 226, 241] as const,
  zebra: [248, 251, 255] as const,
  white: [255, 255, 255] as const
};

export function PdfLayout({ document }: { document: PdfLayoutDocument }) {
  void document;
  return null;
}
