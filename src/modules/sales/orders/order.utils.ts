import { calculateDocumentTotals, formatCommercialDocumentNumber, roundDocumentAmount } from "@/platform/commercial-documents";
import type { Quote } from "@/modules/sales/quotes";
import type { SalesOrder, SalesOrderLine } from "./order.types";

export function formatSalesOrderNumber(sequence: number) {
  return formatCommercialDocumentNumber({ prefix: "SO", sequence, padding: 6 });
}

export function calculateSalesOrderTotals(order: Pick<SalesOrder, "lines" | "currency" | "discountRate">) {
  return calculateDocumentTotals(
    order.lines.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: line.quantityOrdered,
      unitPrice: line.unitPrice,
      discount: line.discountRate ? { rate: line.discountRate } : undefined,
      tax: { rate: line.taxRate }
    })),
    order.currency,
    order.discountRate ? { rate: order.discountRate } : undefined
  );
}

export function normalizeSalesOrderLines(lines: readonly SalesOrderLine[]) {
  return Object.freeze(lines
    .map((line) => Object.freeze({
      ...line,
      description: line.description.trim(),
      quantityOrdered: Number(line.quantityOrdered),
      quantityReserved: Number(line.quantityReserved ?? 0),
      quantityDelivered: Number(line.quantityDelivered ?? 0),
      unitPrice: roundDocumentAmount(Number(line.unitPrice)),
      discountRate: Number(line.discountRate ?? 0),
      taxRate: Number(line.taxRate ?? 0)
    }))
    .filter((line) => line.description && line.quantityOrdered > 0 && line.unitPrice >= 0));
}

export function matchesSalesOrderSearch(order: SalesOrder, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    order.number,
    order.companyName,
    order.contactName,
    order.sourceQuoteNumber,
    order.customerReference,
    order.internalReference,
    order.status,
    order.reservationStatus,
    order.notes,
    order.lines.map((line) => [line.productSku, line.productName, line.description].join(" ")).join(" ")
  ].join(" ").toLowerCase().includes(normalized);
}

export function getSalesOrderReservationStatus(lines: readonly SalesOrderLine[]) {
  const reservable = lines.filter((line) => line.productId && line.quantityOrdered > 0);
  if (reservable.length === 0) return "not_applicable" as const;
  const ordered = reservable.reduce((total, line) => total + line.quantityOrdered, 0);
  const reserved = reservable.reduce((total, line) => total + line.quantityReserved, 0);
  if (reserved <= 0) return "not_reserved" as const;
  if (reserved >= ordered) return "reserved" as const;
  return "partially_reserved" as const;
}

export function createSalesOrderLinesFromQuote(quote: Quote): SalesOrderLine[] {
  return quote.items.map((item) => ({
    id: `so-line-${item.id}`,
    productId: item.productId,
    productSku: item.productSku,
    productName: item.productName,
    description: item.description,
    quantityOrdered: readCommercialNumber(item.quantity),
    quantityReserved: 0,
    quantityDelivered: 0,
    unit: item.unit ?? "piece",
    unitPrice: roundDocumentAmount(readCommercialNumber(item.unitPrice)),
    discountRate: 0,
    taxRate: readCommercialNumber(item.taxRate)
  }));
}

function readCommercialNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    const parsed = value.toNumber();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
