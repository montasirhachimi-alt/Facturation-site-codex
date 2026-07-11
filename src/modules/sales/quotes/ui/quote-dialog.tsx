"use client";

import { useEffect, useMemo, useState } from "react";
import { persistCrmSalesRecord } from "@/platform/persistence";
import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import { crmOpportunitySeed } from "@/modules/crm/opportunities/ui/opportunities.seed";
import type { OpportunityId } from "@/modules/crm/opportunities";
import { SalesLineItemsEditor, createEmptySalesLineItem, normalizeSalesLineItems, validateSalesLineItems } from "@/modules/sales/shared";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import { createCompanyPickerItem, createContactPickerItem, getCompanyPickerItems, getContactPickerItems, subscribeToCrmPickerSources } from "@/ui/forms/entity-picker.crm-data";
import { calculateQuoteTotals, formatQuoteMoney } from "../quote.utils";
import { notifyQuoteStoreUpdated, quoteService } from "../quote.store";
import type { Quote, QuoteCurrency, QuoteItem } from "../quote.types";
import { SALES_QUOTES_USER_ID, SALES_QUOTES_WORKSPACE_ID } from "../quotes.seed";

const opportunities = crmOpportunitySeed;

type QuoteDialogState = {
  companyName: string;
  companyId: string;
  contactName: string;
  contactId: string;
  opportunityId: string;
  validityDays: number;
  currency: QuoteCurrency;
  discountRate: number;
  notes: string;
  items: readonly QuoteItem[];
};

