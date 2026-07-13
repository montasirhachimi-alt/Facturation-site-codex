import { redirect } from "next/navigation";
import { getAvailableRedirectDestination } from "@/platform/modules/module-route-availability";

export default function CrmActivitiesPage() {
  redirect(getAvailableRedirectDestination("/crm/companies"));
}
