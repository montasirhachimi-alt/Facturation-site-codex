import type { StockMovement } from "@/modules/inventory/inventory.types";
import type { DeliveryNote } from "@/modules/sales/delivery-notes/delivery-note.types";
import type { SalesOrder } from "@/modules/sales/orders/order.types";
import type { TimelineEvent, TimelineQuery } from "@/runtime/timeline";
import {
  createInventoryTimelineEventId,
  createInventoryTimelineLink,
  isCanonicalDate,
  isLaterThan,
  sumQuantities
} from "./inventory-timeline.utils";
import type { InventoryTimelineEntityType, InventoryTimelineSourceType } from "./inventory-timeline.types";

export function mapReservationTimelineEvents(rootType: InventoryTimelineEntityType, query: TimelineQuery, movement: StockMovement): readonly TimelineEvent[] {
  const eventType = movement.type === "RESERVATION" ? "inventory.reservation.created" : "inventory.reservation.released";
  const title = movement.type === "RESERVATION" ? "Réservation créée" : "Réservation libérée";
  const description = `${formatQuantity(movement.quantity)} unités · ${movement.reference ?? movement.referenceId ?? "Inventaire"}`;

  return freezeEvents([
    createEvent(rootType, query, "inventory.reservation", movement.id, movement.id, eventType, movement.postedAt ?? movement.createdAt, title, description, movement.type === "RESERVATION" ? "warning" : "neutral", {
      movementId: movement.id,
      movementType: movement.type,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      productId: movement.productId,
      warehouseId: movement.toWarehouseId ?? movement.fromWarehouseId,
      quantity: movement.quantity
    })
  ]);
}

export function mapDeliveryNoteTimelineEvents(
  rootType: InventoryTimelineEntityType,
  query: TimelineQuery,
  note: DeliveryNote,
  order: SalesOrder | undefined,
  deliveryIndex: number,
  postedDeliveryCount: number
): readonly TimelineEvent[] {
  const quantity = sumQuantities(note.lines.map((line) => line.quantityPosted || line.quantityToDeliver));
  const deliveryProgressEvent = createDeliveryProgressEvent(rootType, query, note, order, deliveryIndex, postedDeliveryCount, quantity);

  return freezeEvents([
    createEvent(rootType, query, "delivery.note", note.id, note.number, "delivery.note.created", note.createdAt, `Bon de livraison ${note.number} créé`, `${note.salesOrderNumber} · ${note.warehouseName}`, "info", {
      deliveryNoteId: note.id,
      deliveryNoteNumber: note.number,
      salesOrderId: note.salesOrderId,
      warehouseId: note.warehouseId,
      quantityPlanned: sumQuantities(note.lines.map((line) => line.quantityToDeliver))
    }),
    isLaterThan(note.updatedAt, note.createdAt)
      ? createEvent(rootType, query, "delivery.note", note.id, note.number, "delivery.note.updated", note.updatedAt, `Bon de livraison ${note.number} mis à jour`, note.salesOrderNumber, "neutral", {
          deliveryNoteId: note.id,
          salesOrderId: note.salesOrderId
        })
      : undefined,
    note.status === "posted" && note.postedAt
      ? createEvent(rootType, query, "delivery.note", note.id, note.number, "delivery.note.posted", note.postedAt, `Bon de livraison ${note.number} posté`, `${formatQuantity(quantity)} unités livrées physiquement.`, "success", {
          deliveryNoteId: note.id,
          deliveryNoteNumber: note.number,
          salesOrderId: note.salesOrderId,
          warehouseId: note.warehouseId,
          quantityDelivered: quantity
        })
      : undefined,
    deliveryProgressEvent,
    note.status === "archived" && note.archivedAt
      ? createEvent(rootType, query, "delivery.note", note.id, note.number, "delivery.note.cancelled", note.archivedAt, `Bon de livraison ${note.number} archivé`, note.salesOrderNumber, "danger", {
          deliveryNoteId: note.id,
          salesOrderId: note.salesOrderId
        })
      : undefined
  ]);
}

export function mapInventoryIssueTimelineEvents(rootType: InventoryTimelineEntityType, query: TimelineQuery, movement: StockMovement): readonly TimelineEvent[] {
  if (movement.type !== "ISSUE") return Object.freeze([]);

  return freezeEvents([
    createEvent(rootType, query, "inventory.movement", movement.id, movement.reference ?? movement.id, "inventory.issue.posted", movement.postedAt ?? movement.createdAt, "Sortie de stock postée", `${formatQuantity(movement.quantity)} unités · ${movement.reference ?? movement.referenceId ?? "Mouvement inventaire"}`, "success", {
      movementId: movement.id,
      movementType: movement.type,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      productId: movement.productId,
      warehouseId: movement.fromWarehouseId,
      quantity: movement.quantity
    })
  ]);
}

function createDeliveryProgressEvent(
  rootType: InventoryTimelineEntityType,
  query: TimelineQuery,
  note: DeliveryNote,
  order: SalesOrder | undefined,
  deliveryIndex: number,
  postedDeliveryCount: number,
  quantity: number
) {
  if (note.status !== "posted" || !note.postedAt) return undefined;

  const isFinalPostedDelivery = Boolean(order && order.status === "delivered" && deliveryIndex === postedDeliveryCount - 1);
  const eventType = isFinalPostedDelivery ? "sales.order.fully_delivered" : "delivery.note.partially_delivered";
  const title = isFinalPostedDelivery ? "Livraison complète" : "Livraison partielle";

  return createEvent(rootType, query, "delivery.note", note.id, note.number, eventType, note.postedAt, title, `${formatQuantity(quantity)} unités via ${note.number}.`, isFinalPostedDelivery ? "success" : "warning", {
    deliveryNoteId: note.id,
    deliveryNoteNumber: note.number,
    salesOrderId: note.salesOrderId,
    quantityDelivered: quantity,
    finalDelivery: isFinalPostedDelivery
  });
}

function createEvent(
  rootType: InventoryTimelineEntityType,
  query: TimelineQuery,
  sourceType: InventoryTimelineSourceType,
  sourceId: string,
  sourceLabel: string,
  eventType: string,
  date: string,
  title: string,
  description: string | undefined,
  status: TimelineEvent["status"],
  metadata: Record<string, unknown>
): TimelineEvent | undefined {
  if (!isCanonicalDate(date)) return undefined;

  const linkHref = createInventoryTimelineLink(sourceType, sourceId);

  return Object.freeze({
    id: createInventoryTimelineEventId(rootType, query.entityId, sourceType, sourceId, eventType, date),
    entityType: query.entityType,
    entityId: query.entityId,
    eventType,
    title,
    description,
    date,
    status,
    link: linkHref ? { href: linkHref, label: sourceLabel } : undefined,
    metadata: Object.freeze({
      providerId: "inventory.timeline",
      rootType,
      sourceEntityType: sourceType,
      sourceEntityId: sourceId,
      sourceLabel,
      ...metadata
    })
  });
}

function freezeEvents(events: readonly (TimelineEvent | undefined)[]) {
  return Object.freeze(events.filter((event): event is TimelineEvent => Boolean(event)));
}

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : String(quantity);
}
