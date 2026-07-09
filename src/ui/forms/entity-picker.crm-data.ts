import { Building2, ContactRound, Users } from "lucide-react";
import type { EntityPickerItem } from "./entity-picker.types";
import { crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { crmContactSeed } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmCustomerSeed } from "@/modules/crm/customers/ui/customers.seed";

const companyById = new Map(crmCompanySeed.map((company) => [company.id, company]));

export function getCompanyPickerItems(): readonly EntityPickerItem[] {
  return crmCompanySeed.map((company) => ({
    id: company.id,
    title: company.displayName,
    type: "company",
    typeLabel: "Company",
    metadata: `${company.city ?? "Ville non renseignée"} · ${formatStatus(company.status)} · ${company.industry}`,
    icon: Building2,
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
  }));
}

export function getContactPickerItems(): readonly EntityPickerItem[] {
  return crmContactSeed.map((contact) => {
    const company = companyById.get(contact.companyId);

    return {
      id: contact.id,
      title: contact.fullName,
      type: "contact",
      typeLabel: "Contact",
      metadata: `${company?.displayName ?? "Société inconnue"} · ${contact.jobTitle ?? contact.department ?? "Contact CRM"}`,
      icon: ContactRound,
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
  return crmCustomerSeed.map((customer) => ({
    id: customer.id,
    title: customer.displayName,
    type: "customer",
    typeLabel: "Customer",
    metadata: `${customer.companyName ?? "Sans société"} · ${formatStatus(customer.status)}`,
    icon: Users,
    keywords: [
      customer.displayName,
      customer.companyName,
      customer.email,
      customer.phone,
      customer.status,
      customer.type,
      customer.source,
      ...(customer.tags ?? [])
    ].filter(Boolean) as string[]
  }));
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
