"use client";

import { useCallback, useState } from "react";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormSection } from "@/ui/forms/form-field";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import { CompanyDialog } from "@/modules/crm/companies/ui/dialogs/company-dialog";
import type { CompanyFormState } from "@/modules/crm/companies/ui/hooks/use-companies-page";
import { ContactDialog } from "@/modules/crm/contacts/ui/dialogs/contact-dialog";
import type { ContactFormState } from "@/modules/crm/contacts/ui/hooks/use-company-contacts-workspace";
import { CustomerDialog } from "@/modules/crm/customers/ui/dialogs/customer-dialog";
import type { CustomerFormState } from "@/modules/crm/customers/ui/hooks/use-customers-page";
import { QuoteDialog } from "@/modules/sales/quotes/ui/quote-dialog";
import { getCompanyPickerItems, getContactPickerItems, getCustomerPickerItems } from "@/ui/forms/entity-picker.crm-data";
import { getInvoicePickerItems, getQuotePickerItems } from "@/ui/forms/entity-picker.sales-data";
import type { EntityPickerItem } from "@/ui/forms/entity-picker.types";
import type { QuickCreateActionId } from "../action-registry";

const emptyCompanyForm: CompanyFormState = {
  legalName: "",
  displayName: "",
  industry: "unknown",
  website: "",
  email: "",
  phone: "",
  city: "",
  country: "Maroc",
  status: "lead",
  tags: "",
  notes: ""
};

const emptyContactForm: ContactFormState = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  department: "",
  email: "",
  mobilePhone: "",
  officePhone: "",
  preferredLanguage: "fr",
  timezone: "Africa/Casablanca",
  status: "active",
  isPrimaryContact: false,
  isDecisionMaker: false,
  linkedin: "",
  notes: "",
  tags: ""
};

const emptyCustomerForm: CustomerFormState = {
  displayName: "",
  companyName: "",
  email: "",
  phone: "",
  status: "lead",
  type: "company",
  tags: "",
  notes: ""
};

const companyPickerItems = getCompanyPickerItems();
const contactPickerItems = getContactPickerItems();
const customerPickerItems = getCustomerPickerItems();
const quotePickerItems = getQuotePickerItems();
const invoicePickerItems = getInvoicePickerItems();

type QuickCreateDialogHostProps = {
  activeAction: QuickCreateActionId | null;
  onClose: () => void;
};

