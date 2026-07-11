"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { persistCrmSalesRecord } from "@/platform/persistence";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormSection } from "@/ui/forms/form-field";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import type { CompanyId } from "@/modules/crm/companies";
import { CompanyDialog } from "@/modules/crm/companies/ui/dialogs/company-dialog";
import type { CompanyFormState } from "@/modules/crm/companies/ui/hooks/use-companies-page";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, notifyCrmCompanyStoreUpdated } from "@/modules/crm/companies/ui/company-local-store";
import { ContactDialog } from "@/modules/crm/contacts/ui/dialogs/contact-dialog";
import type { ContactFormState } from "@/modules/crm/contacts/ui/hooks/use-company-contacts-workspace";
import { CRM_CONTACTS_USER_ID, CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService, notifyCrmContactStoreUpdated } from "@/modules/crm/contacts/ui/contact-local-store";
import { QuoteDialog } from "@/modules/sales/quotes/ui/quote-dialog";
import { InvoiceDialog } from "@/modules/sales/invoices/ui/invoice-dialog";
import { getCompanyPickerItems, getContactPickerItems, subscribeToCrmPickerSources } from "@/ui/forms/entity-picker.crm-data";
import { getInvoicePickerItems } from "@/ui/forms/entity-picker.sales-data";
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

const invoicePickerItems = getInvoicePickerItems();

type QuickCreateDialogHostProps = {
  activeAction: QuickCreateActionId | null;
  onClose: () => void;
};

export function QuickCreateDialogHost({ activeAction, onClose }: QuickCreateDialogHostProps) {
  const router = useRouter();
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(emptyCompanyForm);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [contactCompanyId, setContactCompanyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pickerVersion, setPickerVersion] = useState(0);
  const liveCompanyPickerItems = useMemo(() => {
    void pickerVersion;
    return getCompanyPickerItems();
  }, [pickerVersion]);
  const liveContactPickerItems = useMemo(() => {
    void pickerVersion;
    return getContactPickerItems();
  }, [pickerVersion]);

  const closeAndReset = useCallback(() => {
    setCompanyForm(emptyCompanyForm);
    setContactForm(emptyContactForm);
    setContactCompanyId("");
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => subscribeToCrmPickerSources(() => setPickerVersion((value) => value + 1)), []);

  useEffect(() => {
    const routeByAction: Partial<Record<QuickCreateActionId, string>> = {
      "quick-create.meeting": "/crm/meetings",
      "quick-create.task": "/crm/tasks",
      "quick-create.note": "/crm/notes"
    };
    const route = activeAction ? routeByAction[activeAction] : undefined;
    if (!route) return;
    onClose();
    router.push(route);
  }, [activeAction, onClose, router]);

  async function submitCompany() {
    const snapshot = crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: true }).companies;
    const result = crmCompanyLocalService.createCompany({
      workspaceId: CRM_COMPANIES_WORKSPACE_ID,
      legalName: companyForm.legalName,
      displayName: companyForm.displayName,
      industry: companyForm.industry,
      website: companyForm.website,
      email: companyForm.email,
      phone: companyForm.phone,
      city: companyForm.city,
      country: companyForm.country,
      status: companyForm.status,
      tags: companyForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      notes: companyForm.notes,
      ownerId: CRM_COMPANIES_USER_ID,
      createdBy: CRM_COMPANIES_USER_ID
    });
    if (!result.company) {
      setError(result.validation.issues[0]?.message ?? "Impossible de créer la société.");
      return false;
    }
    try {
      await persistCrmSalesRecord("company", result.company);
    } catch {
      crmCompanyLocalService.replaceCompanies(snapshot);
      setError("La société n'a pas pu être enregistrée dans la base. Vérifiez la connexion puis réessayez.");
      return false;
    }
    notifyCrmCompanyStoreUpdated();
    closeAndReset();
    return true;
  }

  async function submitContact() {
    if (!contactCompanyId) {
      setError("Sélectionnez une société pour rattacher le contact.");
      return;
    }
    const snapshot = crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: true }).contacts;
    const result = crmContactLocalService.createContact({
      workspaceId: CRM_CONTACTS_WORKSPACE_ID,
      companyId: contactCompanyId as CompanyId,
      firstName: contactForm.firstName,
      lastName: contactForm.lastName,
      jobTitle: contactForm.jobTitle,
      department: contactForm.department,
      email: contactForm.email,
      mobilePhone: contactForm.mobilePhone,
      officePhone: contactForm.officePhone,
      preferredLanguage: contactForm.preferredLanguage,
      timezone: contactForm.timezone,
      status: contactForm.status,
      isPrimaryContact: contactForm.isPrimaryContact,
      isDecisionMaker: contactForm.isDecisionMaker,
      linkedin: contactForm.linkedin,
      notes: contactForm.notes,
      tags: contactForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      ownerId: CRM_CONTACTS_USER_ID,
      createdBy: CRM_CONTACTS_USER_ID
    });
    if (!result.contact) {
      setError(result.validation.issues[0]?.message ?? "Impossible de créer le contact.");
      return;
    }
    try {
      await persistCrmSalesRecord("contact", result.contact);
    } catch {
      crmContactLocalService.replaceContacts(snapshot);
      setError("Le contact n'a pas pu être enregistré dans la base. Vérifiez la connexion puis réessayez.");
      return;
    }
    notifyCrmContactStoreUpdated();
    closeAndReset();
  }

  if (activeAction === "quick-create.company") {
    return (
      <CompanyDialog
        error={error}
        form={companyForm}
        onChange={setCompanyForm}
        onClose={closeAndReset}
        onSubmit={submitCompany}
        open
      />
    );
  }

  if (activeAction === "quick-create.contact") {
    return (
      <ContactDialog
        editing={false}
        error={error}
        form={contactForm}
        onChange={setContactForm}
        onClose={closeAndReset}
        onSubmit={submitContact}
        open
        relationshipField={
          <FormSection title="Relation CRM" description="Chaque contact doit être rattaché à une société existante.">
            <SmartEntityPicker
              label="Société"
              items={liveCompanyPickerItems}
              value={liveCompanyPickerItems.find((item) => item.id === contactCompanyId)?.title ?? ""}
              onChange={({ item }) => setContactCompanyId(item?.relations?.companyId ?? "")}
              placeholder="Rechercher une société..."
            />
          </FormSection>
        }
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
          { key: "company", label: "Société", items: liveCompanyPickerItems, placeholder: "Rechercher une société..." },
          { key: "contact", label: "Contact", items: liveContactPickerItems, placeholder: "Rechercher un contact..." }
        ]}
      />
    );
  }

  if (activeAction === "quick-create.quote") {
    return (
      <QuoteDialog
        onClose={closeAndReset}
        onSubmit={(quote) => {
          closeAndReset();
          router.push(`/sales/quotes/${quote.id}`);
        }}
        open
      />
    );
  }

  if (activeAction === "quick-create.invoice") {
    return (
      <InvoiceDialog
        onClose={closeAndReset}
        onSubmit={(invoice) => {
          closeAndReset();
          router.push(`/sales/invoices/${invoice.id}`);
        }}
        open
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
      size="lg"
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
