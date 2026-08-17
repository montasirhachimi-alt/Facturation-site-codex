import type { GoodsReceipt, ProcurementSupplier, PurchaseOrder, PurchaseOrderStatus } from "./procurement.types";
import { calculatePurchaseOrderTotals, getPurchaseOrderReceiptState } from "./procurement.utils";

export type ProcurementMonthPoint = Readonly<{
  key: string;
  label: string;
  value: number;
}>;

export type ProcurementSupplierRanking = Readonly<{
  supplierId: string;
  supplierName: string;
  value: number;
  orderCount: number;
}>;

export type ProcurementCockpitAnalytics = Readonly<{
  monthPurchaseValue: number;
  previousMonthPurchaseValue: number;
  monthPurchaseDeltaPercent?: number;
  committedAmount: number;
  openPurchaseOrders: number;
  awaitingReceiptOrders: number;
  partiallyReceivedOrders: number;
  activeSuppliers: number;
  monthlyTrend: readonly ProcurementMonthPoint[];
  topSuppliers: readonly ProcurementSupplierRanking[];
}>;

const PURCHASE_VALUE_STATUSES = new Set<PurchaseOrderStatus>(["sent", "confirmed", "partially_received", "received"]);
const COMMITTED_STATUSES = new Set<PurchaseOrderStatus>(["confirmed", "partially_received"]);
const OPEN_STATUSES = new Set<PurchaseOrderStatus>(["sent", "confirmed", "partially_received"]);

export function buildProcurementCockpitAnalytics({
  purchaseOrders,
  receipts,
  referenceDate = new Date(),
  suppliers
}: {
  purchaseOrders: readonly PurchaseOrder[];
  receipts: readonly GoodsReceipt[];
  referenceDate?: Date;
  suppliers: readonly ProcurementSupplier[];
}): ProcurementCockpitAnalytics {
  const postedReceipts = receipts.filter((receipt) => receipt.status === "posted");
  const currentMonth = monthBounds(referenceDate);
  const previousMonth = monthBounds(addMonths(referenceDate, -1));
  const purchaseValueOrders = purchaseOrders.filter(isPurchaseValueOrder);

  const monthPurchaseValue = sumPurchaseOrders(
    purchaseValueOrders.filter((order) => isWithinDateRange(order.issueDate, currentMonth.start, currentMonth.end))
  );
  const previousMonthPurchaseValue = sumPurchaseOrders(
    purchaseValueOrders.filter((order) => isWithinDateRange(order.issueDate, previousMonth.start, previousMonth.end))
  );

  const awaitingReceiptOrders = purchaseOrders.filter((order) => {
    if (!COMMITTED_STATUSES.has(order.status)) return false;
    return getPurchaseOrderReceiptState(order, postedReceipts).remainingQuantity > 0;
  }).length;

  return Object.freeze({
    monthPurchaseValue,
    previousMonthPurchaseValue,
    monthPurchaseDeltaPercent: calculateDeltaPercent(monthPurchaseValue, previousMonthPurchaseValue),
    committedAmount: sumPurchaseOrders(purchaseOrders.filter((order) => COMMITTED_STATUSES.has(order.status))),
    openPurchaseOrders: purchaseOrders.filter((order) => OPEN_STATUSES.has(order.status)).length,
    awaitingReceiptOrders,
    partiallyReceivedOrders: purchaseOrders.filter((order) => order.status === "partially_received").length,
    activeSuppliers: suppliers.filter((supplier) => supplier.active && supplier.status === "active").length,
    monthlyTrend: Object.freeze(buildMonthlyTrend(purchaseValueOrders, referenceDate, 6)),
    topSuppliers: Object.freeze(buildTopSuppliers(purchaseValueOrders, 5))
  });
}

export function isPurchaseValueOrder(order: PurchaseOrder) {
  return PURCHASE_VALUE_STATUSES.has(order.status);
}

function buildMonthlyTrend(orders: readonly PurchaseOrder[], referenceDate: Date, months: number) {
  return Array.from({ length: months }, (_, index) => {
    const monthDate = addMonths(referenceDate, index - months + 1);
    const bounds = monthBounds(monthDate);
    return Object.freeze({
      key: monthKey(monthDate),
      label: formatMonthLabel(monthDate),
      value: sumPurchaseOrders(orders.filter((order) => isWithinDateRange(order.issueDate, bounds.start, bounds.end)))
    });
  });
}

function buildTopSuppliers(orders: readonly PurchaseOrder[], limit: number) {
  const bySupplier = new Map<string, { supplierId: string; supplierName: string; value: number; orderCount: number }>();

  for (const order of orders) {
    const current = bySupplier.get(order.supplierId) ?? {
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      value: 0,
      orderCount: 0
    };
    current.value += calculatePurchaseOrderTotals(order).total;
    current.orderCount += 1;
    bySupplier.set(order.supplierId, current);
  }

  return [...bySupplier.values()]
    .map((supplier) => Object.freeze({ ...supplier, value: roundMoney(supplier.value) }))
    .sort((left, right) => right.value - left.value || left.supplierName.localeCompare(right.supplierName, "fr"))
    .slice(0, limit);
}

function sumPurchaseOrders(orders: readonly PurchaseOrder[]) {
  return roundMoney(orders.reduce((total, order) => total + calculatePurchaseOrderTotals(order).total, 0));
}

function calculateDeltaPercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : undefined;
  return roundMoney(((current - previous) / previous) * 100);
}

function isWithinDateRange(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= start && date < end;
}

function monthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-MA", { month: "short" }).format(date);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
