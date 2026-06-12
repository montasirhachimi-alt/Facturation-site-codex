import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { clients } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Clients"
        title="Portefeuille clients"
        description="Coordonnées, ICE, solde, historique et relances commerciales."
        action="Ajouter un client"
      />
      <DataTable
        columns={["Société", "Ville", "ICE", "Téléphone", "Solde", "Dernière relance"]}
        rows={clients.map((client) => [
          client.company,
          client.city,
          client.ice,
          client.phone,
          formatCurrency(client.balance),
          client.lastReminder
        ])}
      />
    </div>
  );
}
