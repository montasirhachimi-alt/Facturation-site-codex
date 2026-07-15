"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { hydrateCrmSalesPersistence, hydrateInventoryPersistence, hydrateProductCatalogPersistence, persistCrmSalesRecord } from "@/platform/persistence";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService, subscribeToCrmContactStore } from "@/modules/crm/contacts/ui/contact-local-store";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { SALES_ORDER_RESERVATION_LABELS, SALES_ORDER_STATUS_LABELS, SALES_ORDERS_USER_ID, SALES_ORDERS_WORKSPACE_ID } from "../order.constants";
import { salesOrderService, notifySalesOrderStoreUpdated, subscribeToSalesOrderStore } from "../order.store";
import { calculateSalesOrderTotals } from "../order.utils";
import { SalesOrderDialog, createEmptySalesOrderLine, type SalesOrderFormState } from "./order-dialog";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm: SalesOrderFormState = {
  companyId: "",
  contactId: "",
  orderDate: today(),
  expectedDeliveryDate: "",
  currency: "MAD",
  customerReference: "",
  internalReference: "",
  notes: "",
  discountRate: 0,
  lines: [createEmptySalesOrderLine("so")]
};

export function OrdersWorkspace() {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SalesOrderFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hydrateCrmSalesPersistence();
    void hydrateProductCatalogPersistence();
    void hydrateInventoryPersistence();
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribers = [
      subscribeToSalesOrderStore(refresh),
      subscribeToCrmCompanyStore(refresh),
      subscribeToCrmContactStore(refresh),
      subscribeToProductStore(refresh)
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const companies = useMemo(() => {
    void version;
    return crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies;
  }, [version]);
  const contacts = useMemo(() => {
    void version;
    return crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: false }).contacts;
  }, [version]);
  const products = useMemo(() => {
    void version;
    return productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
  }, [version]);
  const orders = useMemo(() => {
    void version;
    return salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, query, status: status as never }).orders;
  }, [query, status, version]);

  function openCreate() {
    setForm({ ...emptyForm, orderDate: today(), lines: [createEmptySalesOrderLine("so")] });
    setError(null);
    setDialogOpen(true);
  }

  async function submitOrder() {
    const company = companies.find((item) => item.id === form.companyId);
    if (!company) {
      setError("Sélectionnez une société.");
      return false;
    }
    const contact = contacts.find((item) => item.id === form.contactId);
    const snapshot = salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: true }).orders;
    const result = salesOrderService.createOrder({
      workspaceId: SALES_ORDERS_WORKSPACE_ID,
      companyId: company.id,
      companyName: company.displayName,
      contactId: contact?.id,
      contactName: contact?.fullName,
      orderDate: new Date(form.orderDate || today()).toISOString(),
      expectedDeliveryDate: form.expectedDeliveryDate ? new Date(form.expectedDeliveryDate).toISOString() : undefined,
      currency: form.currency,
      customerReference: form.customerReference,
      internalReference: form.internalReference,
      notes: form.notes,
      lines: form.lines,
      discountRate: form.discountRate,
      ownerId: SALES_ORDERS_USER_ID
    });
    if (!result.order) {
      setError(result.error ?? "Impossible de créer la commande client.");
      return false;
    }
    try {
      await persistCrmSalesRecord("salesOrder", result.order);
    } catch {
      salesOrderService.replaceOrders(snapshot);
      setError("La commande client n'a pas pu être enregistrée.");
      return false;
    }
    notifySalesOrderStoreUpdated();
    setDialogOpen(false);
    return true;
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Ventes</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Commandes clients</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Confirmez l&apos;engagement client et réservez le stock sans le sortir physiquement.</p>
          </div>
          <button onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">
            <Plus size={16} /> Nouvelle commande
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Rechercher une commande..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(SALES_ORDER_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
      </section>
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Société</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Réservation</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const totals = calculateSalesOrderTotals(order);
              return (
                <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50/60 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/40">
                  <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white"><Link href={`/sales/orders/${order.id}`}>{order.number}</Link><p className="text-xs font-medium text-slate-500">{new Date(order.orderDate).toLocaleDateString("fr-MA")}</p></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{order.companyName}<p className="text-xs">{order.contactName ?? "Aucun contact"}</p></td>
                  <td className="px-4 py-3">{SALES_ORDER_STATUS_LABELS[order.status]}</td>
                  <td className="px-4 py-3">{SALES_ORDER_RESERVATION_LABELS[order.reservationStatus]}</td>
                  <td className="px-4 py-3 text-right font-bold text-hicotech-navy dark:text-white">{new Intl.NumberFormat("fr-MA", { style: "currency", currency: order.currency, maximumFractionDigits: 0 }).format(totals.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <SalesOrderDialog companies={companies} contacts={contacts} error={error} form={form} onChange={setForm} onClose={() => setDialogOpen(false)} onSubmit={submitOrder} open={dialogOpen} products={products} />
    </main>
  );
}
