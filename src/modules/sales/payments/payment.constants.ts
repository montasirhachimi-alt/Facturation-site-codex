import type { PaymentMethod, PaymentSort, PaymentStatus } from "./payment.types";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = Object.freeze({
  draft: "Brouillon",
  recorded: "Enregistré",
  reconciled: "Rapproché",
  cancelled: "Annulé"
});

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = Object.freeze({
  bank_transfer: "Virement",
  cash: "Espèces",
  card: "Carte bancaire",
  cheque: "Chèque",
  other: "Autre"
});

export const DEFAULT_PAYMENT_SORT: PaymentSort = Object.freeze({
  field: "receivedAt",
  direction: "desc"
});
