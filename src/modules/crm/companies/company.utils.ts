import { DEFAULT_COMPANY_COUNTRY, DEFAULT_COMPANY_SORT } from "./company.constants";
import type { Company, CompanyFilters, CompanySearchQuery, CompanySort, CreateCompanyInput, UpdateCompanyInput } from "./company.types";
import { filterCrmEntities, normalizeCrmString, normalizeCrmTags, searchCrmEntities, sortCrmEntities } from "@/modules/crm/shared";

export function getCompanyDisplayLabel(company: Company) {
  return company.displayName || company.legalName;
}

export function normalizeCreateCompanyInput(input: CreateCompanyInput) {
  const legalName = input.legalName.trim();

  return {
    ...input,
    legalName,
    displayName: input.displayName?.trim() || legalName,
    registrationNumber: input.registrationNumber?.trim() || undefined,
    taxNumber: input.taxNumber?.trim() || undefined,
    website: normalizeWebsite(input.website),
    email: input.email?.trim().toLowerCase() || undefined,
    phone: input.phone?.trim() || undefined,
    address: input.address?.trim() || undefined,
    city: input.city?.trim() || undefined,
    country: input.country?.trim() || DEFAULT_COMPANY_COUNTRY,
    tags: normalizeCrmTags(input.tags),
    notes: input.notes?.trim() || undefined
  };
}

export function normalizeUpdateCompanyInput(input: UpdateCompanyInput) {
  return {
    ...input,
    legalName: input.legalName?.trim(),
    displayName: input.displayName?.trim(),
    registrationNumber: input.registrationNumber?.trim() || undefined,
    taxNumber: input.taxNumber?.trim() || undefined,
    website: normalizeWebsite(input.website),
    email: input.email?.trim().toLowerCase() || undefined,
    phone: input.phone?.trim() || undefined,
    address: input.address?.trim() || undefined,
    city: input.city?.trim() || undefined,
    country: input.country?.trim() || undefined,
    tags: input.tags ? normalizeCrmTags(input.tags) : undefined,
    notes: input.notes?.trim() || undefined
  };
}

export function filterCompanies(companies: readonly Company[], filters: CompanyFilters) {
  return filterCrmEntities(companies, {
    workspaceId: filters.workspaceId,
    status: filters.status,
    ownerId: filters.ownerId,
    tags: filters.tags,
    archived: filters.includeArchived ? undefined : false
  }).filter((company) => {
    if (!filters.includeArchived && isCompanyArchived(company)) return false;
    if (filters.industry && company.industry !== filters.industry) return false;
    if (filters.city && normalizeCrmString(company.city) !== normalizeCrmString(filters.city)) return false;
    if (filters.country && normalizeCrmString(company.country) !== normalizeCrmString(filters.country)) return false;
    return true;
  });
}

export function matchesCompanySearch(company: Company, search: CompanySearchQuery) {
  if (company.workspaceId !== search.workspaceId) return false;
  if (!search.includeArchived && isCompanyArchived(company)) return false;
  if (!search.query.trim()) return true;

  return searchCrmEntities([company], {
    query: search.query,
    fields: [
      "legalName",
      "displayName",
      "registrationNumber",
      "taxNumber",
      "industry",
      "website",
      "email",
      "phone",
      "city",
      "country",
      "status"
    ]
  }).length > 0;
}

export function sortCompanies(companies: readonly Company[], sort: CompanySort = DEFAULT_COMPANY_SORT) {
  return sortCrmEntities(companies, [sort]);
}

export function isCompanyLead(company: Company) {
  return company.status === "lead";
}

export function isCompanyActive(company: Company) {
  return company.status === "active";
}

export function isCompanyArchived(company: Company) {
  return company.status === "archived";
}

function normalizeWebsite(website: string | undefined) {
  const value = website?.trim();
  if (!value) return undefined;
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}
