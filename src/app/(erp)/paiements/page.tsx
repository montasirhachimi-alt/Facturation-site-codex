import { PaymentsTrackingModule } from "@/components/payments-tracking-module";
import { SectionHeader } from "@/components/section-header";
import { clients, invoices } from "@/lib/demo-data";
import { getCurrentUser } from "@/lib/auth";

export default async function PaymentsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Pilotage"
        title="Suivi paiements"
        description="Suivi opérationnel des encaissements, restes à payer, échéances, relances et reçus."
      />
      <PaymentsTrackingModule invoices={invoices} clients={clients} role={user?.role ?? "READ_ONLY"} />
    </div>
  );
}

