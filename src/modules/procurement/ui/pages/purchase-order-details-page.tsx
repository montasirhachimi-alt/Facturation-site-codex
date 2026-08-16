"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, Edit3, PackageCheck, ReceiptText, XCircle } from "lucide-react";
import { hydrateInventoryPersistence, hydrateProductCatalogPersistence, hydrateProcurementPersistence, persistProcurementRecord, postProcurementGoodsReceipt } from "@/platform/persistence";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { MetricCard, ProductSectionHeader, SectionCard } from "@/ui";
import { DEFAULT_PROCUREMENT_CURRENCY, PROCUREMENT_USER_ID, PURCHASE_ORDER_STATUS_LABELS } from "../../procurement.constants";
import { PROCUREMENT_WORKSPACE_ID, notifyProcurementStoreUpdated, procurementLocalService, subscribeToProcurementStore } from "../../index";
import type { PurchaseOrder, PurchaseOrderId } from "../../procurement.types";
import { calculatePurchaseOrderTotals, createEmptyPurchaseOrderLine, formatProcurementMoney, getPurchaseOrderReceiptState } from "../../procurement.utils";
import { GoodsReceiptDialog, type GoodsReceiptFormState, PurchaseOrderDialog, type PurchaseOrderFormState } from "../dialogs";

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

