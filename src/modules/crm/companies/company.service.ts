import { DEFAULT_COMPANY_INDUSTRY, DEFAULT_COMPANY_SORT, DEFAULT_COMPANY_STATUS } from "./company.constants";
import type {
  Company,
  CompanyFilters,
  CompanyId,
  CompanyListResult,
  CompanySearchQuery,
  CompanySort,
  CreateCompanyInput,
  UpdateCompanyInput,
  WorkspaceId
} from "./company.types";
import {
  filterCompanies,
  matchesCompanySearch,
  normalizeCreateCompanyInput,
  normalizeUpdateCompanyInput,
  sortCompanies
} from "./company.utils";
import { validateCreateCompanyInput, validateUpdateCompanyInput } from "./company.validation";

export type CompanyServiceOptions = Readonly<{
  seed?: readonly Company[];
  now?: () => string;
  createId?: () => CompanyId;
}>;

export class CompanyService {
  private readonly companies = new Map<CompanyId, Company>();
  private readonly now: () => string;
  private readonly createId: () => CompanyId;

  constructor(options: CompanyServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as CompanyId);

    for (const company of options.seed ?? []) {
      this.companies.set(company.id, freezeCompany(company));
    }
  }

  replaceCompanies(companies: readonly Company[]) {
    this.companies.clear();
    for (const company of companies) {
      this.companies.set(company.id, freezeCompany(company));
    }
  }

  upsertCompany(company: Company) {
    const frozen = freezeCompany(company);
    this.companies.set(frozen.id, frozen);
    return frozen;
  }

  listCompanies(filters: CompanyFilters, sort: CompanySort = DEFAULT_COMPANY_SORT): CompanyListResult {
    if (filters.permission && !filters.permission.allowed) {
      return createListResult([], 0, filters.workspaceId);
    }

    const workspaceCompanies = [...this.companies.values()].filter((company) => company.workspaceId === filters.workspaceId);
    const filtered = filterCompanies(workspaceCompanies, filters);

    return createListResult(sortCompanies(filtered, sort), workspaceCompanies.length, filters.workspaceId);
  }

  getCompany(id: CompanyId, workspaceId: WorkspaceId, permission = undefined as CompanyFilters["permission"]) {
    if (permission && !permission.allowed) return undefined;

    const company = this.companies.get(id);
    return company?.workspaceId === workspaceId ? company : undefined;
  }

  createCompany(input: CreateCompanyInput) {
    const validation = validateCreateCompanyInput(input);
    if (!validation.valid) {
      return Object.freeze({ company: undefined, validation });
    }

    const normalized = normalizeCreateCompanyInput(input);
    const timestamp = this.now();
    const company = freezeCompany({
      id: this.createId(),
      workspaceId: normalized.workspaceId,
      legalName: normalized.legalName,
      displayName: normalized.displayName,
      registrationNumber: normalized.registrationNumber,
      taxNumber: normalized.taxNumber,
      industry: normalized.industry ?? DEFAULT_COMPANY_INDUSTRY,
      website: normalized.website,
      email: normalized.email,
      phone: normalized.phone,
      address: normalized.address,
      city: normalized.city,
      country: normalized.country,
      status: normalized.status ?? DEFAULT_COMPANY_STATUS,
      tags: normalized.tags,
      notes: normalized.notes,
      ownerId: normalized.ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: normalized.createdBy
    });

    this.companies.set(company.id, company);
    return Object.freeze({ company, validation });
  }

  updateCompany(input: UpdateCompanyInput) {
    const validation = validateUpdateCompanyInput(input);
    if (!validation.valid) {
      return Object.freeze({ company: undefined, validation });
    }

    const existing = this.getCompany(input.id, input.workspaceId, input.permission);
    if (!existing) {
      return Object.freeze({ company: undefined, validation });
    }

    const normalized = normalizeUpdateCompanyInput(input);
    const company = freezeCompany({
      ...existing,
      legalName: normalized.legalName ?? existing.legalName,
      displayName: normalized.displayName ?? existing.displayName,
      registrationNumber: normalized.registrationNumber ?? existing.registrationNumber,
      taxNumber: normalized.taxNumber ?? existing.taxNumber,
      industry: normalized.industry ?? existing.industry,
      website: normalized.website ?? existing.website,
      email: normalized.email ?? existing.email,
      phone: normalized.phone ?? existing.phone,
      address: normalized.address ?? existing.address,
      city: normalized.city ?? existing.city,
      country: normalized.country ?? existing.country,
      status: normalized.status ?? existing.status,
      tags: normalized.tags ?? existing.tags,
      notes: normalized.notes ?? existing.notes,
      ownerId: normalized.ownerId ?? existing.ownerId,
      updatedAt: this.now(),
      updatedBy: normalized.updatedBy
    });

    this.companies.set(company.id, company);
    return Object.freeze({ company, validation });
  }

  archiveCompany(id: CompanyId, workspaceId: WorkspaceId, updatedBy: UpdateCompanyInput["updatedBy"], permission?: UpdateCompanyInput["permission"]) {
    return this.updateCompany({ id, workspaceId, status: "archived", updatedBy, permission });
  }

  searchCompanies(search: CompanySearchQuery, sort: CompanySort = DEFAULT_COMPANY_SORT): CompanyListResult {
    if (search.permission && !search.permission.allowed) {
      return createListResult([], 0, search.workspaceId);
    }

    const workspaceCompanies = [...this.companies.values()].filter((company) => company.workspaceId === search.workspaceId);
    const filtered = workspaceCompanies.filter((company) => matchesCompanySearch(company, search));

    return createListResult(sortCompanies(filtered, sort), workspaceCompanies.length, search.workspaceId);
  }
}

export function freezeCompany(company: Company): Company {
  return Object.freeze({
    ...company,
    tags: Object.freeze([...company.tags])
  });
}

function createListResult(companies: readonly Company[], total: number, workspaceId: WorkspaceId): CompanyListResult {
  return Object.freeze({
    companies: Object.freeze([...companies]),
    total,
    filtered: companies.length,
    workspaceId
  });
}

export const companyService = new CompanyService();
