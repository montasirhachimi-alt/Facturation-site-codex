"use client";

import { useState } from "react";
import { BadgePercent, Coins, PackageCheck, Tags } from "lucide-react";
import { EntityHeader, EntityPageLayout, EntityPagination, EntityStatsCards, InfoCard } from "@/ui";
import { ProductDialog } from "../dialogs/product-dialog";
import { ProductImportDialog } from "../dialogs/product-import-dialog";
import { downloadProductImportTemplate, downloadProductsExport } from "../product-file-io";
import { useProductsPage } from "../hooks/use-products-page";
import { ProductsTable } from "../tables/products-table";
import { ProductsToolbar } from "../toolbar/products-toolbar";

export function ProductsPage() {
  const state = useProductsPage();
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Business Platform", "Catalogue"]}
        title="Catalogue produits"
        description="Fondation canonique des produits pour les futurs modules ventes, stock, achats, livraison et reporting."
        meta={<InfoCard>Module préparé : non visible dans l&apos;Alpha tant que l&apos;activation ne l&apos;autorise pas.</InfoCard>}
      />

      <EntityStatsCards
        metrics={[
          { icon: PackageCheck, label: "Produits actifs", value: String(state.stats.total), helper: "Catalogue opérationnel" },
          { icon: Tags, label: "Catégories", value: String(state.stats.categories), helper: "Classification produit" },
          { icon: Coins, label: "Prix moyen", value: formatMoney(state.stats.averagePrice), helper: "Prix de vente HT" },
          { icon: BadgePercent, label: "Archive", value: String(state.stats.archived), helper: "Produits retirés" }
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
        setUnit={(value) => {
          state.setUnit(value);
          state.resetPage();
        }}
        status={state.status}
        unit={state.unit}
      />

      {notice && (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
          {notice}
        </p>
      )}

      <ProductsTable
        products={state.paginatedProducts.items}
        onArchive={state.archiveProduct}
        onEdit={state.openEditDialog}
        onRestore={state.restoreProduct}
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
