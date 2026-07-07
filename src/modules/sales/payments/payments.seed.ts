import { SALES_QUOTES_USER_ID, SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes";
import type { Payment, PaymentId } from "./payment.types";

export const paymentSeed: readonly Payment[] = Object.freeze([
  {
    id: "payment-reg-2026-001" as PaymentId,
    workspaceId: SALES_QUOTES_WORKSPACE_ID,
    number: "REG-2026-001",
    invoiceId: "invoice-fac-2026-002" as never,
    invoiceNumber: "FAC-2026-002",
    customerName: "Al Hikma Clinic",
    companyId: "company-alhikma" as never,
    contactId: "contact-sara" as never,
    opportunityId: "opportunity-alhikma-renewal" as never,
    status: "recorded",
    method: "bank_transfer",
    amount: 50000,
    currency: "MAD",
    receivedAt: "2026-07-04T14:00:00.000Z",
    reference: "VIR-ALHIKMA-2026-07",
    notes: "Acompte reçu et relié à la facture commerciale.",
    ownerId: SALES_QUOTES_USER_ID,
    createdAt: "2026-07-04T14:00:00.000Z",
    updatedAt: "2026-07-04T14:00:00.000Z"
  }
]);