export function QuoteDialog({
  onClose,
  onSubmit,
  open
}: {
  onClose: () => void;
  onSubmit: (quote: Quote) => void;
  open: boolean;
}) {
  const [form, setForm] = useState<QuoteDialogState>(() => ({
    companyName: "",
    companyId: "",
    contactName: "",
    contactId: "",
    opportunityId: opportunities[0]?.id ?? "",
    validityDays: 30,
    currency: "MAD",
    discountRate: 0,
    notes: "",
    items: [createEmptySalesLineItem("quote-line")]
  }));
  const [error, setError] = useState<string | null>(null);
  const [pickerVersion, setPickerVersion] = useState(0);
  const totals = useMemo(() => calculateQuoteTotals(form.items, form.discountRate, form.currency), [form.currency, form.discountRate, form.items]);
  const companyPickerItems = useMemo(() => {
    void pickerVersion;
    return getCompanyPickerItems();
  }, [pickerVersion]);
  const contactPickerItems = useMemo(() => {
    void pickerVersion;
    return getContactPickerItems(form.companyId);
  }, [form.companyId, pickerVersion]);
  useEffect(() => subscribeToCrmPickerSources(() => setPickerVersion((value) => value + 1)), []);

  function updateForm(patch: Partial<QuoteDialogState>) {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  }

  async function submitQuote() {
    const lineValidation = validateSalesLineItems(form.items);
    const companyId = resolveCompanyId(form.companyId, form.companyName);
    const accountName = form.companyName.trim();

    if (!companyId) {
      setError("Sélectionnez une société pour rattacher le devis.");
      return;
    }

    if (!lineValidation.valid) {
      setError(lineValidation.errors[0] ?? "Corrigez les lignes du devis.");
      return;
    }

    const snapshot = quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes;
    const quote = quoteService.createQuote({
      workspaceId: SALES_QUOTES_WORKSPACE_ID,
      customerName: accountName,
      companyId,
      companyName: form.companyName,
      contactId: resolveContactId(form.contactId),
      contactName: form.contactName,
      opportunityId: resolveOpportunityId(form.opportunityId),
      opportunityName: resolveOpportunityName(form.opportunityId),
      validityDays: Math.max(1, Number(form.validityDays) || 30),
      currency: form.currency,
      ownerId: SALES_QUOTES_USER_ID,
      discountRate: Math.max(0, Number(form.discountRate) || 0),
      notes: form.notes,
      items: normalizeSalesLineItems(form.items)
    });

    try {
      await persistCrmSalesRecord("quote", quote);
    } catch {
      quoteService.replaceQuotes(snapshot);
      setError("Le devis n'a pas pu être enregistré dans la base. Vérifiez la connexion puis réessayez.");
      return;
    }

    notifyQuoteStoreUpdated();
    onSubmit(quote);
  }

  return (
    <EntityDialog
      eyebrow="Ventes"
      title="Créer un devis"
      description="Créez un devis complet avec client, société, lignes commerciales et totaux calculés."
      open={open}
      onClose={onClose}
      onSubmit={submitQuote}
      size="xl"
      error={error}
      footer={<FormActions onCancel={onClose} submitLabel="Créer un devis" />}
    >
      <div className="mt-5 space-y-3">
        <FormSection title="Contexte commercial" description="Reliez le devis à la société commerciale. Le contact reste optionnel.">
          <SmartEntityPicker
            label="Société"
            items={companyPickerItems}
            value={form.companyName}
            onChange={({ value, item }) => updateForm({ companyName: value, companyId: item?.relations?.companyId ?? "", contactName: "", contactId: "" })}
            placeholder="Rechercher une société..."
            helper="Obligatoire"
            allowCreate
            createLabel="Créer la société"
            entityType="société"
            onCreate={(name) => createCompanyPickerItem(name)}
          />
          <SmartEntityPicker
            label="Contact"
            items={contactPickerItems}
            value={form.contactName}
            onChange={({ value, item }) => {
              const companyId = item?.relations?.companyId ?? "";
              updateForm({
                contactName: value,
                contactId: item?.relations?.contactId ?? "",
                companyId: form.companyId || companyId,
                companyName: form.companyName || item?.relations?.companyName || form.companyName
              });
            }}
            placeholder="Rechercher un contact..."
            allowCreate
            createLabel="Créer le contact"
            entityType="contact"
            onCreate={(name) => createContactPickerItem(name, { id: form.companyId, name: form.companyName })}
          />
          <label className="block">
            <span className="text-sm font-bold text-hicotech-navy dark:text-white">Opportunité</span>
            <select
              value={form.opportunityId}
              onChange={(event) => updateForm({ opportunityId: event.target.value })}
              className={entityInputClassName}
            >
              <option value="">Aucune opportunité</option>
              {opportunities.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>
              ))}
            </select>
          </label>
        </FormSection>

        <FormSection title="Conditions" description="Les règles existantes sont conservées : validité, devise, remise et TVA de ligne.">
          <FormField label="Validité" required help="Nombre de jours avant expiration.">
            <input
              type="number"
              min="1"
              value={form.validityDays}
              onChange={(event) => updateForm({ validityDays: Number(event.target.value) })}
              className={entityInputClassName}
            />
          </FormField>
          <label className="block">
            <span className="text-sm font-bold text-hicotech-navy dark:text-white">Devise</span>
            <select value={form.currency} onChange={(event) => updateForm({ currency: event.target.value as QuoteCurrency })} className={entityInputClassName}>
              <option value="MAD">MAD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </label>
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

        <FormSection title="Articles" description="Ajoutez les produits ou lignes manuelles du devis.">
          <SalesLineItemsEditor
            currency={form.currency}
            lines={form.items}
            onChange={(items) => updateForm({ items })}
          />
        </FormSection>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Totaux du devis</h3>
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
  if (companyId) return companyId as CompanyId;
  const byName = getCompanyPickerItems().find((company) => company.title === companyName);
  return byName?.relations?.companyId as CompanyId | undefined;
}

function resolveContactId(contactId: string) {
  return contactId ? contactId as ContactId : undefined;
}

function resolveOpportunityId(opportunityId: string) {
  return opportunities.some((opportunity) => opportunity.id === opportunityId) ? opportunityId as OpportunityId : undefined;
}

function resolveOpportunityName(opportunityId: string) {
  return opportunities.find((opportunity) => opportunity.id === opportunityId)?.title;
}

function TotalPill({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/35">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className={`mt-1 text-sm font-bold ${strong ? "text-hicotech-blue" : "text-hicotech-navy dark:text-white"}`}>{value}</p>
    </div>
  );
}
