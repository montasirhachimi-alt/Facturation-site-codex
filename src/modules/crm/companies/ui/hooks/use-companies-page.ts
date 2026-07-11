"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { persistCrmSalesRecord } from "@/platform/persistence";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import { filterCrmEntities, paginateCrmItems, searchCrmEntities, sortCrmEntities } from "@/modules/crm/shared";
import type { Company, CompanyId, CompanyIndustry, CompanyStatus, CreateCompanyInput, UpdateCompanyInput } from "../../company.types";
import { crmCompanyLocalService, notifyCrmCompanyStoreUpdated, subscribeToCrmCompanyStore } from "../company-local-store";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "../companies.seed";

export type CompanySortKey = "displayName" | "industry" | "country" | "email" | "phone" | "status" | "updatedAt";

export type CompanyFormState = Readonly<{
  legalName: string;
  displayName: string;
  industry: CompanyIndustry;
  website: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: CompanyStatus;
  tags: string;
  notes: string;
}>;

const emptyForm: CompanyFormState = {
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

const permissionService = new PermissionService(
  new PermissionEnforcement({
    supportedModules: ["crm.company"],
    rolePermissions: {
      COMPANY_ADMIN: { "crm.company": ["read", "write"] },
      SUPER_ADMIN: { "crm.company": ["read", "write"] },
      SALES: { "crm.company": ["read", "write"] },
      READ_ONLY: { "crm.company": ["read"] }
    }
  })
);

export function useCompaniesPage() {
  const [service] = useState(() => crmCompanyLocalService);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<CompanyIndustry | "all">("all");
  const [status, setStatus] = useState<CompanyStatus | "all">("all");
  const [country, setCountry] = useState("all");
  const [owner, setOwner] = useState("all");
  const [tag, setTag] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sort, setSort] = useState<Readonly<{ field: CompanySortKey; direction: "asc" | "desc" }>>({
    field: "updatedAt",
    direction: "desc"
  });
  const [selectedIds, setSelectedIds] = useState<readonly CompanyId[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const readDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.company", action: "read" },
        { id: "crm.companies", type: "page", module: "crm.company", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_COMPANIES_WORKSPACE_ID, userId: CRM_COMPANIES_USER_ID }
      ),
    []
  );

  const writeDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.company", action: "write" },
        { id: "crm.companies.write", type: "service", module: "crm.company", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_COMPANIES_WORKSPACE_ID, userId: CRM_COMPANIES_USER_ID }
      ),
    []
  );

  const baseCompanies = useMemo(() => {
    void version;
    return service.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false, permission: readDecision }).companies;
  }, [readDecision, service, version]);

  useEffect(() => subscribeToCrmCompanyStore(() => setVersion((value) => value + 1)), []);

  const countryOptions = useMemo(() => ["all", ...Array.from(new Set(baseCompanies.map((company) => company.country ?? "Maroc"))).sort()], [baseCompanies]);
  const ownerOptions = useMemo(() => ["all", ...Array.from(new Set(baseCompanies.map((company) => company.ownerId ?? "system"))).sort()], [baseCompanies]);
  const tagOptions = useMemo(() => ["all", ...Array.from(new Set(baseCompanies.flatMap((company) => company.tags))).sort()], [baseCompanies]);

  const filteredCompanies = useMemo(() => {
    const filtered = filterCrmEntities(baseCompanies, {
      workspaceId: CRM_COMPANIES_WORKSPACE_ID,
      status: status === "all" ? undefined : status,
      tags: tag === "all" ? undefined : [tag],
      ownerId: owner === "all" ? undefined : owner,
      archived: false
    }).filter((company) => {
      if (industry !== "all" && company.industry !== industry) return false;
      if (country !== "all" && company.country !== country) return false;
      return true;
    });

    if (!query.trim()) return filtered;

    return searchCrmEntities(filtered, {
      query,
      fields: ["legalName", "displayName", "industry", "country", "email", "phone", "status"]
    }).map((match) => match.entity);
  }, [baseCompanies, country, industry, owner, query, status, tag]);

  const sortedCompanies = useMemo(() => sortCrmEntities(filteredCompanies, [{ field: sort.field, direction: sort.direction }]), [filteredCompanies, sort]);
  const paginatedCompanies = useMemo(() => paginateCrmItems(sortedCompanies, { page, pageSize }), [page, pageSize, sortedCompanies]);

  const stats = useMemo(() => {
    const industries = new Set(baseCompanies.map((company) => company.industry)).size;
    const countries = new Set(baseCompanies.map((company) => company.country ?? "Maroc")).size;

    return {
      total: baseCompanies.length,
      active: baseCompanies.filter((company) => company.status === "active").length,
      industries,
      countries,
      futureRevenue: "0 MAD"
    };
  }, [baseCompanies]);

  const resetPage = useCallback(() => setPage(1), []);

  const updateSort = useCallback((field: CompanySortKey) => {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
  }, []);

  const toggleRow = useCallback((id: CompanyId) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }, []);

  const toggleAllVisible = useCallback(() => {
    const visibleIds = paginatedCompanies.items.map((company) => company.id);
    setSelectedIds((current) => {
      const allSelected = visibleIds.every((id) => current.includes(id));
      return allSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds]));
    });
  }, [paginatedCompanies.items]);

  const openCreateDialog = useCallback(() => {
    setError(null);
    setEditingCompany(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((company: Company) => {
    setError(null);
    setEditingCompany(company);
    setForm(companyToForm(company));
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingCompany(null);
    setError(null);
  }, []);

  const createCompany = useCallback(async () => {
    const snapshot = service.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: true }).companies;
    const input: CreateCompanyInput = {
      workspaceId: CRM_COMPANIES_WORKSPACE_ID,
      legalName: form.legalName,
      displayName: form.displayName,
      industry: form.industry,
      website: form.website,
      email: form.email,
      phone: form.phone,
      city: form.city,
      country: form.country,
      status: form.status,
      tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
      notes: form.notes,
      ownerId: CRM_COMPANIES_USER_ID,
      createdBy: CRM_COMPANIES_USER_ID,
      permission: writeDecision
    };
    const result = service.createCompany(input);

    if (!result.validation.valid || !result.company) {
      setError(result.validation.issues[0]?.message ?? "Impossible de créer la société.");
      return false;
    }

    try {
      await persistCrmSalesRecord("company", result.company);
    } catch {
      service.replaceCompanies(snapshot);
      setError("La société n'a pas pu être enregistrée dans la base. Vérifiez la connexion puis réessayez.");
      return false;
    }

    setDialogOpen(false);
    setVersion((value) => value + 1);
    notifyCrmCompanyStoreUpdated();
    setPage(1);
    return true;
  }, [form, service, writeDecision]);

  const saveCompany = useCallback(async () => {
    if (!editingCompany) return createCompany();
    const snapshot = service.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: true }).companies;

    const input: UpdateCompanyInput = {
      id: editingCompany.id,
      workspaceId: CRM_COMPANIES_WORKSPACE_ID,
      legalName: form.legalName,
      displayName: form.displayName,
      industry: form.industry,
      website: form.website,
      email: form.email,
      phone: form.phone,
      city: form.city,
      country: form.country,
      status: form.status,
      tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
      notes: form.notes,
      ownerId: editingCompany.ownerId,
      updatedBy: CRM_COMPANIES_USER_ID,
      permission: writeDecision
    };
    const result = service.updateCompany(input);

    if (!result.validation.valid || !result.company) {
      setError(result.validation.issues[0]?.message ?? "Impossible de modifier la société.");
      return false;
    }

    try {
      await persistCrmSalesRecord("company", result.company);
    } catch {
      service.replaceCompanies(snapshot);
      setError("Les modifications n'ont pas pu être enregistrées dans la base. Vérifiez la connexion puis réessayez.");
      return false;
    }

    setDialogOpen(false);
    setEditingCompany(null);
    setVersion((value) => value + 1);
    notifyCrmCompanyStoreUpdated();
    return true;
  }, [createCompany, editingCompany, form, service, writeDecision]);

  const archiveCompany = useCallback(
    async (company: Company) => {
      if (!writeDecision.allowed) return;
      const snapshot = service.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: true }).companies;
      const result = service.archiveCompany(company.id, CRM_COMPANIES_WORKSPACE_ID, CRM_COMPANIES_USER_ID, writeDecision);
      if (result.company) {
        try {
          await persistCrmSalesRecord("company", result.company);
        } catch {
          service.replaceCompanies(snapshot);
          setError("La société n'a pas pu être archivée dans la base. Vérifiez la connexion puis réessayez.");
          setVersion((value) => value + 1);
          notifyCrmCompanyStoreUpdated();
          return;
        }
      }
      setSelectedIds((current) => current.filter((id) => id !== company.id));
      setVersion((value) => value + 1);
      notifyCrmCompanyStoreUpdated();
    },
    [service, writeDecision]
  );

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  return {
    archiveCompany,
    closeDialog,
    country,
    countryOptions,
    createCompany,
    dialogOpen,
    editingCompany,
    error,
    form,
    industry,
    openCreateDialog,
    openEditDialog,
    owner,
    ownerOptions,
    page,
    pageSize,
    paginatedCompanies,
    query,
    readDecision,
    refresh,
    resetPage,
    saveCompany,
    selectedIds,
    setCountry,
    setForm,
    setIndustry,
    setOwner,
    setPage,
    setPageSize,
    setQuery,
    setStatus,
    setTag,
    sort,
    stats,
    status,
    tag,
    tagOptions,
    toggleAllVisible,
    toggleRow,
    totalFiltered: sortedCompanies.length,
    updateSort,
    writeDecision
  };
}

function companyToForm(company: Company): CompanyFormState {
  return {
    legalName: company.legalName,
    displayName: company.displayName,
    industry: company.industry,
    website: company.website ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    city: company.city ?? "",
    country: company.country ?? "Maroc",
    status: company.status,
    tags: company.tags.join(", "),
    notes: company.notes ?? ""
  };
}
