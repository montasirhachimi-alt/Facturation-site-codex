import {
  calculateDocumentTotals,
  formatCommercialDocumentNumber,
  validateDocumentLine
} from "@/platform/commercial-documents";
import type { GoodsReceipt, ProcurementSupplier, PurchaseOrder, PurchaseOrderLine } from "./procurement.types";

export function normalizeProcurementText(value: string | undefined) {
  return (value ?? "").trim();
}

export function createEmptyPurchaseOrderLine(prefix = "po-line"): PurchaseOrderLine {
  return Object.freeze({
    id: `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}` as PurchaseOrderLine["id"],
    description: "",
    quantity: 1,
    unit: "piece",
    unitPrice: 0,
    discountRate: 0,
    taxRate: 20
  });
}

export function calculatePurchaseOrderTotals(order: Pick<PurchaseOrder, "lines" | "currency" | "discountRate">) {
  return calculateDocumentTotals(
    order.lines.map((line) => ({
      id: line.id,
      productId: line.productId,
      productSku: line.productSku,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      discount: line.discountRate ? { rate: line.discountRate } : undefined,
      tax: { rate: line.taxRate }
    })),
    order.currency,
    order.discountRate ? { rate: order.discountRate } : undefined
  );
}

export function validatePurchaseOrderLines(lines: readonly PurchaseOrderLine[]) {
  const errors: string[] = [];
  if (lines.length === 0) errors.push("Ajoutez au moins une ligne d'achat.");
  lines.forEach((line, index) => {
    const issues = validateDocumentLine({
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      tax: { rate: line.taxRate }
    }, index);
    if (issues.length > 0) errors.push(`Ligne ${index + 1} invalide.`);
    if (line.discountRate < 0 || line.discountRate > 100) errors.push(`Ligne ${index + 1} : remise invalide.`);
  });
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function normalizePurchaseOrderLines(lines: readonly PurchaseOrderLine[]) {
  return Object.freeze(lines.map((line) => Object.freeze({
    ...line,
    description: line.description.trim(),
    quantity: Number(line.quantity),
    unitPrice: roundMoney(Number(line.unitPrice)),
    discountRate: Number(line.discountRate),
    taxRate: Number(line.taxRate)
  })).filter((line) => line.description && line.quantity > 0 && line.unitPrice >= 0));
}

export function formatPurchaseOrderNumber(sequence: number) {
  return formatCommercialDocumentNumber({ prefix: "PO", sequence, padding: 6 });
}

export function formatGoodsReceiptNumber(sequence: number) {
  return formatCommercialDocumentNumber({ prefix: "GR", sequence, padding: 6 });
}

export function getReceivedQuantityByPurchaseOrderLine(receipts: readonly GoodsReceipt[], purchaseOrderId: string) {
  const quantities = new Map<string, number>();
  receipts
    .filter((receipt) => receipt.purchaseOrderId === purchaseOrderId && receipt.status === "posted")
    .forEach((receipt) => {
      receipt.lines.forEach((line) => {
        quantities.set(line.purchaseOrderLineId, roundMoney((quantities.get(line.purchaseOrderLineId) ?? 0) + line.receivedQuantity));
      });
    });
  return quantities;
}

export function getPurchaseOrderReceiptState(order: PurchaseOrder, receipts: readonly GoodsReceipt[]) {
  const receivedByLine = getReceivedQuantityByPurchaseOrderLine(receipts, order.id);
  const lines = order.lines.map((line) => {
    const receivedQuantity = receivedByLine.get(line.id) ?? 0;
    const remainingQuantity = Math.max(0, roundMoney(line.quantity - receivedQuantity));
    return Object.freeze({ line, receivedQuantity, remainingQuantity });
  });
  const orderedQuantity = roundMoney(order.lines.reduce((total, line) => total + line.quantity, 0));
  const receivedQuantity = roundMoney(lines.reduce((total, line) => total + line.receivedQuantity, 0));
  const remainingQuantity = Math.max(0, roundMoney(orderedQuantity - receivedQuantity));
  return Object.freeze({
    orderedQuantity,
    receivedQuantity,
    remainingQuantity,
    fullyReceived: orderedQuantity > 0 && remainingQuantity === 0,
    partiallyReceived: receivedQuantity > 0 && remainingQuantity > 0,
    lines: Object.freeze(lines)
  });
}

export function matchesSupplierSearch(supplier: ProcurementSupplier, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [
    supplier.companyName,
    supplier.tradeName,
    supplier.ice,
    supplier.taxId,
    supplier.rc,
    supplier.vat,
    supplier.phone,
    supplier.email,
    supplier.address,
    supplier.country,
    supplier.currency,
    supplier.paymentTerms,
    supplier.notes
  ].join(" ").toLowerCase().includes(normalized);
}

export function matchesPurchaseOrderSearch(order: PurchaseOrder, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [
    order.number,
    order.supplierName,
    order.status,
    order.reference,
    order.notes,
    order.lines.map((line) => [line.productSku, line.productName, line.description].join(" ")).join(" ")
  ].join(" ").toLowerCase().includes(normalized);
}

export function matchesGoodsReceiptSearch(receipt: GoodsReceipt, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [
    receipt.number,
    receipt.supplierName,
    receipt.purchaseOrderNumber,
    receipt.status,
    receipt.reference,
    receipt.notes,
    receipt.lines.map((line) => [line.productSku, line.productName, line.description].join(" ")).join(" ")
  ].join(" ").toLowerCase().includes(normalized);
}

export function formatProcurementMoney(amount: number, currency = "MAD") {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
