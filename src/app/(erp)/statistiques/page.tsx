import { StatisticsModule } from "@/components/statistics-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, cashEntries, clients, invoices, products, purchaseInvoices } from "@/lib/demo-data";
import { getCurrentUser } from "@/lib/auth";

export default async function StatisticsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Pilotage"
        title="Statistiques"
        description="Indicateurs calculés depuis les factures, achats, caisse, clients et stock de l'entreprise active."
      />
      <StatisticsModule
        invoices={invoices}
        purchases={purchaseInvoices.filter((purchase) => purchase.companyId === activeCompanyId)}
        cashEntries={cashEntries.filter((entry) => entry.companyId === activeCompanyId)}
        products={products}
        clients={clients}
        role={user?.role ?? "READ_ONLY"}
      />
    </div>
  );
}

