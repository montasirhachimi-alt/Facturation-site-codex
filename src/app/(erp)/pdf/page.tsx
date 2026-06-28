import { PdfPreview } from "@/components/pdf-preview";
import { SectionHeader } from "@/components/section-header";
import { branding } from "@/lib/branding";
import { sampleInvoice } from "@/lib/demo-data";

export default function PdfPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="PDF"
        title={`Modèle facture ${branding.productName}`}
        description="Prévisualisation imprimable avec logo, coordonnées, ICE, IF, RC, totaux, signature et cachet."
      />
      <PdfPreview document={sampleInvoice} />
    </div>
  );
}
