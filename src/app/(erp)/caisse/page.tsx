import { CashModule } from "@/components/cash-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, cashEntries } from "@/lib/demo-data";

export default function CashPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Caisse"
        title="Journal de caisse"
        description="Entrées, sorties, moyens de paiement, solde et traçabilité des mouvements."
      />
      <CashModule initialEntries={cashEntries} scope={{ companyId: activeCompanyId, userId: "demo-user", role: "COMPANY_ADMIN" }} />
    </div>
  );
}
