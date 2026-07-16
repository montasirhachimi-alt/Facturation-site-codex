import { formatCommercialDocumentNumber } from "@/platform/commercial-documents";
import { normalizeInventoryQuantity, parseInventoryQuantityInput } from "@/modules/inventory/inventory.utils";
import type { SalesOrder, SalesOrderLine } from "@/modules/sales/orders";
import type { DeliveryNote, DeliveryNoteLine } from "./delivery-note.types";

export function formatDeliveryNoteNumber(sequence: number) {
  return formatCommercialDocumentNumber({ prefix: "BL", sequence, padding: 6 });
}

export function getRemainingToDeliver(line: Pick<SalesOrderLine, "quantityOrdered" | "quantityDelivered">) {
  return normalizeInventoryQuantity(Math.max(0, line.quantityOrdered - line.quantityDelivered));
}

export function getProjectedRemainingToDeliver(
  line: Pick<SalesOrderLine, "quantityOrdered" | "quantityDelivered">,
  deliveryQuantity: number
) {
  return normalizeInventoryQuantity(Math.max(0, getRemainingToDeliver(line) - normalizeInventoryQuantity(deliveryQuantity)));
}

export function parseDeliveryNoteQuantity(value: unknown) {
  if (typeof value === "string") return parseInventoryQuantityInput(value);
  if (typeof value === "number") return normalizeInventoryQuantity(value);
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return normalizeInventoryQuantity(value.toNumber());
  }
  return Number.NaN;
}

export function isValidDeliveryNoteQuantity(value: unknown) {
  const quantity = parseDeliveryNoteQuantity(value);
  return Number.isFinite(quantity) && quantity > 0;
}

export function getSalesOrderDeliveryProgress(order: Pick<SalesOrder, "lines">) {
  const quantityOrdered = normalizeInventoryQuantity(order.lines.reduce((total, line) => total + line.quantityOrdered, 0));
  const quantityDelivered = normalizeInventoryQuantity(order.lines.reduce((total, line) => total + line.quantityDelivered, 0));
  return Object.freeze({
    quantityOrdered,
    quantityDelivered,
    quantityRemaining: normalizeInventoryQuantity(Math.max(0, quantityOrdered - quantityDelivered)),
    complete: quantityOrdered > 0 && quantityDelivered >= quantityOrdered,
    partial: quantityDelivered > 0 && quantityDelivered < quantityOrdered
  });
}

export function normalizeDeliveryNoteLines(lines: readonly DeliveryNoteLine[]) {
  return Object.freeze(lines.map((line) => Object.freeze({
    ...line,
    description: line.description.trim(),
    quantityToDeliver: parseDeliveryNoteQuantity(line.quantityToDeliver),
    quantityPosted: parseDeliveryNoteQuantity(line.quantityPosted ?? 0)
  })).filter((line) => line.productId && line.salesOrderLineId && line.description && line.quantityToDeliver > 0));
}

export function matchesDeliveryNoteSearch(note: DeliveryNote, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    note.number,
    note.salesOrderNumber,
    note.companyName,
    note.contactName,
    note.warehouseName,
    note.status,
    note.customerReference,
    note.notes,
    note.lines.map((line) => [line.productSku, line.productName, line.description].join(" ")).join(" ")
  ].filter(Boolean).join(" ").toLowerCase().includes(normalized);
}
