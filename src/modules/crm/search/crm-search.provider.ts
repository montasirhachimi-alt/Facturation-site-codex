import type { SearchProvider } from "@/runtime/search";

function createCrmSearchProvider(moduleId: SearchProvider["moduleId"], label: string): SearchProvider {
  return Object.freeze({
    moduleId,
    label,
    search: async () => Object.freeze([])
  });
}

export const crmSearchProviders: readonly SearchProvider[] = Object.freeze([
  createCrmSearchProvider("crm.overview", "CRM Overview Search Provider"),
  createCrmSearchProvider("crm.companies", "CRM Companies Search Provider"),
  createCrmSearchProvider("crm.contacts", "CRM Contacts Search Provider"),
  createCrmSearchProvider("crm.meetings", "CRM Meetings Search Provider"),
  createCrmSearchProvider("crm.tasks", "CRM Tasks Search Provider"),
  createCrmSearchProvider("crm.notes", "CRM Notes Search Provider")
]);

export const crmSearchProvider = crmSearchProviders[0];
