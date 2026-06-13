import { InvoicesModule } from "@/components/invoices-module";
import { SectionHeader } from "@/components/section-header";
import { clients, invoices } from "@/lib/demo-data";

export default function FacturesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Ventes"
        title="Factures"
        description="Suivi des factures, paiements, restes à payer, PDF, impression et export."
      />
      <InvoicesModule initialInvoices={invoices} clients={clients} />
    </div>
  );
}
