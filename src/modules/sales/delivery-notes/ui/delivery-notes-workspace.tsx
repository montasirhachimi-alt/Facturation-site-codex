"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PackageCheck, Plus } from "lucide-react";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { normalizeInventoryQuantity } from "@/modules/inventory/inventory.utils";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { SALES_ORDERS_WORKSPACE_ID, salesOrderService, subscribeToSalesOrderStore } from "@/modules/sales/orders";
import { hydrateCrmSalesPersistence, hydrateDeliveryNotePersistence, hydrateInventoryPersistence, hydrateProductCatalogPersistence, persistDeliveryNoteDraft } from "@/platform/persistence";
import { DELIVERY_NOTES_WORKSPACE_ID, DELIVERY_NOTE_STATUS_LABELS, deliveryNoteService, notifyDeliveryNoteStoreUpdated, subscribeToDeliveryNoteStore } from "../index";
import type { DeliveryNote } from "../delivery-note.types";
import { createDeliveryNoteForm, DeliveryNoteDialog, parseDeliveryNoteFormLines, type DeliveryNoteFormState } from "./delivery-note-dialog";

export function DeliveryNotesWorkspace() {
  const autoOpened = useRef(false);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<DeliveryNoteFormState>({ salesOrderId: "", warehouseId: "", deliveryDate: new Date().toISOString().slice(0, 10), notes: "", lines: [] });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([hydrateCrmSalesPersistence(), hydrateDeliveryNotePersistence(), hydrateInventoryPersistence(), hydrateProductCatalogPersistence()]);
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribers = [subscribeToDeliveryNoteStore(refresh), subscribeToSalesOrderStore(refresh), subscribeToInventoryStore(refresh), subscribeToProductStore(refresh)];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const inventory = useMemo(() => { void version; return inventoryLocalService.getSnapshot(); }, [version]);
  const products = useMemo(() => { void version; return productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products; }, [version]);
  const eligibleOrders = useMemo(() => {
    void version;
    return salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: false }).orders.filter((order) =>
      ["confirmed", "partially_reserved", "reserved", "partially_delivered"].includes(order.status) && order.lines.some((line) => line.productId && line.quantityDelivered < line.quantityOrdered)
    );
  }, [version]);
  const notes = useMemo(() => {
    void version;
    return deliveryNoteService.listDeliveryNotes({ workspaceId: DELIVERY_NOTES_WORKSPACE_ID, query, status: status as never }).deliveryNotes;
  }, [query, status, version]);
  const warehouses = inventory.warehouses.filter((warehouse) => warehouse.active);

  useEffect(() => {
    if (autoOpened.current || eligibleOrders.length === 0 || products.length === 0 || warehouses.length === 0) return;
    const orderId = new URLSearchParams(window.location.search).get("orderId");
    const order = eligibleOrders.find((item) => item.id === orderId);
    if (!order) return;
    autoOpened.current = true;
    const warehouse = warehouses.find((item) => item.isDefault) ?? warehouses[0];
    setForm(createDeliveryNoteForm(order, warehouse, products));
    setError(null);
    setSuccess(null);
    setDialogOpen(true);
  }, [eligibleOrders, products, warehouses]);

  function openCreate(orderId?: string) {
    const order = eligibleOrders.find((item) => item.id === orderId) ?? eligibleOrders[0];
    const warehouse = inventory.warehouses.find((item) => item.isDefault && item.active) ?? warehouses[0];
    setForm(createDeliveryNoteForm(order, warehouse, products));
    setError(null);
    setSuccess(null);
    setDialogOpen(true);
  }

  function changeOrder(orderId: string) {
    const order = eligibleOrders.find((item) => item.id === orderId);
    const warehouse = warehouses.find((item) => item.id === form.warehouseId) ?? warehouses[0];
    setForm(createDeliveryNoteForm(order, warehouse, products));
  }

  async function submitDraft() {
    const order = eligibleOrders.find((item) => item.id === form.salesOrderId);
    const warehouse = warehouses.find((item) => item.id === form.warehouseId);
    if (!order) { setError("Sélectionnez une commande client éligible."); return false; }
    if (!warehouse) { setError("Sélectionnez un entrepôt actif."); return false; }
    const snapshot = deliveryNoteService.listDeliveryNotes({ workspaceId: DELIVERY_NOTES_WORKSPACE_ID, includeArchived: true }).deliveryNotes;
    const result = deliveryNoteService.createDeliveryNote({
      workspaceId: DELIVERY_NOTES_WORKSPACE_ID,
      companyId: order.companyId,
      companyName: order.companyName,
      contactId: order.contactId,
      contactName: order.contactName,
      salesOrderId: order.id,
      salesOrderNumber: order.number,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      deliveryDate: new Date(form.deliveryDate).toISOString(),
      notes: form.notes || undefined,
      customerReference: order.customerReference,
      lines: parseDeliveryNoteFormLines(form.lines)
    });
    if (!result.deliveryNote) { setError(result.error ?? "Impossible de créer le bon de livraison."); return false; }
    try {
      const persisted = await persistDeliveryNoteDraft(result.deliveryNote);
      deliveryNoteService.upsertDeliveryNote(persisted);
    } catch (saveError) {
      deliveryNoteService.replaceDeliveryNotes(snapshot);
      setError(saveError instanceof Error ? saveError.message : "Le bon de livraison n'a pas pu être enregistré.");
      return false;
    }
    notifyDeliveryNoteStoreUpdated();
    setDialogOpen(false);
    setSuccess("Bon de livraison créé.");
    return true;
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Ventes · Exécution</p><h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Bons de livraison</h1><p className="mt-1 text-sm text-slate-500">Préparez puis postez les sorties physiques issues des commandes clients.</p>{success ? <p role="status" className="mt-2 text-sm font-bold text-emerald-700">{success}</p> : null}</div>
          <button onClick={() => openCreate()} disabled={eligibleOrders.length === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} /> Nouveau bon</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Rechercher un bon, une commande, une société..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les statuts</option>{Object.entries(DELIVERY_NOTE_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        </div>
      </section>
      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><WorkspaceMetric label="À préparer" value={notes.filter((note) => note.status === "draft").length} /><WorkspaceMetric label="Postés" value={notes.filter((note) => note.status === "posted").length} /><WorkspaceMetric label="Aujourd'hui" value={notes.filter((note) => note.postedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length} /><WorkspaceMetric label="Commandes éligibles" value={eligibleOrders.length} /></section>
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        {notes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40"><tr><th className="px-4 py-3">Bon</th><th className="px-4 py-3">Commande</th><th className="px-4 py-3">Société</th><th className="px-4 py-3">Entrepôt</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Quantité</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{notes.map((note) => <DeliveryNoteRow key={note.id} note={note} />)}</tbody></table></div> : <div className="grid place-items-center px-6 py-14 text-center"><PackageCheck className="text-hicotech-blue" size={28} /><h2 className="mt-3 font-display text-lg font-bold text-hicotech-navy dark:text-white">Aucun bon de livraison</h2><p className="mt-1 max-w-md text-sm text-slate-500">Créez un brouillon depuis une commande confirmée. Aucun stock ne bougera avant le posting.</p></div>}
      </section>
      <DeliveryNoteDialog error={error} form={form} inventory={inventory} onChange={setForm} onClose={() => setDialogOpen(false)} onOrderChange={changeOrder} onSubmit={submitDraft} open={dialogOpen} orders={eligibleOrders} products={products} warehouses={warehouses} />
    </main>
  );
}

function DeliveryNoteRow({ note }: { note: DeliveryNote }) {
  const quantity = normalizeInventoryQuantity(note.lines.reduce((total, line) => total + (line.quantityPosted || line.quantityToDeliver), 0));
  return <tr className="border-t border-slate-100 hover:bg-slate-50/60 dark:border-hicotech-dark-border"><td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white"><Link href={`/sales/delivery-notes/${note.id}`}>{note.number}</Link><p className="text-xs font-medium text-slate-500">{new Date(note.deliveryDate).toLocaleDateString("fr-MA")}</p></td><td className="px-4 py-3"><Link className="font-semibold text-hicotech-blue" href={`/sales/orders/${note.salesOrderId}`}>{note.salesOrderNumber}</Link></td><td className="px-4 py-3">{note.companyName}</td><td className="px-4 py-3">{note.warehouseName}</td><td className="px-4 py-3">{DELIVERY_NOTE_STATUS_LABELS[note.status]}</td><td className="px-4 py-3 text-right font-bold">{quantity}</td><td className="px-4 py-3 text-right"><Link href={`/sales/delivery-notes/${note.id}`} className="font-bold text-hicotech-blue">Voir</Link></td></tr>;
}

function WorkspaceMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"><p className="text-[11px] font-bold uppercase text-slate-500">{label}</p><p className="mt-1 font-display text-xl font-bold text-hicotech-navy dark:text-white">{value}</p></div>;
}
