import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { documents } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/format";

export default function VentesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Ventes"
        title="Documents commerciaux"
        description="Devis, factures, proformas, avoirs et bons de livraison avec statuts et conversions."
        action="Nouveau document"
      />
      <DataTable
        columns={["N°", "Type", "Client", "Date", "Statut", "Total TTC"]}
        rows={documents.map((doc) => [
          doc.number,
          doc.type,
          doc.customer,
          formatDate(doc.date),
          doc.status,
          formatCurrency(doc.total)
        ])}
      />
    </div>
  );
}
