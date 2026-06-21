import type { BusinessClient, CompanyProfile, Quote } from "@/lib/types";
import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";
import { toRecipient } from "@/components/pdf-templates/InvoicePdfTemplate";

export function QuotePdfTemplate(quote: Quote, client: BusinessClient, company?: CompanyProfile): PdfLayoutDocument {
  return {
    title: "DEVIS",
    number: quote.number,
    date: quote.date,
    status: quote.status,
    recipient: toRecipient("CLIENT", client),
    lines: quote.lines.map((line) => ({
      reference: line.reference || line.productId,
      designation: line.designation,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vat: line.vat
    })),
    paymentTerms: "Ce devis est valable 30 jours. Paiement selon conditions convenues à la validation.",
    filename: quote.number,
    company
  };
}

