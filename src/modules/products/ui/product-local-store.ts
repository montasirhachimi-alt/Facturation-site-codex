import { ProductService } from "../product.service";

export const productStoreEventName = "hicopilot-products-updated";
export const productLocalService = new ProductService();

export function notifyProductStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(productStoreEventName));
}

export function subscribeToProductStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(productStoreEventName, listener);
  return () => window.removeEventListener(productStoreEventName, listener);
}
