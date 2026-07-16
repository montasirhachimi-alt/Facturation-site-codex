"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Eye, PackageCheck, Pencil, Printer, XCircle } from "lucide-react";
import { cancelPersistedSalesOrder, confirmPersistedSalesOrder, hydrateCrmSalesPersistence, hydrateDeliveryNotePersistence, hydrateInventoryPersistence, hydrateProductCatalogPersistence, persistCrmSalesRecord } from "@/platform/persistence";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService, subscribeToCrmContactStore } from "@/modules/crm/contacts/ui/contact-local-store";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { PRODUCTS_WORKSPACE_ID, type Product, type ProductId } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { SalesDocumentPreviewDialog, buildSalesOrderPdfDocument, downloadSalesDocumentPdf, printSalesDocumentPdf } from "@/modules/sales/documents";
import { SALES_ORDER_RESERVATION_LABELS, SALES_ORDER_STATUS_LABELS, SALES_ORDERS_WORKSPACE_ID } from "../order.constants";
import { notifySalesOrderStoreUpdated, salesOrderService, subscribeToSalesOrderStore } from "../order.store";
import type { SalesOrder, SalesOrderId, SalesOrderLine } from "../order.types";
import { calculateSalesOrderTotals } from "../order.utils";
import { SalesOrderDialog, type SalesOrderFormState } from "./order-dialog";
import { useModuleEnabled } from "@/platform/modules/module-activation.context";
import { DELIVERY_NOTES_WORKSPACE_ID, deliveryNoteService, getSalesOrderDeliveryProgress, subscribeToDeliveryNoteStore } from "@/modules/sales/delivery-notes";

