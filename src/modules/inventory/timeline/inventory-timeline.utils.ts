import type { TimelineQuery } from "@/runtime/timeline";
import type { InventoryTimelineEntityType, InventoryTimelineSourceType } from "./inventory-timeline.types";

const ENTITY_ALIASES = Object.freeze({
  "sales.order": "sales.order",
  SalesOrder: "sales.order",
  salesOrder: "sales.order",
  order: "sales.order",
  "delivery.note": "delivery.note",
  DeliveryNote: "delivery.note",
  deliveryNote: "delivery.note",
  "inventory.movement": "inventory.movement",
  InventoryMovement: "inventory.movement",
  movement: "inventory.movement",
  "inventory.reservation": "inventory.reservation",
  InventoryReservation: "inventory.reservation",
  reservation: "inventory.reservation"
} satisfies Record<string, InventoryTimelineEntityType>);

export function normalizeInventoryTimelineEntityType(entityType: string): InventoryTimelineEntityType | undefined {
  return ENTITY_ALIASES[entityType.trim() as keyof typeof ENTITY_ALIASES];
}

export function isInventoryTimelineQuery(query: TimelineQuery) {
  return Boolean(normalizeInventoryTimelineEntityType(query.entityType));
}

export function createInventoryTimelineEventId(
  rootType: InventoryTimelineEntityType,
  rootId: string,
  sourceType: InventoryTimelineSourceType,
  sourceId: string,
  eventType: string,
  canonicalTimestamp: string,
  suffix?: string
) {
  return ["inventory-timeline", rootType, rootId, sourceType, sourceId, eventType, canonicalTimestamp, suffix].filter(Boolean).join(":");
}

export function createInventoryTimelineLink(sourceType: InventoryTimelineSourceType, sourceId: string) {
  if (sourceType === "sales.order") return `/sales/orders/${sourceId}`;
  if (sourceType === "delivery.note") return `/sales/delivery-notes/${sourceId}`;
  if (sourceType === "inventory.movement" || sourceType === "inventory.reservation") return "/inventory";
  return undefined;
}

export function isCanonicalDate(value: string | undefined) {
  return Boolean(value && !Number.isNaN(Date.parse(value)));
}

export function isLaterThan(first: string | undefined, second: string | undefined) {
  if (!isCanonicalDate(first) || !isCanonicalDate(second)) return false;
  return Date.parse(first as string) > Date.parse(second as string);
}

export function sumQuantities(values: readonly number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}
