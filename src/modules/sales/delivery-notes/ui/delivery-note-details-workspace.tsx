"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, ArrowLeft, CheckCircle2, Download, Eye, Pencil, Printer } from "lucide-react";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { normalizeInventoryQuantity } from "@/modules/inventory/inventory.utils";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { buildDeliveryNotePdfDocument, downloadSalesDocumentPdf, printSalesDocumentPdf, SalesDocumentPreviewDialog } from "@/modules/sales/documents";
import { SALES_ORDERS_WORKSPACE_ID, salesOrderService, subscribeToSalesOrderStore } from "@/modules/sales/orders";
import { archivePersistedDeliveryNote, hydrateCrmSalesPersistence, hydrateDeliveryNotePersistence, hydrateInventoryPersistence, hydrateProductCatalogPersistence, persistDeliveryNoteDraft, postPersistedDeliveryNote } from "@/platform/persistence";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions } from "@/ui/forms/form-field";
import { DELIVERY_NOTES_WORKSPACE_ID, DELIVERY_NOTE_STATUS_LABELS, deliveryNoteService, notifyDeliveryNoteStoreUpdated, subscribeToDeliveryNoteStore } from "../index";
import type { DeliveryNoteId } from "../delivery-note.types";
import { getProjectedRemainingToDeliver, getRemainingToDeliver } from "../delivery-note.utils";
import { createDeliveryNoteFormLines, DeliveryNoteDialog, parseDeliveryNoteFormLines, type DeliveryNoteFormState } from "./delivery-note-dialog";

