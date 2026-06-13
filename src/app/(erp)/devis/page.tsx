import { QuotesModule } from "@/components/quotes-module";
import { SectionHeader } from "@/components/section-header";
import { clients, products, quotes } from "@/lib/demo-data";

export default function DevisPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Ventes"
        title="Devis"
        description="Création, modification, PDF, impression, export et conversion des devis en factures."
      />
      <QuotesModule initialQuotes={quotes} clients={clients} products={products} />
    </div>
  );
}
