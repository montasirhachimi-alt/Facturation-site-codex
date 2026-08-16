import type { UserId, WorkspaceId } from "@/modules/sales/quotes";
import type { ShipmentStatus, ShipmentTimelineStep } from "./shipment.types";

export const SHIPMENTS_WORKSPACE_ID = "sales-shipments-main" as WorkspaceId;
export const SHIPMENTS_USER_ID = "user-current" as UserId;

export const SHIPMENT_STATUS_LABELS: Readonly<Record<ShipmentStatus, string>> = Object.freeze({
  draft: "Brouillon",
  ready: "Prêt",
  shipped: "Expédié",
  in_transit: "En transit",
  delivered: "Livré",
  cancelled: "Annulé"
});

export const SHIPMENT_STATUS_BADGE_CLASSNAMES: Readonly<Record<ShipmentStatus, string>> = Object.freeze({
  draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  ready: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  shipped: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  in_transit: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
});

export const SHIPMENT_TIMELINE_STEPS = Object.freeze([
  { status: "draft", label: "Brouillon", description: "L'expédition est préparée depuis le bon de livraison." },
  { status: "ready", label: "Prêt", description: "Le colis est prêt à être remis au transporteur." },
  { status: "shipped", label: "Expédié", description: "La livraison a quitté l'entrepôt." },
  { status: "in_transit", label: "En transit", description: "Le transporteur a pris en charge l'acheminement." },
  { status: "delivered", label: "Livré", description: "La livraison est terminée côté logistique." }
] satisfies readonly ShipmentTimelineStep[]);
