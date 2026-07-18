import type { SearchProvider, SearchQuery, SearchResult } from "@/runtime/search";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService } from "@/modules/crm/companies/ui/company-local-store";
import { CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService } from "@/modules/crm/contacts/ui/contact-local-store";
import { mapCompanyToSearchResult, mapContactToSearchResult } from "./crm-search.mapper";

function createCrmSearchProvider(moduleId: SearchProvider["moduleId"], label: string): SearchProvider {
  return Object.freeze({
    moduleId,
    label,
    search: async () => Object.freeze([])
  });
}

export const crmSearchProviders: readonly SearchProvider[] = Object.freeze([
  createCrmSearchProvider("crm.overview", "CRM Overview Search Provider"),
  Object.freeze({
    moduleId: "crm.companies",
    label: "CRM Companies Search Provider",
    search: async (query: SearchQuery) =>
      Object.freeze(
        crmCompanyLocalService
          .listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false })
          .companies.map((company) => mapCompanyToSearchResult(company, query.text))
          .filter(isSearchResult)
      )
  }),
  Object.freeze({
    moduleId: "crm.contacts",
    label: "CRM Contacts Search Provider",
    search: async (query: SearchQuery) =>
      Object.freeze(
        crmContactLocalService
          .listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: false })
          .contacts.map((contact) => mapContactToSearchResult(contact, query.text))
          .filter(isSearchResult)
      )
  }),
  createCrmSearchProvider("crm.meetings", "CRM Meetings Search Provider"),
  createCrmSearchProvider("crm.tasks", "CRM Tasks Search Provider"),
  createCrmSearchProvider("crm.notes", "CRM Notes Search Provider")
]);

export const crmSearchProvider = crmSearchProviders[0];

function isSearchResult(result: SearchResult | undefined): result is SearchResult {
  return Boolean(result);
}
