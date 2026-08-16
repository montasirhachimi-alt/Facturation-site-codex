"use client";

import { Archive, Eye, PackageCheck, Pencil, RotateCcw } from "lucide-react";
import { EntityActionButton, EntityActionMenu, EntityEmptyState, EntityTable, type EntityTableColumn } from "@/ui";
import { formatInventoryQuantity } from "@/modules/inventory/ui/hooks/use-inventory-workspace";
import { productStockStatusLabel } from "../../product-stock.utils";
import type { ProductId } from "../../product.types";
import type { ProductOperationalRow, ProductOperationalSortKey } from "../hooks/use-products-page";

const columns: Array<EntityTableColumn<ProductOperationalRow, ProductOperationalSortKey>> = [
  {
    key: "sku",
    label: "SKU",
    sortable: true,
    sortKey: "sku",
    render: (row) => <span className="font-mono text-xs font-black text-hicotech-navy dark:text-white">{row.product.sku}</span>
  },
  {
    key: "name",
    label: "Produit",
    sortable: true,
    sortKey: "name",
    render: (row) => (
      <div>
        <p className="font-bold text-hicotech-navy dark:text-white">{row.product.name}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{row.product.shortDescription ?? row.product.brand ?? "Catalogue produit"}</p>
      </div>
    )
  },
  { key: "category", label: "Catégorie", render: (row) => <span className="text-slate-600 dark:text-slate-300">{row.product.categoryName ?? "Non classé"}</span> },
  { key: "sellingPrice", label: "Prix vente", sortable: true, sortKey: "sellingPrice", render: (row) => <span className="font-bold text-hicotech-navy dark:text-white">{formatMoney(row.product.sellingPrice, row.product.currency)}</span> },
  { key: "purchasePrice", label: "Prix achat", render: (row) => <span className="font-semibold text-slate-600 dark:text-slate-300">{formatMoney(row.product.purchasePrice, row.product.currency)}</span> },
  { key: "quantityOnHand", label: "En main", sortable: true, sortKey: "quantityOnHand", render: (row) => <QuantityValue value={row.stock.quantityOnHand} /> },
  { key: "quantityReserved", label: "Réservé", sortable: true, sortKey: "quantityReserved", render: (row) => <QuantityValue value={row.stock.quantityReserved} /> },
  { key: "quantityAvailable", label: "Disponible", sortable: true, sortKey: "quantityAvailable", render: (row) => <QuantityValue value={row.stock.quantityAvailable} strong /> },
  { key: "reorderPoint", label: "Seuil", sortable: true, sortKey: "reorderPoint", render: (row) => <span className="font-semibold text-slate-500">{row.stock.reorderPoint > 0 ? formatInventoryQuantity(row.stock.reorderPoint) : "Non défini"}</span> },
  {
    key: "stockStatus",
    label: "Stock",
    sortable: true,
    sortKey: "stockStatus",
    render: (row) => <StockBadge status={row.stock.status} />
  },
  {
    key: "status",
    label: "Statut",
    sortable: true,
    sortKey: "status",
    render: (row) => (
      <span className={row.product.status === "archived" ? "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500" : "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"}>
        {row.product.status === "archived" ? "Archivé" : "Actif"}
      </span>
    )
  }
];

export function ProductsTable({
  products,
  onArchive,
  onEdit,
  onOpen,
  onRestore,
  onSort,
  onToggleAll,
  onToggleRow,
  selectedIds,
  sort,
  loading
}: {
  products: readonly ProductOperationalRow[];
  onArchive: (row: ProductOperationalRow) => void;
  onEdit: (row: ProductOperationalRow) => void;
  onOpen: (row: ProductOperationalRow) => void;
  onRestore: (row: ProductOperationalRow) => void;
  onSort: (field: ProductOperationalSortKey) => void;
  onToggleAll: () => void;
  onToggleRow: (id: ProductId) => void;
  selectedIds: readonly ProductId[];
  sort: Readonly<{ field: ProductOperationalSortKey; direction: "asc" | "desc" }>;
  loading?: boolean;
}) {
  const allVisibleSelected = products.length > 0 && products.every((row) => selectedIds.includes(row.id));

  return (
    <EntityTable
      allVisibleSelected={allVisibleSelected}
      bulkLabel={`${selectedIds.length} sélectionné(s)`}
      columns={columns}
      emptyState={<EntityEmptyState icon={PackageCheck} title="Aucun produit disponible" description="Créez votre premier produit pour piloter le catalogue, les prix et les stocks depuis un seul espace." />}
      getRowLabel={(row) => row.product.name}
      isLoading={loading}
      items={products}
      onOpenRow={onOpen}
      onSort={onSort}
      onToggleAll={onToggleAll}
      onToggleRow={onToggleRow}
      renderActions={(row) => (
        <EntityActionMenu>
          <EntityActionButton icon={<Eye size={16} />} label="Voir" onClick={() => onOpen(row)} />
          <EntityActionButton icon={<Pencil size={16} />} label="Modifier" onClick={() => onEdit(row)} />
          {row.product.status === "archived" ? (
            <EntityActionButton icon={<RotateCcw size={16} />} label="Restaurer" onClick={() => onRestore(row)} />
          ) : (
            <EntityActionButton icon={<Archive size={16} />} label="Archiver" onClick={() => onArchive(row)} danger />
          )}
        </EntityActionMenu>
      )}
      selectedIds={selectedIds}
      sort={sort}
      subtitle="Catalogue produit avec situation stock et disponibilité."
      title="Produits"
    />
  );
}

function QuantityValue({ strong = false, value }: { strong?: boolean; value: number }) {
  return <span className={strong ? "font-black text-hicotech-navy dark:text-white" : "font-bold text-slate-700 dark:text-slate-200"}>{formatInventoryQuantity(value)}</span>;
}

function StockBadge({ status }: { status: ProductOperationalRow["stock"]["status"] }) {
  const className = {
    inactive: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200",
    inStock: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    lowStock: "bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-100",
    outOfStock: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200",
    reserved: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200"
  }[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${className}`}>{productStockStatusLabel(status)}</span>;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
