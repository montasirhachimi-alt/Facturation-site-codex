import type { UserId, WorkspaceId } from "@/modules/sales/quotes";

export const SALES_ORDERS_WORKSPACE_ID = "sales-orders-main" as WorkspaceId;
export const SALES_ORDERS_USER_ID = "user-sales-orders" as UserId;

export const SALES_ORDER_STATUS_LABELS = {
  draft: "Brouillon",
  confirmed: "Confirmée",
  partially_reserved: "Partiellement réservée",
  reserved: "Réservée",
  cancelled: "Annulée",
  archived: "Archivée",
  partially_delivered: "Partiellement livrée",
  delivered: "Livrée"
} as const;

export const SALES_ORDER_RESERVATION_LABELS = {
  not_applicable: "Non applicable",
  not_reserved: "Non réservée",
  partially_reserved: "Partiellement réservée",
  reserved: "Réservée",
  released: "Libérée"
} as const;
