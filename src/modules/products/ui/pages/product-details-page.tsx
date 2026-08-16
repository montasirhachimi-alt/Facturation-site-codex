"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, Boxes, Edit3, PackageCheck, RotateCcw } from "lucide-react";
import { EntityErrorState, EntityHeader, EntityLoadingState, EntityPageLayout, MetricCard, ProductSectionHeader, SectionCard, workspacePrimaryActionClassName, workspaceSecondaryActionClassName } from "@/ui";
import { hydrateInventoryPersistence, hydrateProductCatalogPersistence, persistProductCatalogRecord } from "@/platform/persistence";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { formatInventoryQuantity, movementTypeLabel } from "@/modules/inventory/ui/hooks/use-inventory-workspace";
import { PRODUCTS_USER_ID, PRODUCTS_WORKSPACE_ID } from "../../product.constants";
import { productStockStatusLabel, summarizeProductStock } from "../../product-stock.utils";
import type { Product, ProductId } from "../../product.types";
import { productLocalService, notifyProductStoreUpdated, subscribeToProductStore } from "../product-local-store";
import { ProductDialog } from "../dialogs/product-dialog";
import { useProductsPage } from "../hooks/use-products-page";

export function ProductDetailsPage({ productId }: { productId: string }) {
  const router = useRouter();
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const productForm = useProductsPage();

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribeProducts = subscribeToProductStore(refresh);
    const unsubscribeInventory = subscribeToInventoryStore(refresh);
    return () => {
      unsubscribeProducts();
      unsubscribeInventory();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([hydrateProductCatalogPersistence(), hydrateInventoryPersistence()])
      .catch(() => {
        if (!cancelled) setError("Les données produit n'ont pas pu être actualisées.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  void version;
  const categories = productLocalService.listCategories(PRODUCTS_WORKSPACE_ID).categories;
  const product = productLocalService.getProduct(productId as ProductId, PRODUCTS_WORKSPACE_ID);
  const inventorySnapshot = inventoryLocalService.getSnapshot();
  const stock = useMemo(() => product ? summarizeProductStock(product, inventorySnapshot.balances, inventorySnapshot.movements) : undefined, [inventorySnapshot.balances, inventorySnapshot.movements, product]);

  async function archiveProduct(current: Product) {
    const snapshot = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: true }).products;
    const result = productLocalService.archiveProduct(current.id, PRODUCTS_WORKSPACE_ID, PRODUCTS_USER_ID);
    if (!result.product) return;
    try {
      await persistProductCatalogRecord("product", result.product);
      setNotice("Produit archivé.");
      notifyProductStoreUpdated();
    } catch (persistenceError) {
      productLocalService.replaceProducts(snapshot);
      notifyProductStoreUpdated();
      setError(getProductDetailsPersistenceErrorMessage(persistenceError, "Le produit n'a pas pu être archivé."));
    }
  }

  async function restoreProduct(current: Product) {
    const snapshot = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: true }).products;
    const result = productLocalService.restoreProduct(current.id, PRODUCTS_WORKSPACE_ID, PRODUCTS_USER_ID);
    if (!result.product) return;
    try {
      await persistProductCatalogRecord("product", result.product);
      setNotice("Produit restauré.");
      notifyProductStoreUpdated();
    } catch (persistenceError) {
      productLocalService.replaceProducts(snapshot);
      notifyProductStoreUpdated();
      setError(getProductDetailsPersistenceErrorMessage(persistenceError, "Le produit n'a pas pu être restauré."));
    }
  }

  if (loading) {
    return (
      <EntityPageLayout>
        <EntityLoadingState columns={4} rows={6} />
      </EntityPageLayout>
    );
  }

  if (!product || !stock) {
    return (
      <EntityPageLayout>
        <EntityHeader breadcrumb={["Stock", "Catalogue"]} title="Produit introuvable" description="Ce produit n'existe pas dans le catalogue actif." />
        <EntityErrorState message={error ?? "Le produit demandé est introuvable ou indisponible dans cet espace."} />
        <button type="button" onClick={() => router.push("/sales/products")} className={workspaceSecondaryActionClassName}>
          <ArrowLeft size={16} /> Retour au catalogue
        </button>
      </EntityPageLayout>
    );
  }

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Stock", "Catalogue", product.sku]}
        title={product.name}
        description={product.shortDescription ?? product.description ?? "Fiche produit opérationnelle avec prix, statut et situation stock."}
        meta={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => router.push("/sales/products")} className={workspaceSecondaryActionClassName}>
              <ArrowLeft size={16} /> Catalogue
            </button>
            <button type="button" onClick={() => productForm.openEditDialog(product)} className={workspacePrimaryActionClassName}>
              <Edit3 size={16} /> Modifier
            </button>
            {product.status === "archived" ? (
              <button type="button" onClick={() => void restoreProduct(product)} className={workspaceSecondaryActionClassName}>
                <RotateCcw size={16} /> Restaurer
              </button>
            ) : (
              <button type="button" onClick={() => void archiveProduct(product)} className={workspaceSecondaryActionClassName}>
                <Archive size={16} /> Archiver
              </button>
            )}
          </div>
        }
      />

      {notice && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">{notice}</p>}
      {error && <EntityErrorState message={error} />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="En main" value={formatInventoryQuantity(stock.quantityOnHand)} helper="Quantité physique" icon={PackageCheck} />
        <MetricCard label="Réservé" value={formatInventoryQuantity(stock.quantityReserved)} helper="Engagements ouverts" icon={Boxes} />
        <MetricCard label="Disponible" value={formatInventoryQuantity(stock.quantityAvailable)} helper="Disponible à vendre" icon={PackageCheck} />
        <MetricCard label="Seuil" value={stock.reorderPoint > 0 ? formatInventoryQuantity(stock.reorderPoint) : "Non défini"} helper="Réapprovisionnement" icon={Boxes} />
        <MetricCard label="Santé stock" value={productStockStatusLabel(stock.status)} helper={product.flags.trackInventory ? "Produit stockable" : "Service non stocké"} icon={PackageCheck} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard className="p-4">
          <ProductSectionHeader icon={PackageCheck} title="Informations produit" description="Identité commerciale et paramètres de catalogue." />
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoItem label="SKU" value={product.sku} />
            <InfoItem label="Catégorie" value={product.categoryName ?? "Non classé"} />
            <InfoItem label="Unité" value={product.unit} />
            <InfoItem label="Prix de vente" value={formatMoney(product.sellingPrice, product.currency)} />
            <InfoItem label="Prix d'achat" value={formatMoney(product.purchasePrice, product.currency)} />
            <InfoItem label="TVA" value={`${product.vatRate}%`} />
            <InfoItem label="Statut" value={product.status === "archived" ? "Archivé" : "Actif"} />
            <InfoItem label="Stock" value={product.flags.trackInventory ? "Suivi" : "Non suivi"} />
          </dl>
        </SectionCard>

        <SectionCard className="overflow-hidden">
          <div className="border-b border-slate-200 p-4 dark:border-hicotech-dark-border">
            <ProductSectionHeader icon={Boxes} title="Mouvements récents" description="Dernières écritures postées par le moteur d'inventaire." />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-hicotech-dark-border/70">
            {stock.recentMovements.map((movement) => (
              <div key={movement.id} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[8rem_1fr_auto] md:items-center">
                <span className="font-semibold text-slate-500">{formatDate(movement.postedAt ?? movement.createdAt)}</span>
                <div>
                  <p className="font-black text-hicotech-navy dark:text-white">{movementTypeLabel(movement.type)}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">{movement.reference ?? movement.referenceId ?? movement.reason ?? "Sans référence"}</p>
                </div>
                <span className="font-display text-sm font-black text-hicotech-navy dark:text-white">{formatInventoryQuantity(movement.quantity)}</span>
              </div>
            ))}
            {stock.recentMovements.length === 0 && (
              <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-300">Aucun mouvement inventaire pour ce produit.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <ProductDialog
        categories={categories}
        editing={Boolean(productForm.editingProduct)}
        error={productForm.error}
        form={productForm.form}
        onChange={productForm.setForm}
        onClose={productForm.closeDialog}
        onSubmit={productForm.saveProduct}
        open={productForm.dialogOpen}
      />
    </EntityPageLayout>
  );
}

function getProductDetailsPersistenceErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
      <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-black text-hicotech-navy dark:text-white">{value}</dd>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
