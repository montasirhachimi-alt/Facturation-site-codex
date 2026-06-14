import { PurchasesModule } from "@/components/purchases-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, products, purchaseInvoices, suppliers } from "@/lib/demo-data";

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Achats"
        title="Factures d'achat"
        description="Saisie, suivi des statuts, paiements fournisseurs et lignes produits."
      />
      <PurchasesModule initialPurchases={purchaseInvoices} suppliers={suppliers} products={products} scope={{ companyId: activeCompanyId, userId: "demo-user", role: "COMPANY_ADMIN" }} />
    </div>
  );
}
