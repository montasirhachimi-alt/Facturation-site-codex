"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, PackageCheck, Truck } from "lucide-react";
import { hydrateInventoryPersistence, hydrateProductCatalogPersistence, hydrateProcurementPersistence } from "@/platform/persistence";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { summarizeProductStock } from "@/modules/products/product-stock.utils";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { MetricCard, ProductSectionHeader, SectionCard } from "@/ui";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, subscribeToProcurementStore } from "../../index";
import { PURCHASE_ORDER_STATUS_LABELS } from "../../procurement.constants";
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

  const draftOrders = purchaseOrders.filter((order) => order.status === "draft");
  const awaitingReceipt = purchaseOrders.filter((order) => ["confirmed", "partially_received"].includes(order.status) && getPurchaseOrderReceiptState(order, receipts).remainingQuantity > 0);
  const lowStockProducts = products
    .filter((product) => product.flags.trackInventory)
    .map((product) => ({ product, stock: summarizeProductStock(product, inventory.balances, inventory.movements) }))
    .filter((item) => item.stock.status === "lowStock" || item.stock.status === "outOfStock")
    .slice(0, 4);
  const recentReceipts = receipts.slice(0, 4);

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

      <section className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCard icon={FileText} label="Brouillons" value={String(draftOrders.length)} helper="Commandes à finaliser" />
        <MetricCard icon={PackageCheck} label="À réceptionner" value={String(awaitingReceipt.length)} helper="Commandes confirmées avec reliquat" />
        <MetricCard icon={AlertTriangle} label="Stock faible" value={String(lowStockProducts.length)} helper="Produits à réapprovisionner" />
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
            {lowStockProducts.map(({ product, stock }) => (
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
