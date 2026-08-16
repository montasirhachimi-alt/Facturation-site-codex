"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Boxes, Coins, PackageCheck, Tags } from "lucide-react";
import { EntityErrorState, EntityHeader, EntityPageLayout, EntityPagination, EntityStatsCards } from "@/ui";
import { formatInventoryQuantity } from "@/modules/inventory/ui/hooks/use-inventory-workspace";
import { ProductDialog } from "../dialogs/product-dialog";
import { ProductImportDialog } from "../dialogs/product-import-dialog";
import { downloadProductImportTemplate, downloadProductsExport } from "../product-file-io";
import { useProductsPage } from "../hooks/use-products-page";
import { ProductsTable } from "../tables/products-table";
import { ProductsToolbar } from "../toolbar/products-toolbar";

export function ProductsPage() {
  const state = useProductsPage();
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Stock", "Catalogue"]}
        title="Catalogue produits"
        description="Gérez les articles, les prix et la situation de stock depuis un espace opérationnel unique."
      />

      <EntityStatsCards
        metrics={[
          { icon: PackageCheck, label: "Produits actifs", value: String(state.stats.total), helper: "Catalogue opérationnel" },
          { icon: Tags, label: "Catégories", value: String(state.stats.categories), helper: "Classification produit" },
          { icon: Boxes, label: "Disponible", value: formatInventoryQuantity(state.stats.quantityAvailable), helper: `${formatInventoryQuantity(state.stats.quantityReserved)} réservé` },
          { icon: AlertTriangle, label: "À surveiller", value: String(state.stats.lowStock + state.stats.outOfStock), helper: `${state.stats.outOfStock} rupture(s)` },
          { icon: Coins, label: "Prix moyen", value: formatMoney(state.stats.averagePrice), helper: `${state.stats.archived} archivé(s)` }
        ]}
      />

      <ProductsToolbar
        categories={state.categories}
        categoryId={state.categoryId}
        onCreate={state.openCreateDialog}
        onExportAll={() => void downloadProductsExport(state.baseProducts.filter((product) => product.status !== "archived"), "xlsx", "produits-actifs")}
        onExportCsv={() => void downloadProductsExport(state.filteredProducts, "csv", "produits-filtres")}
        onExportFiltered={() => void downloadProductsExport(state.filteredProducts, "xlsx", "produits-filtres")}
        onExportSelected={() => void downloadProductsExport(state.selectedProducts, "xlsx", "produits-selection")}
        onImport={() => setImportOpen(true)}
        onTemplateCsv={() => void downloadProductImportTemplate("csv")}
        onTemplateXlsx={() => void downloadProductImportTemplate("xlsx")}
        query={state.query}
        selectedCount={state.selectedIds.length}
        setCategoryId={(value) => {
          state.setCategoryId(value);
          state.resetPage();
        }}
        setQuery={(value) => {
          state.setQuery(value);
          state.resetPage();
        }}
        setStatus={(value) => {
          state.setStatus(value);
          state.resetPage();
        }}
        setStockStatus={(value) => {
          state.setStockStatus(value);
          state.resetPage();
        }}
        setUnit={(value) => {
          state.setUnit(value);
          state.resetPage();
        }}
        status={state.status}
        stockStatus={state.stockStatus}
        unit={state.unit}
      />

      {state.loadError && <EntityErrorState message={state.loadError} />}

      {notice && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
          {notice}
        </p>
      )}

      <ProductsTable
        products={state.paginatedProducts.items}
        loading={state.loading}
        onArchive={(row) => state.archiveProduct(row.product)}
        onEdit={(row) => state.openEditDialog(row.product)}
        onOpen={(row) => router.push(`/sales/products/${row.product.id}`)}
        onRestore={(row) => state.restoreProduct(row.product)}
        onSort={state.updateSort}
        onToggleAll={state.toggleAllVisible}
        onToggleRow={state.toggleRow}
        selectedIds={state.selectedIds}
        sort={state.sort}
      />

      <EntityPagination
        page={state.page}
        pageSize={state.pageSize}
        total={state.totalFiltered}
        hasNextPage={state.paginatedProducts.pagination.hasNextPage}
        hasPreviousPage={state.paginatedProducts.pagination.hasPreviousPage}
        onPageChange={state.setPage}
        onPageSizeChange={state.setPageSize}
      />

      <ProductDialog
        categories={state.categories}
        editing={Boolean(state.editingProduct)}
        error={state.error}
        form={state.form}
        onChange={state.setForm}
        onClose={state.closeDialog}
        onSubmit={state.saveProduct}
        open={state.dialogOpen}
      />

      <ProductImportDialog
        categories={state.categories}
        existingProducts={state.baseProducts}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(message) => {
          setNotice(message);
          setImportOpen(false);
        }}
      />
    </EntityPageLayout>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(amount);
}
