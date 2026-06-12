import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { products } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

export default function StockPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Stock"
        title="Produits et services"
        description="Prix HT/TTC, TVA, seuils critiques et mouvements de stock."
        action="Nouveau produit"
      />
      <DataTable
        columns={["Référence", "Désignation", "Catégorie", "Stock", "Stock min.", "Prix HT", "TVA"]}
        rows={products.map((product) => [
          product.reference,
          product.name,
          product.category,
          `${product.stock}`,
          `${product.minStock}`,
          formatCurrency(product.salePrice),
          `${product.vat}%`
        ])}
      />
    </div>
  );
}
