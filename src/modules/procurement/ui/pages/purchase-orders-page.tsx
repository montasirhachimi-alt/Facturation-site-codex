"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { hydrateInventoryPersistence, hydrateProductCatalogPersistence, hydrateProcurementPersistence, persistProcurementRecord, postProcurementGoodsReceipt } from "@/platform/persistence";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, notifyProcurementStoreUpdated, subscribeToProcurementStore } from "../../index";
import { DEFAULT_PROCUREMENT_CURRENCY, PROCUREMENT_USER_ID, PURCHASE_ORDER_STATUS_LABELS } from "../../procurement.constants";
import type { PurchaseOrder } from "../../procurement.types";
import { calculatePurchaseOrderTotals, createEmptyPurchaseOrderLine, formatProcurementMoney, getPurchaseOrderReceiptState } from "../../procurement.utils";
import { GoodsReceiptDialog, type GoodsReceiptFormState, PurchaseOrderDialog, type PurchaseOrderFormState } from "../dialogs";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyOrderForm: PurchaseOrderFormState = {
  supplierId: "",
  issueDate: today(),
  expectedDate: "",
  currency: DEFAULT_PROCUREMENT_CURRENCY,
  reference: "",
  notes: "",
  discountRate: 0,
  lines: [createEmptyPurchaseOrderLine("po")]
};

const emptyReceiptForm: GoodsReceiptFormState = {
  purchaseOrderId: "",
  warehouseId: "",
  receiptDate: today(),
  reference: "",
  notes: "",
  lines: []
};

export function PurchaseOrdersPage() {
  const [version, setVersion] = useState(0);
  const [productVersion, setProductVersion] = useState(0);
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PurchaseOrderFormState>(emptyOrderForm);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState<GoodsReceiptFormState>(emptyReceiptForm);
  const [error, setError] = useState<string | null>(null);

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

  const suppliers = useMemo(() => {
    void version;
    return procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).suppliers;
  }, [version]);
  const purchaseOrders = useMemo(() => {
    void version;
    return procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, query }).purchaseOrders;
  }, [query, version]);
  const products = useMemo(() => {
    void productVersion;
    return productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
  }, [productVersion]);
  const postedReceipts = useMemo(() => {
    void version;
    return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, status: "posted", includeArchived: false }).goodsReceipts;
  }, [version]);
  const warehouses = useMemo(() => {
    void inventoryVersion;
    return inventoryLocalService.getSnapshot().warehouses.filter((warehouse) => warehouse.active);
  }, [inventoryVersion]);

  function openCreate() {
    setForm({ ...emptyOrderForm, lines: [createEmptyPurchaseOrderLine("po")] });
    setError(null);
    setDialogOpen(true);
  }

  async function submitOrder() {
    const supplier = suppliers.find((item) => item.id === form.supplierId);
    if (!supplier) {
      setError("Sélectionnez un fournisseur.");
      return false;
    }
    const snapshot = procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).purchaseOrders;
    const result = procurementLocalService.createPurchaseOrder({
      workspaceId: PROCUREMENT_WORKSPACE_ID,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      issueDate: new Date(form.issueDate || today()).toISOString(),
      expectedDate: form.expectedDate ? new Date(form.expectedDate).toISOString() : undefined,
      currency: form.currency,
      reference: form.reference,
      notes: form.notes,
      lines: form.lines,
      discountRate: form.discountRate,
      ownerId: PROCUREMENT_USER_ID
    });
    if (!result.purchaseOrder) {
      setError(result.error ?? "Impossible de créer la commande fournisseur.");
      return false;
    }
    try {
      await persistProcurementRecord("purchaseOrder", result.purchaseOrder);
    } catch {
      procurementLocalService.replacePurchaseOrders(snapshot);
      setError("La commande fournisseur n'a pas pu être enregistrée.");
      return false;
    }
    notifyProcurementStoreUpdated();
    setDialogOpen(false);
    return true;
  }

  function openReceive(order: PurchaseOrder) {
    setReceiptForm({
      ...emptyReceiptForm,
      purchaseOrderId: order.id,
      warehouseId: warehouses.find((warehouse) => warehouse.isDefault)?.id ?? warehouses[0]?.id ?? "",
      lines: []
    });
    setError(null);
    setReceiptDialogOpen(true);
  }

  async function submitReceipt() {
    const order = purchaseOrders.find((item) => item.id === receiptForm.purchaseOrderId);
    if (!order) {
      setError("Sélectionnez une commande fournisseur.");
      return false;
    }
    const warehouse = warehouses.find((item) => item.id === receiptForm.warehouseId);
    if (!warehouse) {
      setError("Sélectionnez un entrepôt actif.");
      return false;
    }
    const receiptSnapshot = procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).goodsReceipts;
    const result = procurementLocalService.createGoodsReceipt({
      workspaceId: PROCUREMENT_WORKSPACE_ID,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      purchaseOrderId: order.id,
      purchaseOrderNumber: order.number,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      receiptDate: new Date(receiptForm.receiptDate || today()).toISOString(),
      reference: receiptForm.reference,
      notes: receiptForm.notes,
      lines: receiptForm.lines,
      ownerId: PROCUREMENT_USER_ID
    });
    if (!result.goodsReceipt) {
      setError(result.error ?? "Impossible de préparer la réception.");
      return false;
    }
    try {
      await postProcurementGoodsReceipt(result.goodsReceipt);
    } catch (saveError) {
      procurementLocalService.replaceGoodsReceipts(receiptSnapshot);
      setError(saveError instanceof Error ? saveError.message : "La réception n'a pas pu être postée.");
      return false;
    }
    setReceiptDialogOpen(false);
    return true;
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Achats</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Commandes fournisseur</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Suivez les commandes fournisseur et réceptionnez les quantités vers le stock.</p>
          </div>
          <button onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">
            <Plus size={16} /> Nouvelle commande
          </button>
        </div>
        <input className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Rechercher une commande..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </section>
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Lignes</th>
              <th className="px-4 py-3">Réception</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((order) => {
              const totals = calculatePurchaseOrderTotals(order);
              const receiptState = getPurchaseOrderReceiptState(order, postedReceipts);
              const canReceive = receiptState.remainingQuantity > 0 && order.status !== "cancelled" && order.status !== "archived";
              return (
                <tr key={order.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                  <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{order.number}<p className="text-xs font-medium text-slate-500">{new Date(order.issueDate).toLocaleDateString("fr-MA")}</p></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{order.supplierName}</td>
                  <td className="px-4 py-3">{PURCHASE_ORDER_STATUS_LABELS[order.status]}</td>
                  <td className="px-4 py-3">{order.lines.length}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{receiptState.receivedQuantity} / {receiptState.orderedQuantity}</td>
                  <td className="px-4 py-3 text-right font-bold text-hicotech-navy dark:text-white">{formatProcurementMoney(totals.total, order.currency)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" disabled={!canReceive} onClick={() => openReceive(order)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-navy disabled:cursor-not-allowed disabled:opacity-40 dark:border-hicotech-dark-border dark:text-white">Recevoir</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <PurchaseOrderDialog error={error} form={form} onChange={setForm} onClose={() => setDialogOpen(false)} onSubmit={submitOrder} open={dialogOpen} products={products} suppliers={suppliers} />
      <GoodsReceiptDialog error={error} form={receiptForm} onChange={setReceiptForm} onClose={() => setReceiptDialogOpen(false)} onSubmit={submitReceipt} open={receiptDialogOpen} postedReceipts={postedReceipts} purchaseOrders={purchaseOrders} warehouses={warehouses} />
    </main>
  );
}
