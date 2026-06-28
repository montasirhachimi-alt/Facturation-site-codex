import { DeliveryNotesModule } from "@/components/delivery-notes-module";
import { SectionHeader } from "@/components/section-header";
import { branding } from "@/lib/branding";
import { activeCompanyId, clients, deliveryNotes, products } from "@/lib/demo-data";

export default function DeliveryNotesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Livraisons"
        title="Bons de livraison"
        description={`Création, validation, impression et génération PDF des bons de livraison ${branding.productName}.`}
      />
      <DeliveryNotesModule
        initialDeliveryNotes={deliveryNotes}
        clients={clients}
        products={products}
        scope={{ companyId: activeCompanyId, userId: "demo-user", role: "COMPANY_ADMIN" }}
      />
    </div>
  );
}
