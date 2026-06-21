import type { BusinessClient, CompanyProfile, DeliveryNote } from "@/lib/types";
import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";
import { toRecipient } from "@/components/pdf-templates/InvoicePdfTemplate";

export function DeliveryNotePdfTemplate(deliveryNote: DeliveryNote, client: BusinessClient, company?: CompanyProfile): PdfLayoutDocument {
  return {
    title: "BON DE LIVRAISON",
    number: deliveryNote.number,
    date: deliveryNote.date,
    status: deliveryNote.status,
    internalReference: deliveryNote.internalReference,
    recipient: {
      ...toRecipient("CLIENT", client),
      address: deliveryNote.deliveryAddress,
      city: deliveryNote.city
    },
    lines: deliveryNote.lines.map((line) => ({
      reference: line.reference,
      designation: `${line.designation}${line.observations ? ` - ${line.observations}` : ""}`,
      quantity: line.deliveredQuantity,
      unitPrice: 0,
      vat: 0
    })),
    paymentTerms: deliveryNote.deliveryTerms || "Livraison selon accord commercial.",
    notes: deliveryNote.internalNotes,
    deliverySummary: {
      totalItems: deliveryNote.lines.length,
      totalDelivered: deliveryNote.lines.reduce((sum, line) => sum + line.deliveredQuantity, 0)
    },
    filename: deliveryNote.number,
    company
  };
}