export function QuickCreateDialogHost({ activeAction, onClose }: QuickCreateDialogHostProps) {
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(emptyCompanyForm);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(emptyCustomerForm);

  const closeAndReset = useCallback(() => {
    setCompanyForm(emptyCompanyForm);
    setContactForm(emptyContactForm);
    setCustomerForm(emptyCustomerForm);
    onClose();
  }, [onClose]);

  if (activeAction === "quick-create.company") {
    return (
      <CompanyDialog
        error={null}
        form={companyForm}
        onChange={setCompanyForm}
        onClose={closeAndReset}
        onSubmit={() => {
          closeAndReset();
          return true;
        }}
        open
      />
    );
  }

  if (activeAction === "quick-create.contact") {
    return (
      <ContactDialog
        editing={false}
        error={null}
        form={contactForm}
        onChange={setContactForm}
        onClose={closeAndReset}
        onSubmit={closeAndReset}
        open
      />
    );
  }

  if (activeAction === "quick-create.customer") {
    return (
      <CustomerDialog
        error={null}
        form={customerForm}
        onChange={setCustomerForm}
        onClose={closeAndReset}
        onSubmit={() => {
          closeAndReset();
          return true;
        }}
        open
      />
    );
  }

  if (activeAction === "quick-create.opportunity") {
    return (
      <QuickCreatePreviewDialog
        eyebrow="CRM"
        title="Créer une opportunité"
        description="Flux rapide préparé pour le pipeline commercial, sans navigation intermédiaire."
        submitLabel="Créer l'opportunité"
        onClose={closeAndReset}
        rows={[
          ["Étape", "Qualification"],
          ["Priorité", "Normale"],
          ["Montant estimé", "À renseigner"]
        ]}
        pickerRows={[
          { key: "company", label: "Société", items: companyPickerItems, placeholder: "Rechercher une société..." },
          { key: "contact", label: "Contact", items: contactPickerItems, placeholder: "Rechercher un contact..." }
        ]}
      />
    );
  }

  if (activeAction === "quick-create.quote") {
    return (
      <QuoteDialog
        onClose={closeAndReset}
        onSubmit={closeAndReset}
        open
      />
    );
  }

  if (activeAction === "quick-create.invoice") {
    return (
      <QuickCreatePreviewDialog
        eyebrow="Ventes"
        title="Créer une facture"
        description="Préparation rapide d'une facture depuis le centre de commandes."
        submitLabel="Créer une facture"
        onClose={closeAndReset}
        rows={[
          ["Échéance", "30 jours"],
          ["Devise", "MAD"]
        ]}
        pickerRows={[
          { key: "customer", label: "Client", items: customerPickerItems, placeholder: "Rechercher un client...", allowCreate: true, createLabel: "Créer le client", entityType: "client" },
          { key: "quote", label: "Devis source", items: quotePickerItems, placeholder: "Rechercher un devis..." }
        ]}
      />
    );
  }

  if (activeAction === "quick-create.payment") {
    return (
      <QuickCreatePreviewDialog
        eyebrow="Ventes"
        title="Créer un paiement"
        description="Préparation rapide d'un encaissement depuis le centre de commandes."
        submitLabel="Créer un paiement"
        onClose={closeAndReset}
        rows={[
          ["Méthode", "Virement"],
          ["Montant", "À renseigner"],
          ["Référence", "Optionnelle"]
        ]}
        pickerRows={[
          { key: "invoice", label: "Facture", items: invoicePickerItems, placeholder: "Rechercher une facture..." }
        ]}
      />
    );
  }

  return null;
}

function QuickCreatePreviewDialog({
  description,
  eyebrow,
  onClose,
  pickerRows = [],
  rows,
  submitLabel,
  title
}: {
  description: string;
  eyebrow: string;
  onClose: () => void;
  pickerRows?: readonly {
    key: string;
    label: string;
    items: readonly EntityPickerItem[];
    placeholder: string;
    allowCreate?: boolean;
    createLabel?: string;
    entityType?: string;
  }[];
  rows: readonly (readonly [string, string])[];
  submitLabel: string;
  title: string;
}) {
  const [pickerValues, setPickerValues] = useState<Record<string, string>>({});

  return (
    <EntityDialog
      eyebrow={eyebrow}
      title={title}
      description={description}
      open
      onClose={onClose}
      onSubmit={onClose}
      footer={<FormActions onCancel={onClose} submitLabel={submitLabel} />}
    >
      <div className="mt-5 space-y-3">
        <FormSection title="Création rapide" description="La surface réutilise les conventions de formulaire BOSIACO et reste prête pour les prochains workflows complets.">
          {pickerRows.map((picker) => (
            <SmartEntityPicker
              key={picker.key}
              label={picker.label}
              items={picker.items}
              value={pickerValues[picker.key] ?? ""}
              onChange={({ value }) => setPickerValues((current) => ({ ...current, [picker.key]: value }))}
              placeholder={picker.placeholder}
              allowCreate={picker.allowCreate}
              createLabel={picker.createLabel}
              entityType={picker.entityType}
              onCreate={picker.allowCreate ? (name) => createLocalPickerItem(picker.items, name, picker.key, picker.label) : undefined}
            />
          ))}
          {rows.map(([label, value]) => (
            <PreviewField key={label} label={label} value={value} />
          ))}
        </FormSection>
      </div>
    </EntityDialog>
  );
}

function createLocalPickerItem(items: readonly EntityPickerItem[], title: string, type: string, typeLabel: string): EntityPickerItem {
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
