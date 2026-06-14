import { SectionHeader } from "@/components/section-header";
import { SuppliersModule } from "@/components/suppliers-module";
import { activeCompanyId, purchaseInvoices, suppliers } from "@/lib/demo-data";

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Fournisseurs"
        title="Gestion fournisseurs"
        description="Coordonnées, historique des factures d'achat et suivi des montants à payer."
      />
      <SuppliersModule initialSuppliers={suppliers} purchases={purchaseInvoices} scope={{ companyId: activeCompanyId, userId: "demo-user", role: "COMPANY_ADMIN" }} />
    </div>
  );
}
