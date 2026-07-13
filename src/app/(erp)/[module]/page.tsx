import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getAvailableRedirectDestination, legacyRouteRedirects } from "@/platform/modules/module-route-availability";

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const legacyPath = `/${module}`;
  const destination = legacyRouteRedirects[legacyPath as keyof typeof legacyRouteRedirects];

  if (!destination) {
    notFound();
  }

  redirect(getAvailableRedirectDestination(destination));
}
