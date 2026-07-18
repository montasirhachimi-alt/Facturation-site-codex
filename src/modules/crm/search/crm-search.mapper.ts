import type { Company } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService } from "@/modules/crm/companies/ui/company-local-store";
import type { Contact } from "@/modules/crm/contacts";
import type { SearchResult } from "@/runtime/search";
import { scoreSearchFields } from "@/runtime/search";

export function mapCompanyToSearchResult(company: Company, queryText: string): SearchResult | undefined {
  const score = scoreSearchFields(queryText, [
    { value: company.id, weight: "identifier" },
    { value: company.registrationNumber, weight: "identifier" },
    { value: company.taxNumber, weight: "identifier" },
    { value: company.displayName, weight: "title" },
    { value: company.legalName, weight: "title" },
    { value: company.email, weight: "secondary" },
    { value: company.phone, weight: "secondary" },
    { value: company.city, weight: "secondary" },
    { value: company.industry, weight: "metadata" },
    { value: company.status, weight: "metadata" }
  ]);

  if (score <= 0) return undefined;

  return {
    id: `crm:company:${company.id}`,
    entityType: "crm.company",
    entityId: company.id,
    moduleId: "crm.companies",
    title: company.displayName,
    subtitle: company.legalName !== company.displayName ? company.legalName : undefined,
    description: [company.city, company.email, company.phone].filter(Boolean).join(" · "),
    keywords: [
      company.id,
      company.displayName,
      company.legalName,
      company.registrationNumber,
      company.taxNumber,
      company.email,
      company.phone,
      company.city,
      company.country,
      company.industry,
      company.status,
      ...company.tags
    ].filter(Boolean) as string[],
    icon: "Building2",
    url: `/crm/companies/${company.id}`,
    score,
    metadata: {
      status: company.status,
      workspaceId: company.workspaceId
    }
  };
}

export function mapContactToSearchResult(contact: Contact, queryText: string, companyById = getCrmCompanyById()): SearchResult | undefined {
  const company = companyById.get(contact.companyId);
  const score = scoreSearchFields(queryText, [
    { value: contact.id, weight: "identifier" },
    { value: contact.fullName, weight: "title" },
    { value: contact.firstName, weight: "title" },
    { value: contact.lastName, weight: "title" },
    { value: contact.email, weight: "secondary" },
    { value: contact.mobilePhone, weight: "secondary" },
    { value: contact.officePhone, weight: "secondary" },
    { value: contact.jobTitle, weight: "secondary" },
    { value: company?.displayName, weight: "secondary" },
    { value: contact.department, weight: "metadata" },
    { value: contact.role, weight: "metadata" },
    { value: contact.status, weight: "metadata" }
  ]);

  if (score <= 0) return undefined;

  return {
    id: `crm:contact:${contact.id}`,
    entityType: "crm.contact",
    entityId: contact.id,
    moduleId: "crm.contacts",
    title: contact.fullName,
    subtitle: company?.displayName,
    description: [contact.jobTitle, contact.email, contact.mobilePhone ?? contact.officePhone].filter(Boolean).join(" · "),
    keywords: [
      contact.id,
      contact.fullName,
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.mobilePhone,
      contact.officePhone,
      contact.jobTitle,
      contact.department,
      contact.role,
      contact.status,
      company?.displayName,
      ...contact.tags
    ].filter(Boolean) as string[],
    icon: "ContactRound",
    url: `/crm/contacts/${contact.id}`,
    score,
    metadata: {
      companyId: contact.companyId,
      companyName: company?.displayName,
      status: contact.status,
      workspaceId: contact.workspaceId
    }
  };
}

function getCrmCompanyById() {
  return new Map(
    crmCompanyLocalService
      .listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false })
      .companies.map((company) => [company.id, company])
  );
}
