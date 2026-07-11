import { Building2, ContactRound } from "lucide-react";
import { persistCrmSalesRecord } from "@/platform/persistence";
import type { CompanyId } from "@/modules/crm/companies";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, notifyCrmCompanyStoreUpdated, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { CRM_CONTACTS_USER_ID, CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService, notifyCrmContactStoreUpdated, subscribeToCrmContactStore } from "@/modules/crm/contacts/ui/contact-local-store";
import type { EntityPickerItem } from "./entity-picker.types";

export function subscribeToCrmPickerSources(listener: () => void) {
  const unsubscribeCompanies = subscribeToCrmCompanyStore(listener);
  const unsubscribeContacts = subscribeToCrmContactStore(listener);

  return () => {
    unsubscribeCompanies();
    unsubscribeContacts();
  };
}

export function getCompanyPickerItems(): readonly EntityPickerItem[] {
  return crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies.map(companyToPickerItem);
}

export function getContactPickerItems(companyId?: string): readonly EntityPickerItem[] {
  const companies = getCompanyMap();
  return crmContactLocalService.listContacts({
    workspaceId: CRM_CONTACTS_WORKSPACE_ID,
    companyId: companyId as CompanyId | undefined,
    includeArchived: false
  }).contacts.map((contact) => {
    const company = companies.get(contact.companyId);

    return {
      id: contact.id,
      title: contact.fullName,
      type: "contact",
      typeLabel: "Contact",
      metadata: `${company?.displayName ?? "Société inconnue"} · ${contact.jobTitle ?? contact.department ?? "Contact CRM"}`,
      icon: ContactRound,
      relations: {
        contactId: contact.id,
        contactName: contact.fullName,
        companyId: contact.companyId,
        companyName: company?.displayName
      },
      keywords: [
        contact.fullName,
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.mobilePhone,
        contact.jobTitle,
        contact.department,
        company?.displayName,
        ...(contact.tags ?? [])
      ].filter(Boolean) as string[]
    };
  });
}

export function getCustomerPickerItems(): readonly EntityPickerItem[] {
  return getCompanyPickerItems();
}

export async function createCompanyPickerItem(title: string): Promise<EntityPickerItem> {
  const snapshot = crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: true }).companies;
  const result = crmCompanyLocalService.createCompany({
    workspaceId: CRM_COMPANIES_WORKSPACE_ID,
    legalName: title,
    displayName: title,
    industry: "unknown",
    country: "Maroc",
    status: "lead",
    tags: [],
    createdBy: CRM_COMPANIES_USER_ID,
    ownerId: CRM_COMPANIES_USER_ID
  });

  if (!result.company) return createFallbackPickerItem(title, "company", "Company", "Société non enregistrée");

  try {
    await persistCrmSalesRecord("company", result.company);
  } catch {
    crmCompanyLocalService.replaceCompanies(snapshot);
    throw new Error("La société n'a pas pu être enregistrée dans la base. Vérifiez la connexion puis réessayez.");
  }

  notifyCrmCompanyStoreUpdated();
  return companyToPickerItem(result.company);
}

export async function createCustomerPickerItem(title: string, company?: { id?: string; name?: string }): Promise<EntityPickerItem> {
  if (company?.id) {
    const existing = getCompanyPickerItems().find((item) => item.relations?.companyId === company.id);
    if (existing) return existing;
  }

  return createCompanyPickerItem(company?.name || title);
}

export async function createContactPickerItem(title: string, company?: { id?: string; name?: string }): Promise<EntityPickerItem> {
  const companyId = resolveCompanyId(company);
  if (!companyId) return createFallbackPickerItem(title, "contact", "Contact", "Sélectionnez une société avant de créer le contact");

  const snapshot = crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: true }).contacts;
  const { firstName, lastName } = splitContactName(title);
  const result = crmContactLocalService.createContact({
    workspaceId: CRM_CONTACTS_WORKSPACE_ID,
    companyId,
    firstName,
    lastName,
    status: "active",
    isPrimaryContact: false,
    isDecisionMaker: false,
    tags: [],
    createdBy: CRM_CONTACTS_USER_ID,
    ownerId: CRM_CONTACTS_USER_ID
  });

  if (!result.contact) return createFallbackPickerItem(title, "contact", "Contact", "Contact non enregistré");

  try {
    await persistCrmSalesRecord("contact", result.contact);
  } catch {
    crmContactLocalService.replaceContacts(snapshot);
    throw new Error("Le contact n'a pas pu être enregistré dans la base. Vérifiez la connexion puis réessayez.");
  }

  notifyCrmContactStoreUpdated();
  return getContactPickerItems().find((item) => item.id === result.contact?.id) ?? createFallbackPickerItem(title, "contact", "Contact", "Contact créé localement");
}

function companyToPickerItem(company: ReturnType<typeof crmCompanyLocalService.listCompanies>["companies"][number]): EntityPickerItem {
  return {
    id: company.id,
    title: company.displayName,
    type: "company",
    typeLabel: "Company",
    metadata: `${company.city ?? "Ville non renseignée"} · ${formatStatus(company.status)} · ${company.industry}`,
    icon: Building2,
    relations: {
      companyId: company.id,
      companyName: company.displayName
    },
    keywords: [
      company.displayName,
      company.legalName,
      company.email,
      company.phone,
      company.city,
      company.country,
      company.industry,
      company.status,
      ...(company.tags ?? [])
    ].filter(Boolean) as string[]
  };
}

function resolveCompanyId(company?: { id?: string; name?: string }) {
  if (company?.id && crmCompanyLocalService.getCompany(company.id as CompanyId, CRM_COMPANIES_WORKSPACE_ID)) {
    return company.id as CompanyId;
  }

  if (!company?.name) return undefined;
  const existing = crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies
    .find((entry) => entry.displayName === company.name || entry.legalName === company.name);
  return existing?.id;
}

function getCompanyMap() {
  return new Map(crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies.map((company) => [company.id, company]));
}

function splitContactName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? value.trim();
  const lastName = parts.slice(1).join(" ") || "-";
  return { firstName, lastName };
}

function createFallbackPickerItem(title: string, type: EntityPickerItem["type"], typeLabel: string, metadata: string): EntityPickerItem {
  return {
    id: `inline-${type}-${slugify(title)}-${Date.now()}`,
    title,
    type,
    typeLabel,
    metadata,
    icon: type === "contact" ? ContactRound : Building2,
    keywords: [title, "inline", "local"]
  };
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    active: "Actif",
    archived: "Archivé",
    inactive: "Inactif",
    lead: "Prospect"
  };

  return labels[status] ?? status;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
