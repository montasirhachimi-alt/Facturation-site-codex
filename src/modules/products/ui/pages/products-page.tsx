"use client";

import { BadgePercent, Coins, PackageCheck, Tags } from "lucide-react";
import { EntityHeader, EntityPageLayout, EntityPagination, EntityStatsCards, InfoCard } from "@/ui";
import { ProductDialog } from "../dialogs/product-dialog";
import { useProductsPage } from "../hooks/use-products-page";
import { ProductsTable } from "../tables/products-table";
import { ProductsToolbar } from "../toolbar/products-toolbar";

export function ProductsPage() {
  const state = useProductsPage();

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
        query={state.query}
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
    </EntityPageLayout>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(amount);
}
