"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageCheck, Plus } from "lucide-react";
import { hydrateInventoryPersistence } from "@/platform/persistence/inventory-persistence.client";
import { hydrateProcurementPersistence, postProcurementGoodsReceipt } from "@/platform/persistence/procurement-persistence.client";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, subscribeToProcurementStore } from "../../index";
import { GOODS_RECEIPT_STATUS_LABELS, PROCUREMENT_USER_ID } from "../../procurement.constants";
import type { GoodsReceipt, PurchaseOrder } from "../../procurement.types";
import { GoodsReceiptDialog, type GoodsReceiptFormState } from "../dialogs";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyReceiptForm: GoodsReceiptFormState = {
  purchaseOrderId: "",
  warehouseId: "",
  receiptDate: today(),
  reference: "",
  notes: "",
  lines: []
};

export function GoodsReceiptsPage() {
  const [version, setVersion] = useState(0);
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<GoodsReceiptFormState>(emptyReceiptForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hydrateProcurementPersistence();
    void hydrateInventoryPersistence();
    const unsubscribeProcurement = subscribeToProcurementStore(() => setVersion((value) => value + 1));
    const unsubscribeInventory = subscribeToInventoryStore(() => setInventoryVersion((value) => value + 1));
    return () => {
      unsubscribeProcurement();
      unsubscribeInventory();
    };
  }, []);

  const purchaseOrders = useMemo(() => {
    void version;
    return procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).purchaseOrders;
  }, [version]);

  const receivableOrders = useMemo(() => purchaseOrders.filter((order) => order.status !== "received" && order.status !== "cancelled" && order.status !== "archived"), [purchaseOrders]);

  const receipts = useMemo(() => {
    void version;
    return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, query }).goodsReceipts;
  }, [query, version]);

  const postedReceipts = useMemo(() => {
    void version;
    return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, status: "posted", includeArchived: false }).goodsReceipts;
  }, [version]);

  const warehouses = useMemo(() => {
    void inventoryVersion;
    return inventoryLocalService.getSnapshot().warehouses.filter((warehouse) => warehouse.active);
  }, [inventoryVersion]);

  function openCreate(order?: PurchaseOrder) {
    setForm({
      ...emptyReceiptForm,
      purchaseOrderId: order?.id ?? "",
      warehouseId: warehouses.find((warehouse) => warehouse.isDefault)?.id ?? warehouses[0]?.id ?? "",
      lines: []
    });
    setError(null);
    setDialogOpen(true);
  }

  async function submitReceipt() {
    const order = purchaseOrders.find((item) => item.id === form.purchaseOrderId);
    if (!order) {
      setError("Sélectionnez une commande fournisseur.");
      return false;
    }
    const warehouse = warehouses.find((item) => item.id === form.warehouseId);
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
      receiptDate: new Date(form.receiptDate || today()).toISOString(),
      reference: form.reference,
      notes: form.notes,
      lines: form.lines,
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
    setDialogOpen(false);
    return true;
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Achats</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Réceptions fournisseur</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Postez les quantités reçues et alimentez le stock depuis les commandes fournisseur.</p>
          </div>
          <button onClick={() => openCreate()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">
            <Plus size={16} /> Nouvelle réception
          </button>
        </div>
        <input className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Rechercher une réception..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </section>
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-4 py-3">Réception</th>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Entrepôt</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Quantité</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">
                  {receipt.number}
                  <p className="text-xs font-medium text-slate-500">{new Date(receipt.receiptDate).toLocaleDateString("fr-MA")}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{receipt.purchaseOrderNumber}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{receipt.supplierName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{receipt.warehouseName ?? receipt.warehouseId}</td>
                <td className="px-4 py-3">{GOODS_RECEIPT_STATUS_LABELS[receipt.status]}</td>
                <td className="px-4 py-3 text-right font-bold text-hicotech-navy dark:text-white">{sumReceiptQuantity(receipt)}</td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <PackageCheck className="mx-auto mb-3 text-slate-400" size={28} />
                  <p className="font-display text-base font-bold text-hicotech-navy dark:text-white">Aucune réception fournisseur.</p>
                  <p className="mt-1 text-sm text-slate-500">Créez une réception depuis une commande fournisseur confirmée.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      <GoodsReceiptDialog error={error} form={form} onChange={setForm} onClose={() => setDialogOpen(false)} onSubmit={submitReceipt} open={dialogOpen} postedReceipts={postedReceipts} purchaseOrders={receivableOrders} warehouses={warehouses} />
    </main>
  );
}

function sumReceiptQuantity(receipt: GoodsReceipt) {
  return receipt.lines.reduce((total, line) => total + line.receivedQuantity, 0);
}
