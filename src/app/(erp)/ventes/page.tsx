import { redirect } from "next/navigation";
import { getAvailableRedirectDestination } from "@/platform/modules/module-route-availability";

export default function VentesPage() {
  redirect(getAvailableRedirectDestination("/sales/quotes"));
}