export function DeliveryNoteDetailsWorkspace({ deliveryNoteId }: { deliveryNoteId: string }) {
  const [, setVersion] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editForm, setEditForm] = useState<DeliveryNoteFormState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([hydrateCrmSalesPersistence(), hydrateDeliveryNotePersistence(), hydrateInventoryPersistence(), hydrateProductCatalogPersistence()]);
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribers = [subscribeToDeliveryNoteStore(refresh), subscribeToSalesOrderStore(refresh), subscribeToInventoryStore(refresh), subscribeToProductStore(refresh), subscribeToCrmCompanyStore(refresh)];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const note = deliveryNoteService.getDeliveryNote(deliveryNoteId as DeliveryNoteId, DELIVERY_NOTES_WORKSPACE_ID);
  const order = note ? salesOrderService.getOrder(note.salesOrderId, SALES_ORDERS_WORKSPACE_ID) : undefined;
  const inventory = inventoryLocalService.getSnapshot();
  const warehouses = inventory.warehouses.filter((warehouse) => warehouse.active);
  const products = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
  const company = note ? crmCompanyLocalService.getCompany(note.companyId, CRM_COMPANIES_WORKSPACE_ID) : undefined;

  if (!note) return <main className="min-h-screen bg-hicotech-cloud p-6 dark:bg-hicotech-dark-page"><p className="font-bold text-hicotech-navy dark:text-white">Bon de livraison introuvable.</p></main>;

  const noteValue = note;
  const pdfDocument = buildDeliveryNotePdfDocument(noteValue, { company, companyName: noteValue.companyName, contactName: noteValue.contactName });
  const quantity = normalizeInventoryQuantity(noteValue.lines.reduce((total, line) => total + (line.quantityPosted || line.quantityToDeliver), 0));

  function openEdit() {
    setMessage(null);
    setEditForm({
      salesOrderId: noteValue.salesOrderId,
      warehouseId: noteValue.warehouseId,
      deliveryDate: noteValue.deliveryDate.slice(0, 10),
      notes: noteValue.notes ?? "",
      lines: createDeliveryNoteFormLines(noteValue.lines)
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editForm || !order) return false;
    const warehouse = warehouses.find((item) => item.id === editForm.warehouseId);
    if (!warehouse) { setMessage("Sélectionnez un entrepôt actif."); return false; }
    const snapshot = deliveryNoteService.listDeliveryNotes({ workspaceId: DELIVERY_NOTES_WORKSPACE_ID, includeArchived: true }).deliveryNotes;
    const updated = deliveryNoteService.updateDeliveryNote({
      ...noteValue,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      deliveryDate: new Date(editForm.deliveryDate).toISOString(),
      notes: editForm.notes || undefined,
      lines: parseDeliveryNoteFormLines(editForm.lines)
    });
    try {
      const persisted = await persistDeliveryNoteDraft(updated);
      deliveryNoteService.upsertDeliveryNote(persisted);
      notifyDeliveryNoteStoreUpdated();
    } catch (error) {
      deliveryNoteService.replaceDeliveryNotes(snapshot);
      setMessage(error instanceof Error ? error.message : "Le bon de livraison n'a pas pu être modifié.");
      return false;
    }
    setEditOpen(false);
    setEditForm(null);
    setMessage("Bon de livraison modifié.");
    return true;
  }

  async function post() {
    if (busy) return false;
    setBusy(true);
    setMessage(null);
    try {
      await postPersistedDeliveryNote(noteValue.id);
      setConfirmOpen(false);
      setMessage("Livraison postée.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de poster la livraison. Réessayez.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    try {
      await archivePersistedDeliveryNote(noteValue.id);
      setMessage("Bon de livraison archivé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'archiver le bon de livraison.");
    }
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div><p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Bon de livraison</p><h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{noteValue.number}</h1><p className="mt-1 text-sm text-slate-500">{noteValue.companyName} · {DELIVERY_NOTE_STATUS_LABELS[noteValue.status]} · {noteValue.warehouseName}</p>{message ? <p role="status" className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{message}</p> : null}</div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sales/delivery-notes" className={actionClassName}><ArrowLeft size={15} /> Retour</Link>
            <button onClick={() => setPreviewOpen(true)} className={actionClassName}><Eye size={15} /> Aperçu PDF</button>
            <button onClick={() => void downloadSalesDocumentPdf(pdfDocument)} className={actionClassName}><Download size={15} /> Télécharger</button>
            <button onClick={() => void printSalesDocumentPdf(pdfDocument)} className={actionClassName}><Printer size={15} /> Imprimer</button>
            {noteValue.status === "draft" ? <button onClick={openEdit} className={actionClassName}><Pencil size={15} /> Modifier</button> : null}
            {noteValue.status === "draft" ? <button onClick={() => setConfirmOpen(true)} className={primaryClassName}><CheckCircle2 size={15} /> Poster la livraison</button> : null}
            {noteValue.status === "posted" ? <button onClick={() => void archive()} className={actionClassName}><Archive size={15} /> Archiver</button> : null}
          </div>
        </div>
      </section>
      <SalesDocumentPreviewDialog document={pdfDocument} open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <section className="mt-4 grid gap-4 md:grid-cols-4"><Metric label="Commande source" value={noteValue.salesOrderNumber} href={`/sales/orders/${noteValue.salesOrderId}`} /><Metric label="Société" value={noteValue.companyName} href={`/crm/companies/${noteValue.companyId}`} /><Metric label="Quantité du BL" value={String(quantity)} /><Metric label="Posté le" value={noteValue.postedAt ? new Date(noteValue.postedAt).toLocaleString("fr-MA") : "Non posté"} /></section>
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40"><tr><th className="px-4 py-3">Produit</th><th className="px-4 py-3">Commandé</th><th className="px-4 py-3">Déjà livré</th><th className="px-4 py-3">Ce BL</th><th className="px-4 py-3">{noteValue.status === "draft" ? "Reliquat après ce BL" : "Reliquat"}</th><th className="px-4 py-3">Disponible</th></tr></thead><tbody>{noteValue.lines.map((line) => {
        const orderLine = order?.lines.find((item) => item.id === line.salesOrderLineId);
        const available = inventory.balances.find((item) => item.productId === line.productId && item.warehouseId === noteValue.warehouseId)?.quantityAvailable ?? 0;
        const remaining = orderLine
          ? noteValue.status === "draft"
            ? getProjectedRemainingToDeliver(orderLine, line.quantityToDeliver)
            : getRemainingToDeliver(orderLine)
          : "—";
        return <tr key={line.id} className="border-t border-slate-100 dark:border-hicotech-dark-border"><td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{line.productSku ? `${line.productSku} · ` : ""}{line.description}</td><td className="px-4 py-3">{orderLine?.quantityOrdered ?? "—"}</td><td className="px-4 py-3">{orderLine?.quantityDelivered ?? "—"}</td><td className="px-4 py-3 font-bold">{line.quantityPosted || line.quantityToDeliver}</td><td className="px-4 py-3">{remaining}</td><td className="px-4 py-3">{available}</td></tr>;
      })}</tbody></table></div></section>
      {noteValue.notes ? <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"><h2 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Notes</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{noteValue.notes}</p></section> : null}
      {editForm && order ? <DeliveryNoteDialog error={message} form={editForm} inventory={inventory} onChange={setEditForm} onClose={() => { setEditOpen(false); setEditForm(null); }} onOrderChange={() => undefined} onSubmit={saveEdit} open={editOpen} orders={[order]} products={products} warehouses={warehouses} /> : null}
      <EntityDialog description="Cette action diminuera physiquement le stock et ne pourra pas être annulée dans cette version." eyebrow="Confirmation" footer={<FormActions busyLabel="Posting..." onCancel={() => setConfirmOpen(false)} submitBusy={busy} submitLabel="Poster la livraison" />} onClose={() => setConfirmOpen(false)} onSubmit={post} open={confirmOpen} size="sm" title="Poster ce bon de livraison ?"><p className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">Le mouvement ISSUE, la consommation de réservation et les quantités livrées seront enregistrés dans une seule transaction.</p></EntityDialog>
    </main>
  );
}

const actionClassName = "inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white";
const primaryClassName = "inline-flex min-h-10 items-center gap-2 rounded-xl bg-hicotech-blue px-3 py-2 text-sm font-bold text-white";

function Metric({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = <p className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">{value}</p>;
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"><p className="text-xs font-bold uppercase text-slate-500">{label}</p>{href ? <Link href={href} className="text-hicotech-blue">{content}</Link> : content}</div>;
}
