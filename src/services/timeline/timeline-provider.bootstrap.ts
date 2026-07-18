import { InventoryTimelineProvider, INVENTORY_TIMELINE_PROVIDER_ID } from "@/modules/inventory/timeline";
import { SalesTimelineProvider, SALES_TIMELINE_PROVIDER_ID } from "@/modules/sales/timeline";
import { businessTimelineRuntime } from "@/runtime/timeline";

let defaultTimelineProvidersRegistered = false;

export function ensureDefaultTimelineProvidersRegistered() {
  if (defaultTimelineProvidersRegistered) {
    return businessTimelineRuntime.listProviders();
  }

  if (!businessTimelineRuntime.listProviders().some((provider) => provider.id === SALES_TIMELINE_PROVIDER_ID)) {
    businessTimelineRuntime.registerProvider(new SalesTimelineProvider());
  }

  if (!businessTimelineRuntime.listProviders().some((provider) => provider.id === INVENTORY_TIMELINE_PROVIDER_ID)) {
    businessTimelineRuntime.registerProvider(new InventoryTimelineProvider());
  }

  defaultTimelineProvidersRegistered = true;
  return businessTimelineRuntime.listProviders();
}
