import { CompanyService } from "../company.service";
import { crmCompanySeed } from "./companies.seed";

export const crmCompanyStoreEventName = "hicopilot-crm-companies-updated";
export const crmCompanyLocalService = new CompanyService({ seed: crmCompanySeed });

export function notifyCrmCompanyStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(crmCompanyStoreEventName));
}

export function subscribeToCrmCompanyStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(crmCompanyStoreEventName, listener);
  return () => window.removeEventListener(crmCompanyStoreEventName, listener);
}
