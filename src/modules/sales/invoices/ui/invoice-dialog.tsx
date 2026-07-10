"use client";

import { useMemo, useState } from "react";
import type { CompanyId } from "@/modules/crm/companies";
import { crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import type { ContactId } from "@/modules/crm/contacts";
import { crmContactSeed } from "@/modules/crm/contacts/ui/contacts.seed";
import type { OpportunityId } from "@/modules/crm/opportunities";
import { SalesLineItemsEditor, createEmptySalesLineItem, normalizeSalesLineItems, validateSalesLineItems } from "@/modules/sales/shared";
import { quoteService } from "@/modules/sales/quotes/quote.store";
import type { QuoteCurrency, QuoteId, QuoteItem } from "@/modules/sales/quotes/quote.types";
import { SALES_QUOTES_USER_ID, SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes/quotes.seed";
import { calculateQuoteTotals, formatQuoteMoney } from "@/modules/sales/quotes/quote.utils";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import { getCompanyPickerItems, getCustomerPickerItems } from "@/ui/forms/entity-picker.crm-data";
import { getQuotePickerItems } from "@/ui/forms/entity-picker.sales-data";
import type { EntityPickerItem } from "@/ui/forms/entity-picker.types";
import { invoiceService, notifyInvoiceStoreUpdated } from "../invoice.store";
import type { Invoice } from "../invoice.types";

const companies = crmCompanySeed;
const contacts = crmContactSeed;
const companyPickerItems = getCompanyPickerItems();
const customerPickerItems = getCustomerPickerItems();

type InvoiceDialogState = {
  customerName: string;
  companyName: string;
  companyId: string;
  quoteId: string;
  issueDate: string;
  dueDate: string;
  currency: QuoteCurrency;
  discountRate: number;
  notes: string;
  contactId?: ContactId;
  opportunityId?: OpportunityId;
  items: readonly QuoteItem[];
};

export function InvoiceDialog({
  onClose,
  onSubmit,
  open
}: {
  onClose: () => void;
  onSubmit: (invoice: Invoice) => void;
  open: boolean;
}) {
  const initialCompany = companies[0];
  const [form, setForm] = useState<InvoiceDialogState>(() => ({
    customerName: initialCompany?.displayName ?? "",
    companyName: initialCompany?.displayName ?? "",
    companyId: initialCompany?.id ?? "",
    quoteId: "",
    issueDate: "2026-07-03T11:00:00.000Z",
    dueDate: addDays("2026-07-03T11:00:00.000Z", 30),
    currency: "MAD",
    discountRate: 0,
    notes: "",
    items: [createEmptySalesLineItem("invoice-line")]
  }));
  const [error, setError] = useState<string | null>(null);
  const quotePickerItems = useMemo(() => getQuotePickerItems(), []);
  const totals = useMemo(() => calculateQuoteTotals(form.items, form.discountRate, form.currency), [form.currency, form.discountRate, form.items]);

  function updateForm(patch: Partial<InvoiceDialogState>) {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function selectQuote(item: EntityPickerItem | null, value: string) {
    if (!item) {
      updateForm({ quoteId: "", notes: value ? form.notes : form.notes });
      return;
    }

    const quote = quoteService.getQuote(item.id as QuoteId, SALES_QUOTES_WORKSPACE_ID);
    if (!quote) {
      updateForm({ quoteId: item.id });
      return;
    }

    const company = companies.find((entry) => entry.id === quote.companyId);
    updateForm({
      quoteId: quote.id,
      customerName: quote.customerName,
      companyName: company?.displayName ?? form.companyName,
      companyId: quote.companyId,
      contactId: quote.contactId,
      opportunityId: quote.opportunityId,
      currency: quote.currency,
      discountRate: quote.discountRate,
      notes: quote.notes ? `Facture préparée depuis ${quote.number}. ${quote.notes}` : `Facture préparée depuis ${quote.number}.`,
      items: quote.items.map((line) => ({ ...line, id: `invoice-line-${line.id}-${Date.now()}` }))
    });
  }

  function submitInvoice() {
    const lineValidation = validateSalesLineItems(form.items);
    const companyId = resolveCompanyId(form.companyId, form.companyName);
    const customerName = form.customerName.trim() || form.companyName.trim();

    if (!customerName) {
      setError("Sélectionnez ou renseignez un client.");
      return;
    }

    if (!companyId) {
      setError("Sélectionnez une société pour rattacher la facture.");
      return;
    }

    if (!lineValidation.valid) {
      setError(lineValidation.errors[0] ?? "Corrigez les lignes de la facture.");
      return;
    }

    const invoice = invoiceService.createInvoice({
      workspaceId: SALES_QUOTES_WORKSPACE_ID,
      customerName,
      companyId,
      contactId: resolveContactId(form.contactId),
      opportunityId: form.opportunityId,
      quoteId: resolveQuoteId(form.quoteId),
      status: "draft",
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      currency: form.currency,
      items: normalizeSalesLineItems(form.items),
      discountRate: Math.max(0, Number(form.discountRate) || 0),
      notes: form.notes,
      ownerId: SALES_QUOTES_USER_ID
    });

    notifyInvoiceStoreUpdated();
    onSubmit(invoice);
  }

  return (
    <EntityDialog
      eyebrow="Ventes"
      title="Créer une facture"
      description="Créez une facture avec client, société, devis source optionnel et lignes facturées."
      open={open}
      onClose={onClose}
      onSubmit={submitInvoice}
      error={error}
      footer={<FormActions onCancel={onClose} submitLabel="Créer une facture" />}
    >
      <div className="mt-5 space-y-3">
        <FormSection title="Contexte facture" description="La facture peut être créée manuellement ou préparée depuis un devis existant.">
          <SmartEntityPicker
            label="Client"
            items={customerPickerItems}
            value={form.customerName}
            onChange={({ value }) => updateForm({ customerName: value })}
            placeholder="Rechercher un client..."
            helper="Obligatoire"
            allowCreate
            createLabel="Créer le client"
            entityType="client"
            onCreate={(name) => createLocalPickerItem(customerPickerItems, name, "customer", "Customer")}
          />
          <SmartEntityPicker
            label="Société"
            items={companyPickerItems}
            value={form.companyName}
            onChange={({ value, item }) => updateForm({ companyName: value, companyId: item?.id ?? form.companyId })}
            placeholder="Rechercher une société..."
            helper="Obligatoire"
            allowCreate
            createLabel="Créer la société"
            entityType="société"
            onCreate={(name) => createLocalPickerItem(companyPickerItems, name, "company", "Company")}
          />
          <SmartEntityPicker
            label="Devis source"
            items={quotePickerItems}
            value={form.quoteId}
            onChange={({ value, item }) => selectQuote(item, value)}
            placeholder="Rechercher un devis..."
            helper="Optionnel"
          />
          <label className="block">
            <span className="text-sm font-bold text-hicotech-navy dark:text-white">Devise</span>
            <select value={form.currency} onChange={(event) => updateForm({ currency: event.target.value as QuoteCurrency })} className={entityInputClassName}>
              <option value="MAD">MAD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </FormSection>

        <FormSection title="Dates et conditions" description="Les dates restent locales au flux actuel de démonstration.">
          <FormField label="Date d'émission" required>
            <input
              type="date"
              value={form.issueDate.slice(0, 10)}
              onChange={(event) => updateForm({ issueDate: toIsoDate(event.target.value) })}
              className={entityInputClassName}
            />
          </FormField>
          <FormField label="Échéance" required>
            <input
              type="date"
              value={form.dueDate.slice(0, 10)}
              onChange={(event) => updateForm({ dueDate: toIsoDate(event.target.value) })}
              className={entityInputClassName}
            />
          </FormField>
          <FormField label="Remise (%)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discountRate}
              onChange={(event) => updateForm({ discountRate: Number(event.target.value) })}
              className={entityInputClassName}
            />
          </FormField>
          <FormField label="Notes">
            <input value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} className={entityInputClassName} />
          </FormField>
        </FormSection>

        <FormSection title="Articles facturés" description="Importez les lignes d'un devis ou ajoutez des lignes manuelles.">
          <SalesLineItemsEditor
            currency={form.currency}
            lines={form.items}
            onChange={(items) => updateForm({ items })}
          />
        </FormSection>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Totaux de la facture</h3>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
            <TotalPill label="Sous-total" value={formatQuoteMoney(totals.subtotal, totals.currency)} />
            <TotalPill label="Remise" value={formatQuoteMoney(totals.discount, totals.currency)} />
            <TotalPill label="TVA" value={formatQuoteMoney(totals.tax, totals.currency)} />
            <TotalPill label="Total TTC" value={formatQuoteMoney(totals.total, totals.currency)} strong />
          </div>
        </section>
      </div>
    </EntityDialog>
  );
}

function resolveCompanyId(companyId: string, companyName: string) {
  const direct = companies.find((company) => company.id === companyId);
  if (direct) return direct.id as CompanyId;
  const byName = companies.find((company) => company.displayName === companyName || company.legalName === companyName);
  return (byName ?? companies[0])?.id as CompanyId | undefined;
}

function resolveContactId(contactId: string | undefined) {
  return contacts.some((contact) => contact.id === contactId) ? contactId as ContactId : undefined;
}

function resolveQuoteId(quoteId: string) {
  return quoteService.getQuote(quoteId as QuoteId, SALES_QUOTES_WORKSPACE_ID) ? quoteId as QuoteId : undefined;
}

function createLocalPickerItem(items: readonly EntityPickerItem[], title: string, type: EntityPickerItem["type"], typeLabel: string): EntityPickerItem {
  const fallback = items.find((item) => !item.disabled) ?? items[0];
  return {
    id: `inline-${type}-${slugify(title)}-${Date.now()}`,
    title,
    type,
    typeLabel,
    metadata: "Créé localement dans ce formulaire",
    icon: fallback.icon,
    keywords: [title, "inline", "local"]
  };
}

function TotalPill({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/35">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className={`mt-1 text-sm font-bold ${strong ? "text-hicotech-blue" : "text-hicotech-navy dark:text-white"}`}>{value}</p>
    </div>
  );
}

function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function toIsoDate(date: string) {
  return new Date(`${date}T11:00:00.000Z`).toISOString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
