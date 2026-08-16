import type { DeliveryNote } from "@/modules/sales/delivery-notes";
import { formatCommercialDocumentNumber } from "@/platform/commercial-documents";
import type { Shipment, ShipmentLine, ShipmentSourceLine, ShipmentStatus } from "./shipment.types";

export function formatShipmentNumber(sequence: number) {
  return formatCommercialDocumentNumber({ prefix: "EXP", sequence, padding: 6 });
}

export function createShipmentLinesFromDeliveryNote(lines: readonly ShipmentSourceLine[]): readonly ShipmentLine[] {
  return Object.freeze(lines.map((line) => Object.freeze({
    id: `shipment-line-${line.id}`,
    deliveryNoteLineId: line.id,
    productId: line.productId,
    productSku: line.productSku,
    productName: line.productName,
    description: line.description,
    unit: line.unit,
    quantity: line.quantityPosted || line.quantityToDeliver
  })));
}

export function matchesShipmentSearch(shipment: Shipment, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [
    shipment.number,
    shipment.deliveryNoteNumber,
    shipment.salesOrderNumber,
    shipment.companyName,
    shipment.contactName,
    shipment.deliveryAddress,
    shipment.carrier,
    shipment.trackingNumber,
    shipment.status,
    shipment.notes,
    shipment.lines.map((line) => [line.productSku, line.productName, line.description].join(" ")).join(" ")
  ].join(" ").toLowerCase().includes(normalized);
}

export function shipmentCanBeCreatedFromDeliveryNote(note: DeliveryNote, existingShipments: readonly Shipment[]) {
  return note.status === "posted" && !existingShipments.some((shipment) => shipment.deliveryNoteId === note.id && shipment.status !== "cancelled");
}

export function getShipmentQuantity(shipment: Shipment) {
  return shipment.lines.reduce((total, line) => total + line.quantity, 0);
}

export function isShipmentDelayed(shipment: Shipment, now = new Date()) {
  if (!shipment.expectedDelivery || ["delivered", "cancelled"].includes(shipment.status)) return false;
  return new Date(shipment.expectedDelivery).getTime() < startOfDay(now).getTime();
}

export function getShipmentStatusRank(status: ShipmentStatus) {
  return ["draft", "ready", "shipped", "in_transit", "delivered"].indexOf(status);
}

export function canTransitionShipmentStatus(from: ShipmentStatus, to: ShipmentStatus) {
  if (from === to) return false;
  const allowed: Readonly<Record<ShipmentStatus, readonly ShipmentStatus[]>> = Object.freeze({
    draft: ["ready", "cancelled"],
    ready: ["shipped", "cancelled"],
    shipped: ["in_transit", "cancelled"],
    in_transit: ["delivered", "cancelled"],
    delivered: [],
    cancelled: []
  });
  return allowed[from]?.includes(to) ?? false;
}

export function validateShipmentStatusTransition(from: ShipmentStatus, to: ShipmentStatus) {
  if (!canTransitionShipmentStatus(from, to)) {
    throw new Error("Transition d'expédition non autorisée.");
  }
}

export function normalizeShipmentText(value: string | undefined) {
  return (value ?? "").trim();
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
