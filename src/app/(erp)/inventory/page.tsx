import { redirect } from "next/navigation";
import { InventoryWorkspace } from "@/modules/inventory/ui/pages/inventory-workspace";
import { getRouteAvailabilityDecision } from "@/platform/modules/module-route-availability";

export default function InventoryPage() {
  const decision = getRouteAvailabilityDecision("/inventory");
  if (!decision.available) redirect(decision.redirectTo ?? "/dashboard");

  return <InventoryWorkspace />;
}
