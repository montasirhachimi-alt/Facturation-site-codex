import { SectionHeader } from "@/components/section-header";
import { StockModule } from "@/components/stock-module";
import { products, stockMovements } from "@/lib/demo-data";

export default function StockPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Stock"
        title="Produits et services"
        description="Gestion complète des produits, seuils critiques, entrées, sorties et historique de stock."
      />
      <StockModule initialProducts={products} initialMovements={stockMovements} />
    </div>
  );
}
