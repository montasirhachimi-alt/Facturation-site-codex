import { HrService } from "./hr.service";

export const hrStoreEventName = "bosiaco-hr-updated";
export const hrLocalService = new HrService();

export function notifyHrStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(hrStoreEventName));
}

export function subscribeToHrStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(hrStoreEventName, listener);
  return () => window.removeEventListener(hrStoreEventName, listener);
}
