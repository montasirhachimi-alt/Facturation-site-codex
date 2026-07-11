import { CustomerService } from "../customer.service";
import { crmCustomerSeed } from "./customers.seed";

export const crmCustomerStoreEventName = "hicopilot-crm-customers-updated";
export const crmCustomerLocalService = new CustomerService({ seed: crmCustomerSeed });

export function notifyCrmCustomerStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(crmCustomerStoreEventName));
}

export function subscribeToCrmCustomerStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(crmCustomerStoreEventName, listener);
  return () => window.removeEventListener(crmCustomerStoreEventName, listener);
}
