import { redirect } from "next/navigation";
import { getFallbackRouteForUnavailableModule } from "@/platform/modules/module-route-availability";

export default function HrContractsPage() {
  redirect(getFallbackRouteForUnavailableModule());
}
