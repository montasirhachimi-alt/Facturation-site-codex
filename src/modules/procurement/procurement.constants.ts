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
  received: "Reçue",
  cancelled: "Annulée",
  archived: "Archivée"
} as const;

export const GOODS_RECEIPT_STATUS_LABELS = {
  draft: "Brouillon",
  posted: "Posté",
  cancelled: "Annulé",
  archived: "Archivé"
} as const;

export const SUPPLIER_STATUS_LABELS = {
  active: "Actif",
  archived: "Archivé"
} as const;
