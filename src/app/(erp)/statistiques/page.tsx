import { StatisticsModule } from "@/components/statistics-module";
import { activeCompanyId, cashEntries, clients, invoices, products, purchaseInvoices } from "@/lib/demo-data";
import { getCurrentUser } from "@/lib/auth";
import { ProductHero } from "@/ui";
import { BarChart3, Download } from "lucide-react";

export default async function StatisticsPage() {
  const user = await getCurrentUser();
  const scopedPurchases = purchaseInvoices.filter((purchase) => purchase.companyId === activeCompanyId);
  const scopedCashEntries = cashEntries.filter((entry) => entry.companyId === activeCompanyId);

  return (
    <div className="space-y-6">
      <ProductHero
        eyebrow="Analyse / Business Intelligence"
        icon={BarChart3}
        personality="reports"
        title="Transformer les opérations en décisions lisibles."
        subtitle={`Une lecture analytique de ${invoices.length} factures, ${scopedPurchases.length} achats, ${scopedCashEntries.length} mouvements de caisse et ${clients.length} clients.`}
        actions={[
          { href: "#indicateurs", icon: BarChart3, label: "Voir les indicateurs" },
          { href: "#exports", icon: Download, label: "Préparer un export", tone: "secondary" }
        ]}
        signals={[
          { label: "Factures", value: String(invoices.length), helper: "analysées" },
          { label: "Achats", value: String(scopedPurchases.length), helper: "sur période" },
          { label: "Caisse", value: String(scopedCashEntries.length), helper: "mouvements" },
          { label: "Clients", value: String(clients.length), helper: "base active" }
        ]}
      />
      <div id="indicateurs">
        <StatisticsModule
          invoices={invoices}
          purchases={scopedPurchases}
          cashEntries={scopedCashEntries}
          products={products}
          clients={clients}
          role={user?.role ?? "READ_ONLY"}
        />
      </div>
    </div>
  );
}
