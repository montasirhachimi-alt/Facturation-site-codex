"use client";

import { Archive, PackageCheck, Pencil, RotateCcw } from "lucide-react";
import { EntityActionButton, EntityActionMenu, EntityEmptyState, EntityTable, type EntityTableColumn } from "@/ui";
import type { Product, ProductId } from "../../product.types";
import type { ProductSortKey } from "../hooks/use-products-page";

const columns: Array<EntityTableColumn<Product, ProductSortKey>> = [
  {
    key: "sku",
    label: "SKU",
    sortable: true,
    sortKey: "sku",
    render: (product) => <span className="font-mono text-xs font-black text-hicotech-navy dark:text-white">{product.sku}</span>
  },
  {
    key: "name",
    label: "Produit",
    sortable: true,
    sortKey: "name",
    render: (product) => (
      <div>
        <p className="font-bold text-hicotech-navy dark:text-white">{product.name}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{product.shortDescription ?? product.brand ?? "Catalogue produit"}</p>
      </div>
    )
  },
  { key: "category", label: "Catégorie", render: (product) => <span className="text-slate-600 dark:text-slate-300">{product.categoryName ?? "Non classé"}</span> },
  { key: "unit", label: "Unité", render: (product) => <span className="font-semibold text-slate-700 dark:text-slate-200">{product.unit}</span> },
  { key: "sellingPrice", label: "Prix vente", sortable: true, sortKey: "sellingPrice", render: (product) => <span className="font-bold text-hicotech-navy dark:text-white">{formatMoney(product.sellingPrice, product.currency)}</span> },
  { key: "vatRate", label: "TVA", sortable: true, sortKey: "vatRate", render: (product) => <span className="text-slate-600 dark:text-slate-300">{product.vatRate}%</span> },
  {
    key: "status",
    label: "Statut",
    sortable: true,
    sortKey: "status",
    render: (product) => (
      <span className={product.status === "archived" ? "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500" : "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"}>
        {product.status === "archived" ? "Archivé" : "Actif"}
      </span>
    )
  }
];

export function ProductsTable({
  products,
  onArchive,
  onEdit,
  onRestore,
  onSort,
  onToggleAll,
  onToggleRow,
  selectedIds,
  sort
}: {
  products: readonly Product[];
  onArchive: (product: Product) => void;
  onEdit: (product: Product) => void;
  onRestore: (product: Product) => void;
  onSort: (field: ProductSortKey) => void;
  onToggleAll: () => void;
  onToggleRow: (id: ProductId) => void;
  selectedIds: readonly ProductId[];
  sort: Readonly<{ field: ProductSortKey; direction: "asc" | "desc" }>;
}) {
  const allVisibleSelected = products.length > 0 && products.every((product) => selectedIds.includes(product.id));

  return (
    <EntityTable
      allVisibleSelected={allVisibleSelected}
      bulkLabel={`${selectedIds.length} sélectionné(s)`}
      columns={columns}
      emptyState={<EntityEmptyState icon={PackageCheck} title="Aucun produit disponible" description="Le catalogue produit est prêt à recevoir les articles commerciaux partagés par les futurs modules." />}
      getRowLabel={(product) => product.name}
      items={products}
      onSort={onSort}
      onToggleAll={onToggleAll}
      onToggleRow={onToggleRow}
      renderActions={(product) => (
        <EntityActionMenu>
          <EntityActionButton icon={<Pencil size={16} />} label="Modifier" onClick={() => onEdit(product)} />
          {product.status === "archived" ? (
            <EntityActionButton icon={<RotateCcw size={16} />} label="Restaurer" onClick={() => onRestore(product)} />
          ) : (
            <EntityActionButton icon={<Archive size={16} />} label="Archiver" onClick={() => onArchive(product)} danger />
          )}
        </EntityActionMenu>
      )}
      selectedIds={selectedIds}
      sort={sort}
      subtitle="Catalogue canonique partagé par les futurs modules commerciaux."
      title="Produits"
    />
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
