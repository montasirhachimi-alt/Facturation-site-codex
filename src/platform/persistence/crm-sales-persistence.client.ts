"use client";

import type { Company } from "@/modules/crm/companies";
import type { Contact } from "@/modules/crm/contacts";
import type { Customer } from "@/modules/crm/customers";
import { crmCompanyLocalService, notifyCrmCompanyStoreUpdated } from "@/modules/crm/companies/ui/company-local-store";
import { crmContactLocalService, notifyCrmContactStoreUpdated } from "@/modules/crm/contacts/ui/contact-local-store";
import { crmCustomerLocalService, notifyCrmCustomerStoreUpdated } from "@/modules/crm/customers/ui/customer-local-store";
import type { Invoice } from "@/modules/sales/invoices";
import { invoiceService, notifyInvoiceStoreUpdated } from "@/modules/sales/invoices";
import type { Payment } from "@/modules/sales/payments";
import { notifyPaymentStoreUpdated, paymentService } from "@/modules/sales/payments";
import type { Quote } from "@/modules/sales/quotes";
import { notifyQuoteStoreUpdated, quoteService } from "@/modules/sales/quotes";

export type CrmSalesPersistenceSnapshot = Readonly<{
  companies: Company[];
  customers: Customer[];
  contacts: Contact[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
}>;

export type CrmSalesPersistenceResource =
  | "company"
  | "customer"
  | "contact"
  | "quote"
  | "invoice"
  | "payment";

let hydrationPromise: Promise<void> | null = null;

export function hydrateCrmSalesPersistence() {
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

export function applyCrmSalesSnapshot(snapshot: CrmSalesPersistenceSnapshot) {
  crmCompanyLocalService.replaceCompanies(snapshot.companies);
  crmCustomerLocalService.replaceCustomers(snapshot.customers);
  crmContactLocalService.replaceContacts(snapshot.contacts);
  quoteService.replaceQuotes(snapshot.quotes);
  invoiceService.replaceInvoices(snapshot.invoices);
  paymentService.replacePayments(snapshot.payments);
  notifyAllCrmSalesStores();
}

export function notifyAllCrmSalesStores() {
  notifyCrmCompanyStoreUpdated();
  notifyCrmCustomerStoreUpdated();
  notifyCrmContactStoreUpdated();
  notifyQuoteStoreUpdated();
  notifyInvoiceStoreUpdated();
  notifyPaymentStoreUpdated();
}
