import type { WorkspaceId } from "@/modules/products";
import type { ProcurementUserId } from "./procurement.types";

export const PROCUREMENT_WORKSPACE_ID = "procurement-main" as WorkspaceId;
export const PROCUREMENT_USER_ID = "user-procurement" as ProcurementUserId;
export const DEFAULT_SUPPLIER_COUNTRY = "Maroc";
export const DEFAULT_PROCUREMENT_CURRENCY = "MAD";

export const PURCHASE_ORDER_STATUS_LABELS = {
  draft: "Brouillon",
  sent: "Envoyée",
  confirmed: "Confirmée",
  partially_received: "Partiellement reçue",
  received: "Totalement reçue",
  cancelled: "Annulée",
  archived: "Archivée"
} as const;

export const GOODS_RECEIPT_STATUS_LABELS = {
  draft: "Brouillon",
  posted: "Posté",
  cancelled: "Annulé",
  archived: "Archivé"
} as const;

export const SUPPLIER_BILL_STATUS_LABELS = {
  draft: "Brouillon",
  finalized: "Finalisée",
  accounted: "Comptabilisée",
  cancelled: "Annulée",
  archived: "Archivée"
} as const;

export const SUPPLIER_PAYMENT_STATUS_LABELS = {
  draft: "Brouillon",
  finalized: "Finalisé",
  accounted: "Comptabilisé",
  cancelled: "Annulé",
  archived: "Archivé"
} as const;

export const SUPPLIER_PAYMENT_METHOD_LABELS = {
  bank_transfer: "Virement bancaire",
  cash: "Espèces",
  card: "Carte",
  cheque: "Chèque",
  other: "Autre"
} as const;

export const SUPPLIER_BILL_PAYMENT_STATUS_LABELS = {
  unpaid: "Non payé",
  partially_paid: "Partiellement payé",
  paid: "Payé"
} as const;

export const SUPPLIER_STATUS_LABELS = {
  active: "Actif",
  archived: "Archivé"
} as const;
