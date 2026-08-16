"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PackageCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { hydrateInventoryPersistence, hydrateProductCatalogPersistence, hydrateProcurementPersistence } from "@/platform/persistence";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { summarizeProductStock } from "@/modules/products/product-stock.utils";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { ProductSectionHeader, SectionCard } from "@/ui";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, subscribeToProcurementStore } from "../index";
import { getPurchaseOrderReceiptState } from "../procurement.utils";

export function ProcurementDashboardSection() {
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

  const drafts = purchaseOrders.filter((order) => order.status === "draft").length;
  const awaitingReceipt = purchaseOrders.filter((order) => ["confirmed", "partially_received"].includes(order.status) && getPurchaseOrderReceiptState(order, receipts).remainingQuantity > 0).length;
  const lowStock = products.filter((product) => {
    if (!product.flags.trackInventory) return false;
    const stock = summarizeProductStock(product, inventory.balances, inventory.movements);
    return stock.status === "lowStock" || stock.status === "outOfStock";
  }).length;
  const recentReceipt = receipts[0];

  return (
    <SectionCard className="p-4">
      <ProductSectionHeader icon={Truck} title="Achats fournisseurs" description="Commandes, réceptions et besoins de réapprovisionnement." />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <DashboardProcurementMetric href="/procurement/purchase-orders" icon={Truck} label="Brouillons" value={String(drafts)} />
        <DashboardProcurementMetric href="/procurement/purchase-orders" icon={PackageCheck} label="À recevoir" value={String(awaitingReceipt)} />
        <DashboardProcurementMetric href="/procurement" icon={AlertTriangle} label="Stock faible" value={String(lowStock)} />
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Réception récente</p>
        <p className="mt-1 font-bold text-hicotech-navy dark:text-white">{recentReceipt ? `${recentReceipt.number} · ${recentReceipt.supplierName}` : "Aucune réception postée"}</p>
      </div>
    </SectionCard>
  );
}

function DashboardProcurementMetric({ href, icon: Icon, label, value }: { href: string; icon: LucideIcon; label: string; value: string }) {
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:shadow-md dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <span className="grid size-8 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-white/10">
        <Icon size={15} />
      </span>
      <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className="mt-1 block font-display text-2xl font-bold text-hicotech-navy dark:text-white">{value}</span>
    </Link>
  );
}
