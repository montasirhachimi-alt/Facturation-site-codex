"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Building2, FileText, PackageCheck, TrendingUp, Truck, WalletCards } from "lucide-react";
import { hydrateInventoryPersistence, hydrateProductCatalogPersistence, hydrateProcurementPersistence } from "@/platform/persistence";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { summarizeProductStock } from "@/modules/products/product-stock.utils";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { MetricCard, ProductSectionHeader, SectionCard } from "@/ui";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, subscribeToProcurementStore } from "../../index";
import { PURCHASE_ORDER_STATUS_LABELS } from "../../procurement.constants";
import { buildProcurementCockpitAnalytics, type ProcurementMonthPoint, type ProcurementSupplierRanking } from "../../procurement.analytics";
import { getPurchaseOrderReceiptState } from "../../procurement.utils";

export function ProcurementOverviewPage() {
  const [version, setVersion] = useState(0);
  const [productVersion, setProductVersion] = useState(0);
  const [inventoryVersion, setInventoryVersion] = useState(0);

  useEffect(() => {
    void hydrateProcurementPersistence();
    void hydrateProductCatalogPersistence();
    void hydrateInventoryPersistence();
    const unsubscribeProcurement = subscribeToProcurementStore(() => setVersion((value) => value + 1));
    const unsubscribeProducts = subscribeToProductStore(() => setProductVersion((value) => value + 1));
    const unsubscribeInventory = subscribeToInventoryStore(() => setInventoryVersion((value) => value + 1));
    return () => {
      unsubscribeProcurement();
      unsubscribeProducts();
      unsubscribeInventory();
    };
  }, []);

  const purchaseOrders = useMemo(() => {
    void version;
    return procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).purchaseOrders;
  }, [version]);
  const suppliers = useMemo(() => {
    void version;
    return procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).suppliers;
  }, [version]);
  const receipts = useMemo(() => {
    void version;
    return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, status: "posted", includeArchived: false }).goodsReceipts;
  }, [version]);
  const products = useMemo(() => {
    void productVersion;
    return productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
  }, [productVersion]);
  const inventory = useMemo(() => {
    void inventoryVersion;
    return inventoryLocalService.getSnapshot();
  }, [inventoryVersion]);

  const awaitingReceipt = purchaseOrders.filter((order) => ["confirmed", "partially_received"].includes(order.status) && getPurchaseOrderReceiptState(order, receipts).remainingQuantity > 0);
  const lowStockProducts = products
    .filter((product) => product.flags.trackInventory)
    .map((product) => ({ product, stock: summarizeProductStock(product, inventory.balances, inventory.movements) }))
    .filter((item) => item.stock.status === "lowStock" || item.stock.status === "outOfStock");
  const visibleLowStockProducts = lowStockProducts.slice(0, 4);
  const recentReceipts = receipts.slice(0, 4);
  const analytics = useMemo(
    () => buildProcurementCockpitAnalytics({ purchaseOrders, receipts, suppliers }),
    [purchaseOrders, receipts, suppliers]
  );

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Procurement</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-hicotech-navy dark:text-white">Achats fournisseurs</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">Pilotez les fournisseurs, commandes et réceptions qui alimentent le stock opérationnel.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/procurement/suppliers" className="rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">Fournisseurs</Link>
          <Link href="/procurement/purchase-orders" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Commandes fournisseur</Link>
          <Link href="/procurement/goods-receipts" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Réceptions</Link>
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={WalletCards} label="Achats du mois" value={formatProcurementCompactMoney(analytics.monthPurchaseValue)} helper={formatMonthComparison(analytics)} />
        <MetricCard icon={TrendingUp} label="Montant engagé" value={formatProcurementCompactMoney(analytics.committedAmount)} helper="Commandes confirmées ou partiellement reçues" />
        <MetricCard icon={FileText} label="Commandes ouvertes" value={String(analytics.openPurchaseOrders)} helper="Envoyées, confirmées ou partiellement reçues" />
        <MetricCard icon={PackageCheck} label="À réceptionner" value={String(analytics.awaitingReceiptOrders)} helper="Commandes avec reliquat fournisseur" />
        <MetricCard icon={Building2} label="Fournisseurs actifs" value={String(analytics.activeSuppliers)} helper="Fournisseurs non archivés" />
        <MetricCard icon={AlertTriangle} label="Stock faible" value={String(lowStockProducts.length)} helper="Produits à réapprovisionner" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard className="p-4">
          <ProductSectionHeader icon={BarChart3} title="Évolution des achats" description="Valeur mensuelle des commandes fournisseur validées, hors brouillons et annulations." />
          <MonthlyPurchaseTrend points={analytics.monthlyTrend} />
        </SectionCard>

        <SectionCard className="p-4">
          <ProductSectionHeader icon={TrendingUp} title="Top fournisseurs" description="Classement par montant commandé validé sur les données achats actuelles." />
          <TopSuppliersRanking suppliers={analytics.topSuppliers} />
        </SectionCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard className="p-4">
          <ProductSectionHeader icon={Truck} title="Commandes à recevoir" description="Les commandes confirmées qui attendent une réception partielle ou complète." />
          <div className="mt-4 space-y-3">
            {awaitingReceipt.map((order) => (
              <Link key={order.id} href={`/procurement/purchase-orders/${order.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-hicotech-sky/60 dark:bg-hicotech-dark-page/50">
                <span>
                  <span className="block font-bold text-hicotech-navy dark:text-white">{order.number}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">{order.supplierName} · {PURCHASE_ORDER_STATUS_LABELS[order.status]}</span>
                </span>
                <span className="text-xs font-bold text-hicotech-blue">Recevoir</span>
              </Link>
            ))}
            {awaitingReceipt.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">Aucune commande en attente de réception.</p>}
          </div>
        </SectionCard>

        <SectionCard className="p-4">
          <ProductSectionHeader icon={AlertTriangle} title="Réapprovisionnement" description="Produits stockables proches du point de commande." />
          <div className="mt-4 space-y-3">
            {visibleLowStockProducts.map(({ product, stock }) => (
              <Link key={product.id} href={`/sales/products/${product.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-hicotech-sky/60 dark:bg-hicotech-dark-page/50">
                <span>
                  <span className="block font-bold text-hicotech-navy dark:text-white">{product.sku} · {product.name}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">Disponible {stock.quantityAvailable} · Point {stock.reorderPoint}</span>
                </span>
                <span className="text-xs font-bold text-amber-600">À acheter</span>
              </Link>
            ))}
            {lowStockProducts.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">Aucun produit sous le point de commande.</p>}
          </div>
        </SectionCard>
      </section>

      <SectionCard className="mt-4 overflow-hidden">
        <div className="p-4 pb-0">
          <ProductSectionHeader icon={PackageCheck} title="Réceptions récentes" description="Les derniers mouvements d'entrée postés vers le stock." />
        </div>
        <div className="mt-4 divide-y divide-slate-100 dark:divide-hicotech-dark-border">
          {recentReceipts.map((receipt) => (
            <div key={receipt.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="block font-bold text-hicotech-navy dark:text-white">{receipt.number}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{receipt.purchaseOrderNumber} · {receipt.supplierName}</span>
              </span>
              <span className="text-right text-xs font-bold text-hicotech-blue">{receipt.lines.reduce((total, line) => total + line.receivedQuantity, 0)} reçu(s)</span>
            </div>
          ))}
          {recentReceipts.length === 0 && <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Aucune réception récente.</p>}
        </div>
      </SectionCard>
    </main>
  );
}

function MonthlyPurchaseTrend({ points }: { points: readonly ProcurementMonthPoint[] }) {
  const maxValue = Math.max(0, ...points.map((point) => point.value));

  return (
    <div className="mt-5 flex min-h-[13rem] items-end gap-3">
      {points.map((point) => {
        const height = maxValue > 0 ? Math.max(10, Math.round((point.value / maxValue) * 100)) : 4;
        return (
          <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end rounded-xl bg-slate-50 p-1.5 dark:bg-hicotech-dark-page/50">
              <div
                className="w-full rounded-lg bg-hicotech-blue shadow-sm shadow-blue-200/70 transition-all dark:shadow-none"
                style={{ height: `${height}%` }}
                title={`${point.label}: ${formatProcurementMoney(point.value)}`}
                aria-label={`${point.label}: ${formatProcurementMoney(point.value)}`}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{point.label}</span>
            <span className="max-w-full truncate text-xs font-bold text-hicotech-navy dark:text-white">{formatProcurementCompactMoney(point.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TopSuppliersRanking({ suppliers }: { suppliers: readonly ProcurementSupplierRanking[] }) {
  const maxValue = Math.max(0, ...suppliers.map((supplier) => supplier.value));

  if (suppliers.length === 0) {
    return <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">Aucun fournisseur classable pour le moment.</p>;
  }

  return (
    <div className="mt-5 space-y-4">
      {suppliers.map((supplier, index) => {
        const width = maxValue > 0 ? Math.max(8, Math.round((supplier.value / maxValue) * 100)) : 0;
        return (
          <div key={supplier.supplierId} className="space-y-2">
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-bold text-hicotech-navy dark:text-white">{index + 1}. {supplier.supplierName}</span>
                <span className="text-xs font-semibold text-slate-500">{supplier.orderCount} commande(s)</span>
              </span>
              <span className="shrink-0 text-xs font-black text-hicotech-blue">{formatProcurementCompactMoney(supplier.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-hicotech-dark-page/60">
              <div className="h-full rounded-full bg-hicotech-navy dark:bg-hicotech-blue" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatMonthComparison(analytics: { monthPurchaseDeltaPercent?: number; previousMonthPurchaseValue: number }) {
  if (analytics.monthPurchaseDeltaPercent === undefined) return "Mois précédent sans base comparable";
  if (analytics.previousMonthPurchaseValue === 0) return "Mois précédent à 0 MAD";
  const sign = analytics.monthPurchaseDeltaPercent > 0 ? "+" : "";
  return `${sign}${analytics.monthPurchaseDeltaPercent.toLocaleString("fr-MA", { maximumFractionDigits: 1 })} % vs mois précédent`;
}

function formatProcurementCompactMoney(value: number) {
  if (value >= 1000000) return `${formatCompact(value / 1000000)} M MAD`;
  if (value >= 1000) return `${formatCompact(value / 1000)} k MAD`;
  return formatProcurementMoney(value);
}

function formatProcurementMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value);
}

function formatCompact(value: number) {
  return value.toLocaleString("fr-MA", { maximumFractionDigits: 1 });
}
