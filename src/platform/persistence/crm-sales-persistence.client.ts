"use client";

import type { Company } from "@/modules/crm/companies";
import type { Contact } from "@/modules/crm/contacts";
import type { Customer } from "@/modules/crm/customers";
import type { Meeting } from "@/modules/crm/meetings";
import { crmMeetingLocalService, notifyCrmMeetingStoreUpdated } from "@/modules/crm/meetings/ui/meeting-local-store";
import type { Note } from "@/modules/crm/notes";
import { crmNoteLocalService, notifyCrmNoteStoreUpdated } from "@/modules/crm/notes/ui/note-local-store";
import type { Task } from "@/modules/crm/tasks";
import { crmTaskLocalService, notifyCrmTaskStoreUpdated } from "@/modules/crm/tasks/ui/task-local-store";
import { crmCompanyLocalService, notifyCrmCompanyStoreUpdated } from "@/modules/crm/companies/ui/company-local-store";
import { crmContactLocalService, notifyCrmContactStoreUpdated } from "@/modules/crm/contacts/ui/contact-local-store";
import { crmCustomerLocalService, notifyCrmCustomerStoreUpdated } from "@/modules/crm/customers/ui/customer-local-store";
import type { Invoice } from "@/modules/sales/invoices";
import { invoiceService, notifyInvoiceStoreUpdated } from "@/modules/sales/invoices";
import type { SalesOrder } from "@/modules/sales/orders";
import { notifySalesOrderStoreUpdated, salesOrderService } from "@/modules/sales/orders";
import type { Payment } from "@/modules/sales/payments";
import { notifyPaymentStoreUpdated, paymentService } from "@/modules/sales/payments";
import type { Quote } from "@/modules/sales/quotes";
import type { QuoteStatus } from "@/modules/sales/quotes";
import { notifyQuoteStoreUpdated, quoteService } from "@/modules/sales/quotes";
import { applyInventorySnapshot, type InventorySnapshot } from "./inventory-persistence.client";

export type CrmSalesPersistenceSnapshot = Readonly<{
  companies: Company[];
  customers: Customer[];
  contacts: Contact[];
  meetings: Meeting[];
  tasks: Task[];
  notes: Note[];
  quotes: Quote[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
  payments: Payment[];
}>;

export type CrmSalesPersistenceResource =
  | "company"
  | "customer"
  | "contact"
  | "meeting"
  | "task"
  | "note"
  | "quote"
  | "salesOrder"
  | "invoice"
  | "payment";

let hydrationPromise: Promise<void> | null = null;

export function hydrateCrmSalesPersistence(options: { force?: boolean } = {}) {
  if (options.force) hydrationPromise = null;
  hydrationPromise ??= fetch("/api/persistence/crm-sales", {
    method: "GET",
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      if (!response.ok) return;
      const snapshot = await response.json() as CrmSalesPersistenceSnapshot;
      applyCrmSalesSnapshot(snapshot);
    })
    .catch(() => {
      hydrationPromise = null;
    });

  return hydrationPromise;
}

export function persistCrmSalesRecord(resource: CrmSalesPersistenceResource, record: unknown) {
  return fetch("/api/persistence/crm-sales", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ resource, record })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "La sauvegarde persistante a échoué.");
    }
    return response.json();
  });
}

export function confirmPersistedSalesOrder(order: SalesOrder, options: { reserve?: boolean; warehouseId?: string; allowPartial?: boolean } = {}) {
  return fetch("/api/persistence/crm-sales", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "confirmSalesOrder", payload: { order, ...options } })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "Impossible de confirmer la commande client.");
    }
    const body = await response.json() as { snapshot?: CrmSalesPersistenceSnapshot; inventorySnapshot?: InventorySnapshot };
    if (body.snapshot) applyCrmSalesSnapshot(body.snapshot);
    if (body.inventorySnapshot) applyInventorySnapshot(body.inventorySnapshot);
    return body;
  });
}

export function transitionPersistedQuoteStatus(quoteId: string, status: QuoteStatus) {
  return fetch("/api/persistence/crm-sales", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "transitionQuoteStatus", payload: { quoteId, status } })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "Impossible de changer le statut du devis.");
    }
    const body = await response.json() as { record?: Quote; snapshot?: CrmSalesPersistenceSnapshot };
    if (body.snapshot) applyCrmSalesSnapshot(body.snapshot);
    return body;
  });
}

export function cancelPersistedSalesOrder(orderId: string) {
  return fetch("/api/persistence/crm-sales", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "cancelSalesOrder", payload: { orderId } })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "Impossible d'annuler la commande client.");
    }
    const body = await response.json() as { snapshot?: CrmSalesPersistenceSnapshot; inventorySnapshot?: InventorySnapshot };
    if (body.snapshot) applyCrmSalesSnapshot(body.snapshot);
    if (body.inventorySnapshot) applyInventorySnapshot(body.inventorySnapshot);
    return body;
  });
}

export function applyCrmSalesSnapshot(snapshot: CrmSalesPersistenceSnapshot) {
  crmCompanyLocalService.replaceCompanies(snapshot.companies);
  crmCustomerLocalService.replaceCustomers(snapshot.customers);
  crmContactLocalService.replaceContacts(snapshot.contacts);
  crmMeetingLocalService.replaceMeetings(snapshot.meetings ?? []);
  crmTaskLocalService.replaceTasks(snapshot.tasks ?? []);
  crmNoteLocalService.replaceNotes(snapshot.notes ?? []);
  quoteService.replaceQuotes(snapshot.quotes);
  salesOrderService.replaceOrders(snapshot.salesOrders ?? []);
  invoiceService.replaceInvoices(snapshot.invoices);
  paymentService.replacePayments(snapshot.payments);
  notifyAllCrmSalesStores();
}

export function notifyAllCrmSalesStores() {
  notifyCrmCompanyStoreUpdated();
  notifyCrmCustomerStoreUpdated();
  notifyCrmContactStoreUpdated();
  notifyCrmMeetingStoreUpdated();
  notifyCrmTaskStoreUpdated();
  notifyCrmNoteStoreUpdated();
  notifyQuoteStoreUpdated();
  notifySalesOrderStoreUpdated();
  notifyInvoiceStoreUpdated();
  notifyPaymentStoreUpdated();
}
