import type { DeliveryNoteStatus } from "./delivery-note.types";
import type { UserId, WorkspaceId } from "@/modules/sales/quotes";

export const DELIVERY_NOTES_WORKSPACE_ID = "sales-delivery-notes-main" as WorkspaceId;
export const DELIVERY_NOTES_USER_ID = "user-current" as UserId;

export const DELIVERY_NOTE_STATUS_LABELS: Readonly<Record<DeliveryNoteStatus, string>> = Object.freeze({
  draft: "Brouillon",
  posted: "Posté",
  archived: "Archivé"
});
