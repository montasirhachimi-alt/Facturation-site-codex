"use client";

import { useState } from "react";
import { crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { crmOpportunitySeed } from "@/modules/crm/opportunities/ui/opportunities.seed";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormSection } from "@/ui/forms/form-field";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import { getCompanyPickerItems, getContactPickerItems, getCustomerPickerItems } from "@/ui/forms/entity-picker.crm-data";
import type { EntityPickerItem } from "@/ui/forms/entity-picker.types";

const companies = crmCompanySeed;
const opportunities = crmOpportunitySeed;
const companyPickerItems = getCompanyPickerItems();
const contactPickerItems = getContactPickerItems();
const customerPickerItems = getCustomerPickerItems();

export function QuoteDialog({ onClose, onSubmit, open }: { onClose: () => void; onSubmit: () => void; open: boolean }) {
  const [customerName, setCustomerName] = useState(companies[0]?.displayName ?? "");
  const [companyName, setCompanyName] = useState(companies[0]?.displayName ?? "");
  const [contactName, setContactName] = useState("");

  return (
    <EntityDialog
      eyebrow="Ventes"
      title="Créer un devis"
      description="Structure du futur formulaire complet. La création utilise actuellement des données de démonstration en mémoire."
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      footer={<FormActions onCancel={onClose} submitLabel="Créer un devis" />}
    >
      <div className="mt-5 space-y-3">
        <FormSection title="Contexte commercial" description="Le devis de démonstration garde les mêmes données, mais présente clairement son origine.">
          <SmartEntityPicker
            label="Client"
            items={customerPickerItems}
            value={customerName}
            onChange={({ value }) => setCustomerName(value)}
            placeholder="Rechercher un client..."
            helper="Tapez quelques lettres pour retrouver un client existant."
            allowCreate
            createLabel="Créer le client"
            entityType="client"
            onCreate={(name) => createLocalPickerItem(customerPickerItems, name, "customer", "Customer")}
          />
          <SmartEntityPicker
            label="Société"
            items={companyPickerItems}
            value={companyName}
            onChange={({ value }) => setCompanyName(value)}
            placeholder="Rechercher une société..."
            allowCreate
            createLabel="Créer la société"
            entityType="société"
            onCreate={(name) => createLocalPickerItem(companyPickerItems, name, "company", "Company")}
          />
          <SmartEntityPicker
            label="Contact"
            items={contactPickerItems}
            value={contactName}
            onChange={({ value }) => setContactName(value)}
            placeholder="Rechercher un contact..."
            allowCreate
            createLabel="Créer le contact"
            entityType="contact"
            onCreate={(name) => createLocalPickerItem(contactPickerItems, name, "contact", "Contact")}
          />
          <PreviewField label="Opportunité" value={opportunities[0]?.title ?? "Opportunité optionnelle"} />
          <PreviewField label="Validité" value="30 jours" />
        </FormSection>

        <FormSection title="Conditions financières" description="Paramètres préremplis par le flux actuel de création.">
          <PreviewField label="Devise" value="MAD" />
          <PreviewField label="Remise" value="2%" />
          <PreviewField label="Taxe" value="TVA 20%" />
          <PreviewField label="Notes" value="Notes internes préparées" />
        </FormSection>
      </div>
    </EntityDialog>
  );
}

function createLocalPickerItem(items: readonly EntityPickerItem[], title: string, type: EntityPickerItem["type"], typeLabel: string): EntityPickerItem {
  const fallback = items[0];
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}
