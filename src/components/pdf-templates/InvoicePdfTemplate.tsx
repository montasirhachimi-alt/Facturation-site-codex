import type { BusinessClient, CompanyProfile, Invoice } from "@/lib/types";
import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";

export function InvoicePdfTemplate(invoice: Invoice, client: BusinessClient, company?: CompanyProfile): PdfLayoutDocument {
  return {
    title: "FACTURE",
    number: invoice.number,
    date: invoice.date,
    dueDate: invoice.dueDate,
    status: invoice.status,
    recipient: toRecipient("CLIENT", client),
    lines: invoice.lines.map((line) => ({
      reference: line.reference || line.productId,
      designation: line.designation,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vat: line.vat
    })),
    paidAmount: invoice.payments.reduce((sum, payment) => sum + payment.amount, 0),
    paymentTerms: "Paiement par virement, chèque ou espèces. Merci d'indiquer le numéro de facture comme référence.",
    filename: invoice.number,
    company
  };
}

export function toRecipient(label: string, client: BusinessClient) {
  return {
    label,
    name: client.name,
    company: client.company,
    address: client.address,
    city: client.city,
    ice: client.ice,
    phone: client.phone,
    email: client.email
  };
}

