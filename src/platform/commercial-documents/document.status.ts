import type { CommercialDocumentStatus, CommercialDocumentType } from "./document.types";

export type CommercialDocumentStatusDefinition = Readonly<{
  status: CommercialDocumentStatus;
  label: string;
  terminal?: boolean;
}>;

const COMMON_STATUSES = Object.freeze([
  { status: "draft", label: "Brouillon" },
  { status: "cancelled", label: "Annule", terminal: true },
  { status: "archived", label: "Archive", terminal: true }
]) satisfies readonly CommercialDocumentStatusDefinition[];

const STATUS_BY_TYPE: Readonly<Record<CommercialDocumentType, readonly CommercialDocumentStatusDefinition[]>> = Object.freeze({
  quote: Object.freeze([
    ...COMMON_STATUSES,
    { status: "sent", label: "Envoye" },
    { status: "accepted", label: "Accepte", terminal: true },
    { status: "refused", label: "Refuse", terminal: true },
    { status: "expired", label: "Expire", terminal: true }
  ]) satisfies readonly CommercialDocumentStatusDefinition[],
  invoice: Object.freeze([
    ...COMMON_STATUSES,
    { status: "issued", label: "Emise" },
    { status: "partially_paid", label: "Partiellement payee" },
    { status: "paid", label: "Payee", terminal: true },
    { status: "overdue", label: "En retard" }
  ]) satisfies readonly CommercialDocumentStatusDefinition[],
  "sales-order": Object.freeze([
    ...COMMON_STATUSES,
    { status: "confirmed", label: "Confirmee" },
    { status: "partially_reserved", label: "Partiellement reservee" },
    { status: "reserved", label: "Reservee" },
    { status: "partially_delivered", label: "Partiellement livree" },
    { status: "delivered", label: "Livree", terminal: true }
  ]) satisfies readonly CommercialDocumentStatusDefinition[],
  "delivery-note": Object.freeze([
    ...COMMON_STATUSES,
    { status: "posted", label: "Poste", terminal: true }
  ]) satisfies readonly CommercialDocumentStatusDefinition[],
  "purchase-order": Object.freeze([
    ...COMMON_STATUSES,
    { status: "sent", label: "Envoyee" },
    { status: "confirmed", label: "Confirmee" },
    { status: "partially_received", label: "Partiellement recue" },
    { status: "received", label: "Recue", terminal: true }
  ]) satisfies readonly CommercialDocumentStatusDefinition[],
  "goods-receipt": Object.freeze([
    ...COMMON_STATUSES,
    { status: "posted", label: "Poste", terminal: true }
  ]) satisfies readonly CommercialDocumentStatusDefinition[],
  "supplier-invoice": COMMON_STATUSES
});

export function listDocumentStatuses(type: CommercialDocumentType) {
  return STATUS_BY_TYPE[type] ?? COMMON_STATUSES;
}

export function isDocumentStatusSupported(type: CommercialDocumentType, status: CommercialDocumentStatus) {
  return listDocumentStatuses(type).some((definition) => definition.status === status);
}
