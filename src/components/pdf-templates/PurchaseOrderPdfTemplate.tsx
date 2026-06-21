import type { CompanyProfile, SalesDocument } from "@/lib/types";
import type { PdfDocumentTitle, PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";

export function PurchaseOrderPdfTemplate(document: SalesDocument, company?: CompanyProfile): PdfLayoutDocument {
  return typedSalesTemplate(document, "BON DE COMMANDE", company);
}

export function ProformaPdfTemplate(document: SalesDocument, company?: CompanyProfile): PdfLayoutDocument {
  return typedSalesTemplate(document, "FACTURE PROFORMA", company);
}

export function CreditNotePdfTemplate(document: SalesDocument, company?: CompanyProfile): PdfLayoutDocument {
  return typedSalesTemplate(document, "AVOIR", company);
}

export function typedSalesTemplate(document: SalesDocument, title: PdfDocumentTitle, company?: CompanyProfile): PdfLayoutDocument {
  return {
    title,
    number: document.number,
    date: document.date,
    recipient: {
      label: "CLIENT",
      name: document.customer.name,
      company: document.customer.name,
      address: document.customer.address,
      city: document.customer.city,
      ice: document.customer.ice,
      phone: document.customer.phone
    },
    lines: document.lines.map((line, index) => ({
      reference: `REF-${String(index + 1).padStart(3, "0")}`,
      designation: line.designation,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vat: line.vat
    })),
    amountInWords: document.amountInWords,
    paymentTerms: "Document établi selon les conditions commerciales convenues.",
    filename: document.number,
    company
  };
}

