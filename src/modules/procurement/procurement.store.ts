import { ProcurementService } from "./procurement.service";

export const procurementStoreEventName = "hicopilot-procurement-updated";
export const procurementLocalService = new ProcurementService();

export function notifyProcurementStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(procurementStoreEventName));
}

export function subscribeToProcurementStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(procurementStoreEventName, listener);
  return () => window.removeEventListener(procurementStoreEventName, listener);
}