export function OrderDetailsWorkspace({ orderId }: { orderId: string }) {
  const deliveryNotesEnabled = useModuleEnabled("sales.delivery-notes");
  const [, setVersion] = useState(0);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<SalesOrderFormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hydrateCrmSalesPersistence();
    void hydrateInventoryPersistence();
    if (deliveryNotesEnabled) void hydrateDeliveryNotePersistence();
    void hydrateProductCatalogPersistence();
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribers = [subscribeToSalesOrderStore(refresh), subscribeToInventoryStore(refresh), subscribeToCrmCompanyStore(refresh), subscribeToCrmContactStore(refresh), subscribeToProductStore(refresh), subscribeToDeliveryNoteStore(refresh)];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [deliveryNotesEnabled]);

  const order = salesOrderService.getOrder(orderId as SalesOrderId, SALES_ORDERS_WORKSPACE_ID);
  const companies = crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies;
  const contacts = crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: false }).contacts;
  const products = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
  const productById = new Map(products.map((product) => [product.id, product]));
  const inventorySnapshot = inventoryLocalService.getSnapshot();
  const warehouses = inventorySnapshot.warehouses.filter((warehouse) => warehouse.active);

  if (!order) {
    return <main className="min-h-screen bg-hicotech-cloud p-6 dark:bg-hicotech-dark-page"><p className="font-bold text-hicotech-navy dark:text-white">Commande client introuvable.</p></main>;
  }

  const orderValue = order;
  const totals = calculateSalesOrderTotals(orderValue);
  const pdfDocument = buildSalesOrderPdfDocument(orderValue);
  const defaultWarehouse = warehouses.find((warehouse) => warehouse.isDefault) ?? warehouses[0];
  const canConfirm = orderValue.status === "draft" || orderValue.status === "confirmed";
  const deliveryProgress = getSalesOrderDeliveryProgress(orderValue);
  const linkedDeliveryNotes = deliveryNoteService.listDeliveryNotes({ workspaceId: DELIVERY_NOTES_WORKSPACE_ID, salesOrderId: orderValue.id, includeArchived: false }).deliveryNotes;
  const canCancel = orderValue.status !== "cancelled" && orderValue.status !== "archived" && !deliveryProgress.quantityDelivered;
  const canEdit = orderValue.status === "draft";
  const canCreateDelivery = deliveryNotesEnabled && ["confirmed", "partially_reserved", "reserved", "partially_delivered"].includes(orderValue.status) && deliveryProgress.quantityRemaining > 0;

  async function confirm(reserve: boolean) {
    setError(null);
    try {
      await confirmPersistedSalesOrder(orderValue, { reserve, warehouseId: reserve ? defaultWarehouse?.id : undefined, allowPartial: true });
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Impossible de confirmer la commande.");
    }
  }

  async function cancel() {
    setError(null);
    try {
      await cancelPersistedSalesOrder(orderValue.id);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Impossible d'annuler la commande.");
    }
  }

  function openEdit() {
    if (!canEdit) return;
    setError(null);
    setEditForm(orderToForm(orderValue));
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editForm) return false;
    const company = companies.find((item) => item.id === editForm.companyId);
    if (!company) {
      setError("Sélectionnez une société.");
      return false;
    }
    const contact = contacts.find((item) => item.id === editForm.contactId);
    const snapshot = salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: true }).orders;
    const updated: SalesOrder = salesOrderService.updateOrder({
      ...orderValue,
      companyId: company.id,
      companyName: company.displayName,
      contactId: contact?.id,
      contactName: contact?.fullName,
      orderDate: new Date(editForm.orderDate).toISOString(),
      expectedDeliveryDate: editForm.expectedDeliveryDate ? new Date(editForm.expectedDeliveryDate).toISOString() : undefined,
      currency: editForm.currency,
      customerReference: editForm.customerReference || undefined,
      internalReference: editForm.internalReference || undefined,
      notes: editForm.notes || undefined,
      discountRate: Number(editForm.discountRate) || 0,
      lines: editForm.lines.map((line) => ({ ...line, quantityReserved: 0, quantityDelivered: 0, warehouseId: undefined, warehouseName: undefined }))
    });
    try {
      await persistCrmSalesRecord("salesOrder", updated);
    } catch {
      salesOrderService.replaceOrders(snapshot);
      setError("La commande client n'a pas pu être mise à jour.");
      return false;
    }
    notifySalesOrderStoreUpdated();
    setEditOpen(false);
    setEditForm(null);
    setError("Commande client enregistrée.");
    return true;
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Commande client</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{orderValue.number}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{orderValue.companyName} · {SALES_ORDER_STATUS_LABELS[orderValue.status]} · {SALES_ORDER_RESERVATION_LABELS[orderValue.reservationStatus]}</p>
            {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sales/orders" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white"><ArrowLeft size={15} /> Retour</Link>
            <button onClick={() => setPdfPreviewOpen(true)} className={actionClassName}><Eye size={15} /> Aperçu PDF</button>
            <button onClick={() => void downloadSalesDocumentPdf(pdfDocument)} className={actionClassName}><Download size={15} /> Télécharger</button>
            <button onClick={() => void printSalesDocumentPdf(pdfDocument)} className={actionClassName}><Printer size={15} /> Imprimer</button>
            {canEdit && <button onClick={openEdit} className={actionClassName}><Pencil size={15} /> Modifier</button>}
            {canConfirm && <button onClick={() => void confirm(false)} className={primaryClassName}><CheckCircle2 size={15} /> Confirmer</button>}
            {canConfirm && defaultWarehouse && <button onClick={() => void confirm(true)} className={primaryClassName}>Confirmer et réserver</button>}
            {canCreateDelivery && <Link href={`/sales/delivery-notes?orderId=${orderValue.id}`} className={primaryClassName}><PackageCheck size={15} /> {deliveryProgress.partial ? "Livrer le reliquat" : "Créer un bon de livraison"}</Link>}
            {deliveryNotesEnabled && deliveryProgress.complete && linkedDeliveryNotes.length > 0 ? <Link href={`/sales/delivery-notes?orderId=${orderValue.id}`} className={actionClassName}><PackageCheck size={15} /> Ouvrir les bons de livraison</Link> : null}
            {canCancel && <button onClick={() => void cancel()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-600"><XCircle size={15} /> Annuler</button>}
          </div>
        </div>
      </section>
      <SalesDocumentPreviewDialog document={pdfDocument} open={pdfPreviewOpen} onClose={() => setPdfPreviewOpen(false)} />

      <section className="mt-4 grid gap-4 md:grid-cols-4">
        <Metric label="Total TTC" value={formatMoney(totals.total, orderValue.currency)} />
        <Metric label="Société" value={orderValue.companyName} />
        <Metric label="Réservation" value={SALES_ORDER_RESERVATION_LABELS[orderValue.reservationStatus]} />
        <Metric label="Lignes" value={String(orderValue.lines.length)} />
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Commandé</th>
              <th className="px-4 py-3">Réservé</th>
              <th className="px-4 py-3">Livré</th>
              <th className="px-4 py-3">Disponibilité</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderValue.lines.map((line) => (
              <tr key={line.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{line.productSku ? `${line.productSku} · ` : ""}{line.description}</td>
                <td className="px-4 py-3">{line.quantityOrdered} {line.unit}</td>
                <td className="px-4 py-3">{line.quantityReserved} {line.unit}</td>
                <td className="px-4 py-3">{line.quantityDelivered} {line.unit}</td>
                <td className="px-4 py-3">{formatReservationInfo(line, line.productId ? productById.get(line.productId as ProductId) : undefined, inventorySnapshot, defaultWarehouse?.id)}</td>
                <td className="px-4 py-3 text-right font-bold">{formatMoney(line.quantityOrdered * line.unitPrice * (1 + line.taxRate / 100), orderValue.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {editForm && (
        <SalesOrderDialog
          companies={companies}
          contacts={contacts}
          error={error}
          form={editForm}
          onChange={setEditForm}
          onClose={() => {
            setEditOpen(false);
            setEditForm(null);
          }}
          onSubmit={saveEdit}
          open={editOpen}
          products={products}
          submitLabel="Enregistrer"
          title="Modifier la commande client"
        />
      )}
    </main>
  );
}

const actionClassName = "inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white";
const primaryClassName = "inline-flex min-h-10 items-center gap-2 rounded-xl bg-hicotech-blue px-3 py-2 text-sm font-bold text-white";

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 font-display text-xl font-bold text-hicotech-navy dark:text-white">{value}</p></div>;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function orderToForm(order: SalesOrder): SalesOrderFormState {
  return {
    companyId: order.companyId,
    contactId: order.contactId ?? "",
    orderDate: order.orderDate.slice(0, 10),
    expectedDeliveryDate: order.expectedDeliveryDate?.slice(0, 10) ?? "",
    currency: order.currency,
    customerReference: order.customerReference ?? "",
    internalReference: order.internalReference ?? "",
    notes: order.notes ?? "",
    discountRate: order.discountRate,
    lines: order.lines.map((line) => ({ ...line }))
  };
}

function formatReservationInfo(line: SalesOrderLine, product: Product | undefined, snapshot: ReturnType<typeof inventoryLocalService.getSnapshot>, fallbackWarehouseId?: string) {
  if (!line.productId) return "Réservation non applicable";
  if (!product) return "Produit indisponible";
  if (!product.flags.trackInventory) return "Produit non suivi en stock";
  const warehouseId = line.warehouseId ?? fallbackWarehouseId;
  if (!warehouseId) return "Aucun entrepôt";
  const balance = snapshot.balances.find((item) => item.productId === line.productId && item.warehouseId === warehouseId);
  const onHand = balance?.quantityOnHand ?? 0;
  const reserved = balance?.quantityReserved ?? 0;
  const available = balance?.quantityAvailable ?? 0;
  const remaining = Math.max(0, line.quantityOrdered - line.quantityReserved);
  const shortage = Math.max(0, remaining - available);
  return `En main ${onHand} · Réservé ${reserved} · Disponible ${available} · À réserver ${remaining}${shortage > 0 ? ` · Manque ${shortage}` : ""}`;
}
