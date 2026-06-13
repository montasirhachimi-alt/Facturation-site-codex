import { ClientsModule } from "@/components/clients-module";
import { SectionHeader } from "@/components/section-header";
import { clientDocuments, clients } from "@/lib/demo-data";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Clients"
        title="Portefeuille clients"
        description="Coordonnées complètes, historique commercial, devis, factures et encaissements."
      />
      <ClientsModule initialClients={clients} initialDocuments={clientDocuments} />
    </div>
  );
}