export function PurchaseOrderDetailsPage({ purchaseOrderId }: { purchaseOrderId: string }) {
  const [version, setVersion] = useState(0);
  const [productVersion, setProductVersion] = useState(0);
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [form, setForm] = useState<PurchaseOrderFormState | null>(null);
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

  const order = useMemo(() => {
    void version;
    return procurementLocalService.getPurchaseOrder(purchaseOrderId as PurchaseOrderId, PROCUREMENT_WORKSPACE_ID);
  }, [purchaseOrderId, version]);
  const suppliers = useMemo(() => {
    void version;
    return procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).suppliers;
  }, [version]);
  const postedReceipts = useMemo(() => {
    void version;
    return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, status: "posted", includeArchived: false }).goodsReceipts;
  }, [version]);
  const relatedReceipts = useMemo(() => {
    void version;
    return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, purchaseOrderId: purchaseOrderId as PurchaseOrderId, includeArchived: false }).goodsReceipts;
  }, [purchaseOrderId, version]);
  const products = useMemo(() => {
    void productVersion;
    return productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
  }, [productVersion]);
  const warehouses = useMemo(() => {
    void inventoryVersion;
    return inventoryLocalService.getSnapshot().warehouses.filter((warehouse) => warehouse.active);
  }, [inventoryVersion]);

  if (!order) {
    return (
      <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
        <SectionCard className="p-6 text-center">
          <p className="font-display text-xl font-bold text-hicotech-navy dark:text-white">Commande fournisseur introuvable.</p>
          <Link href="/procurement/purchase-orders" className="mt-4 inline-flex rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">Retour aux commandes</Link>
        </SectionCard>
      </main>
    );
  }

  const orderValue = order;
  const totals = calculatePurchaseOrderTotals(orderValue);
  const receiptState = getPurchaseOrderReceiptState(orderValue, postedReceipts);
  const canEdit = orderValue.status === "draft";
  const canConfirm = orderValue.status === "draft";
  const canCancel = ["draft", "confirmed"].includes(orderValue.status);
  const canReceive = receiptState.remainingQuantity > 0 && ["confirmed", "partially_received"].includes(orderValue.status);

  function openEdit() {
    setForm({
      supplierId: orderValue.supplierId,
      issueDate: orderValue.issueDate.slice(0, 10),
      expectedDate: orderValue.expectedDate?.slice(0, 10) ?? "",
      currency: orderValue.currency,
      reference: orderValue.reference ?? "",
      notes: orderValue.notes ?? "",
      discountRate: orderValue.discountRate,
      lines: [...orderValue.lines]
    });
    setError(null);
    setDialogOpen(true);
  }

  async function submitOrder() {
    if (!form) return false;
    const supplier = suppliers.find((item) => item.id === form.supplierId);
    if (!supplier) {
      setError("Sélectionnez un fournisseur.");
      return false;
    }
    const snapshot = procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).purchaseOrders;
    const result = procurementLocalService.updatePurchaseOrder({
      id: orderValue.id,
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
      status: orderValue.status
    });
    if (!result.purchaseOrder) {
      setError(result.error ?? "Impossible d'enregistrer la commande fournisseur.");
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

  async function updateOrderStatus(status: PurchaseOrder["status"]) {
    const snapshot = procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).purchaseOrders;
    const result = procurementLocalService.updatePurchaseOrder({ id: orderValue.id, workspaceId: PROCUREMENT_WORKSPACE_ID, status });
    if (!result.purchaseOrder) return;
    try {
      await persistProcurementRecord("purchaseOrder", result.purchaseOrder);
    } catch {
      procurementLocalService.replacePurchaseOrders(snapshot);
    }
    notifyProcurementStoreUpdated();
  }

  async function duplicateOrder() {
    const snapshot = procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).purchaseOrders;
    const result = procurementLocalService.createPurchaseOrder({
      workspaceId: PROCUREMENT_WORKSPACE_ID,
      supplierId: orderValue.supplierId,
      supplierName: orderValue.supplierName,
      issueDate: new Date().toISOString(),
      expectedDate: orderValue.expectedDate,
      currency: orderValue.currency || DEFAULT_PROCUREMENT_CURRENCY,
      reference: orderValue.reference ? `Copie de ${orderValue.reference}` : `Copie de ${orderValue.number}`,
      notes: orderValue.notes,
      lines: orderValue.lines.map((line) => ({ ...line, id: createEmptyPurchaseOrderLine("po-copy").id })),
      discountRate: orderValue.discountRate,
      ownerId: PROCUREMENT_USER_ID
    });
    if (!result.purchaseOrder) return;
    try {
      await persistProcurementRecord("purchaseOrder", result.purchaseOrder);
    } catch {
      procurementLocalService.replacePurchaseOrders(snapshot);
    }
    notifyProcurementStoreUpdated();
  }

  function openReceive() {
    setReceiptForm({
      ...emptyReceiptForm,
      purchaseOrderId: orderValue.id,
      warehouseId: warehouses.find((warehouse) => warehouse.isDefault)?.id ?? warehouses[0]?.id ?? "",
      lines: []
    });
    setError(null);
    setReceiptDialogOpen(true);
  }

  async function submitReceipt() {
    const warehouse = warehouses.find((item) => item.id === receiptForm.warehouseId);
    if (!warehouse) {
      setError("Sélectionnez un entrepôt actif.");
      return false;
    }
    const receiptSnapshot = procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).goodsReceipts;
    const result = procurementLocalService.createGoodsReceipt({
      workspaceId: PROCUREMENT_WORKSPACE_ID,
      supplierId: orderValue.supplierId,
      supplierName: orderValue.supplierName,
      purchaseOrderId: orderValue.id,
      purchaseOrderNumber: orderValue.number,
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
        <Link href="/procurement/purchase-orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-hicotech-blue">
          <ArrowLeft size={16} /> Commandes fournisseur
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Commande fournisseur</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-hicotech-navy dark:text-white">{orderValue.number}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{orderValue.supplierName} · {PURCHASE_ORDER_STATUS_LABELS[orderValue.status]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && <button type="button" onClick={openEdit} title="Modifier" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20"><Edit3 size={16} /> Modifier</button>}
            {canConfirm && <button type="button" onClick={() => updateOrderStatus("confirmed")} title="Confirmer la commande" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:hover:bg-emerald-500/10"><CheckCircle2 size={16} /> Confirmer</button>}
            <button type="button" onClick={duplicateOrder} title="Dupliquer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page/50"><Copy size={16} /> Dupliquer</button>
            {canReceive && <button type="button" onClick={openReceive} title="Créer une réception fournisseur" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-hicotech-blue/30 px-4 py-2 text-sm font-bold text-hicotech-blue transition hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10"><PackageCheck size={16} /> Créer une réception</button>}
            {canCancel && <button type="button" onClick={() => updateOrderStatus("cancelled")} title="Annuler la commande" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-slate-300 dark:hover:bg-hicotech-dark-page/50"><XCircle size={16} /> Annuler</button>}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-5">
        <MetricCard icon={ReceiptText} label="Sous-total HT" value={formatProcurementMoney(totals.subtotal, orderValue.currency)} helper="Avant remise et taxe" />
        <MetricCard icon={ReceiptText} label="Remise" value={formatProcurementMoney(totals.discount, orderValue.currency)} helper="Lignes et remise globale" />
        <MetricCard icon={ReceiptText} label="TVA" value={formatProcurementMoney(totals.tax, orderValue.currency)} helper="Selon lignes" />
        <MetricCard icon={ReceiptText} label="Total TTC" value={formatProcurementMoney(totals.total, orderValue.currency)} helper="Grand total" />
        <MetricCard icon={PackageCheck} label="Réception" value={`${receiptState.receivedQuantity}/${receiptState.orderedQuantity}`} helper={`${receiptState.remainingQuantity} restant`} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <SectionCard className="overflow-hidden">
          <div className="p-4 pb-0">
            <ProductSectionHeader icon={ReceiptText} title="Lignes d'achat" description="Produits, quantités, coûts et sous-totaux." />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
                <tr>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3 text-right">Qté</th>
                  <th className="px-4 py-3 text-right">Coût unitaire HT</th>
                  <th className="px-4 py-3 text-right">TVA</th>
                  <th className="px-4 py-3 text-right">Sous-total HT</th>
                </tr>
              </thead>
              <tbody>
                {orderValue.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{line.productSku ? `${line.productSku} · ` : ""}{line.description}<p className="text-xs font-medium text-slate-500">{line.productName ?? line.unit}</p></td>
                    <td className="px-4 py-3 text-right">{line.quantity} {line.unit}</td>
                    <td className="px-4 py-3 text-right">{formatProcurementMoney(line.unitPrice, orderValue.currency)}</td>
                    <td className="px-4 py-3 text-right">{line.taxRate}%</td>
                    <td className="px-4 py-3 text-right font-bold text-hicotech-navy dark:text-white">{formatProcurementMoney(line.quantity * line.unitPrice, orderValue.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard className="p-4">
            <ProductSectionHeader icon={PackageCheck} title="Réceptions" description="Quantités déjà postées et reliquat à recevoir." />
            <div className="mt-4 space-y-3">
              {relatedReceipts.map((receipt) => (
                <div key={receipt.id} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-hicotech-dark-page/50">
                  <p className="text-sm font-bold text-hicotech-navy dark:text-white">{receipt.number}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{receipt.warehouseName ?? receipt.warehouseId} · {receipt.lines.reduce((total, line) => total + line.receivedQuantity, 0)} reçu(s)</p>
                </div>
              ))}
              {relatedReceipts.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">Aucune réception postée. Cliquez sur &quot;Créer une réception&quot; dès que la marchandise arrive.</p>}
            </div>
          </SectionCard>
          <SectionCard className="p-4">
            <ProductSectionHeader icon={ReceiptText} title="Informations" description="Référence, dates et notes." />
            <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <p>Fournisseur: <span className="text-hicotech-navy dark:text-white">{orderValue.supplierName}</span></p>
              <p>Date: <span className="text-hicotech-navy dark:text-white">{new Date(orderValue.issueDate).toLocaleDateString("fr-MA")}</span></p>
              <p>Livraison prévue: <span className="text-hicotech-navy dark:text-white">{orderValue.expectedDate ? new Date(orderValue.expectedDate).toLocaleDateString("fr-MA") : "-"}</span></p>
              <p>Référence: <span className="text-hicotech-navy dark:text-white">{orderValue.reference ?? "-"}</span></p>
              <p>Notes: <span className="text-hicotech-navy dark:text-white">{orderValue.notes ?? "-"}</span></p>
            </div>
          </SectionCard>
        </div>
      </section>

      {form && <PurchaseOrderDialog editing error={error} form={form} onChange={setForm} onClose={() => setDialogOpen(false)} onSubmit={submitOrder} open={dialogOpen} products={products} suppliers={suppliers} />}
      <GoodsReceiptDialog error={error} form={receiptForm} onChange={setReceiptForm} onClose={() => setReceiptDialogOpen(false)} onSubmit={submitReceipt} open={receiptDialogOpen} postedReceipts={postedReceipts} purchaseOrders={[orderValue]} warehouses={warehouses} />
    </main>
  );
}
