import type { Quote } from "@/modules/sales/quotes";
import { SALES_ORDERS_WORKSPACE_ID } from "./order.constants";
import type { CreateSalesOrderInput, SalesOrder, SalesOrderFilters, SalesOrderId, SalesOrderListResult } from "./order.types";
import { createSalesOrderLinesFromQuote, formatSalesOrderNumber, getSalesOrderReservationStatus, matchesSalesOrderSearch, normalizeSalesOrderLines } from "./order.utils";

export class SalesOrderService {
  private readonly orders = new Map<SalesOrderId, SalesOrder>();
  private readonly now: () => string;

  constructor(options: { seed?: readonly SalesOrder[]; now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    for (const order of options.seed ?? []) this.orders.set(order.id, freezeSalesOrder(order));
  }

  replaceOrders(orders: readonly SalesOrder[]) {
    this.orders.clear();
    orders.forEach((order) => this.orders.set(order.id, freezeSalesOrder(order)));
  }

  upsertOrder(order: SalesOrder) {
    const frozen = freezeSalesOrder(order);
    this.orders.set(frozen.id, frozen);
    return frozen;
  }

  listOrders(filters: SalesOrderFilters): SalesOrderListResult {
    const orders = [...this.orders.values()]
      .filter((order) => order.workspaceId === filters.workspaceId)
      .filter((order) => filters.includeArchived || order.status !== "archived")
      .filter((order) => !filters.status || filters.status === "all" || order.status === filters.status)
      .filter((order) => !filters.reservationStatus || filters.reservationStatus === "all" || order.reservationStatus === filters.reservationStatus)
      .filter((order) => !filters.companyId || filters.companyId === "all" || order.companyId === filters.companyId)
      .filter((order) => !filters.query || matchesSalesOrderSearch(order, filters.query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return Object.freeze({ orders: Object.freeze(orders), total: orders.length });
  }

  getOrder(id: SalesOrderId, workspaceId: SalesOrderFilters["workspaceId"]) {
    const order = this.orders.get(id);
    return order?.workspaceId === workspaceId ? order : undefined;
  }

  getOrderByQuote(sourceQuoteId: Quote["id"], workspaceId: SalesOrderFilters["workspaceId"]) {
    return [...this.orders.values()].find((order) => order.workspaceId === workspaceId && order.sourceQuoteId === sourceQuoteId && order.status !== "archived");
  }

  createOrder(input: CreateSalesOrderInput) {
    const lines = normalizeSalesOrderLines(input.lines);
    if (!input.companyId || !input.companyName.trim()) return Object.freeze({ order: undefined, error: "Sélectionnez une société." });
    if (lines.length === 0) return Object.freeze({ order: undefined, error: "Ajoutez au moins une ligne valide." });
    const timestamp = this.now();
    const order = freezeSalesOrder({
      ...input,
      id: `sales-order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as SalesOrderId,
      number: formatSalesOrderNumber(this.orders.size + 1),
      status: input.status ?? "draft",
      reservationStatus: input.reservationStatus ?? getSalesOrderReservationStatus(lines),
      lines,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.orders.set(order.id, order);
    return Object.freeze({ order });
  }

  createFromQuote(quote: Quote) {
    const existing = this.getOrderByQuote(quote.id, SALES_ORDERS_WORKSPACE_ID);
    if (existing) return Object.freeze({ order: undefined, error: "Une commande client existe déjà pour ce devis." });
    return this.createOrder({
      workspaceId: SALES_ORDERS_WORKSPACE_ID,
      companyId: quote.companyId,
      companyName: quote.companyName ?? quote.customerName,
      contactId: quote.contactId,
      contactName: quote.contactName,
      sourceQuoteId: quote.id,
      sourceQuoteNumber: quote.number,
      orderDate: new Date().toISOString(),
      currency: quote.currency,
      customerReference: "",
      internalReference: quote.opportunityName ?? quote.opportunityId,
      notes: quote.notes,
      lines: createSalesOrderLinesFromQuote(quote),
      discountRate: quote.discountRate,
      ownerId: quote.ownerId
    });
  }

  updateOrder(order: SalesOrder) {
    const updated = freezeSalesOrder({ ...order, lines: normalizeSalesOrderLines(order.lines), reservationStatus: getSalesOrderReservationStatus(order.lines), updatedAt: this.now() });
    this.orders.set(updated.id, updated);
    return updated;
  }
}

export function freezeSalesOrder(order: SalesOrder): SalesOrder {
  return Object.freeze({
    ...order,
    lines: Object.freeze(order.lines.map((line) => Object.freeze({ ...line })))
  });
}
