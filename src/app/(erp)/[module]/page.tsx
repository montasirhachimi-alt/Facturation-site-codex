import { redirect } from "next/navigation";

const routeMap: Record<string, string> = {
  clients: "/crm/companies",
  devis: "/sales/quotes",
  factures: "/sales/invoices",
  paiements: "/sales/payments",
  parametres: "/parametres",
  ventes: "/sales/quotes"
};

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  redirect(routeMap[module] ?? "/dashboard");
}
