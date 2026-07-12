"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { persistCrmSalesRecord } from "@/platform/persistence";
import { FormSection } from "@/ui/forms/form-field";
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
import { getCompanyPickerItems, subscribeToCrmPickerSources } from "@/ui/forms/entity-picker.crm-data";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pickerVersion, setPickerVersion] = useState(0);
  const liveCompanyPickerItems = useMemo(() => {
    void pickerVersion;
    return getCompanyPickerItems();
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
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  function finishWithSuccess(message: string) {
    setCompanyForm(emptyCompanyForm);
    setContactForm(emptyContactForm);
    setContactCompanyId("");
    setError(null);
    setSuccessMessage(message);
    onClose();
  }

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
    finishWithSuccess("Société créée.");
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
    finishWithSuccess("Contact enregistré.");
  }

  const toast = successMessage ? (
    <p
      role="status"
      className="fixed bottom-4 right-4 z-[90] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-[0_18px_45px_rgba(15,118,110,0.18)] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
    >
      {successMessage}
    </p>
  ) : null;

  if (activeAction === "quick-create.company") {
    return (
      <>
        {toast}
        <CompanyDialog
          error={error}
          form={companyForm}
          onChange={setCompanyForm}
          onClose={closeAndReset}
          onSubmit={submitCompany}
          open
        />
      </>
    );
  }

  if (activeAction === "quick-create.contact") {
    return (
      <>
        {toast}
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
      </>
    );
  }

  if (activeAction === "quick-create.quote") {
    return (
      <QuoteDialog
        onClose={closeAndReset}
        onSubmit={(quote) => {
          finishWithSuccess("Devis créé.");
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
          finishWithSuccess("Facture créée.");
          router.push(`/sales/invoices/${invoice.id}`);
        }}
        open
      />
    );
  }

  return toast;
}
