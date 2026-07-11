import { ContactService } from "../contact.service";
import { crmContactSeed } from "./contacts.seed";

export const crmContactStoreEventName = "hicopilot-crm-contacts-updated";
export const crmContactLocalService = new ContactService({ seed: crmContactSeed });

export function notifyCrmContactStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(crmContactStoreEventName));
}

export function subscribeToCrmContactStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(crmContactStoreEventName, listener);
  return () => window.removeEventListener(crmContactStoreEventName, listener);
}
