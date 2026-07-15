import { SalesOrderService } from "./order.service";

export const salesOrderStoreEventName = "hicopilot-sales-orders-updated";
export const salesOrderService = new SalesOrderService();

export function notifySalesOrderStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(salesOrderStoreEventName));
}

export function subscribeToSalesOrderStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(salesOrderStoreEventName, listener);
  return () => window.removeEventListener(salesOrderStoreEventName, listener);
}
