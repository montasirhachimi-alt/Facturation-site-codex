import { crmSearchProviders } from "@/modules/crm/search";
import { salesSearchProviders } from "@/modules/sales/search";
import { businessSearchRuntime } from "@/runtime/search";

let defaultSearchProvidersRegistered = false;

export function ensureDefaultSearchProvidersRegistered() {
  if (defaultSearchProvidersRegistered) return;

  for (const provider of [...crmSearchProviders, ...salesSearchProviders]) {
    businessSearchRuntime.registerProvider(provider);
  }

  defaultSearchProvidersRegistered = true;
}
