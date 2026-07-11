"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { persistCrmSalesRecord } from "@/platform/persistence";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import type { CompanyFormState } from "../../hooks/use-companies-page";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "../../company-local-store";
import type { Company, CompanyId, UpdateCompanyInput } from "../../../company.types";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "../../companies.seed";

export type CompanyDetailsTab = "overview" | "contacts" | "opportunities" | "customers" | "sales" | "quotes" | "projects" | "invoices" | "activity" | "notes" | "settings";

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

export function useCompanyDetails(companyId: string) {
  const [activeTab, setActiveTab] = useState<CompanyDetailsTab>("overview");
  const [version, setVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormState>(emptyCompanyForm);
  const [error, setError] = useState<string | null>(null);
  const [service] = useState(() => crmCompanyLocalService);

  const readDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.company", action: "read" },
        { id: "crm.company.details", type: "page", module: "crm.company", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_COMPANIES_WORKSPACE_ID, userId: CRM_COMPANIES_USER_ID }
      ),
    []
  );

  const writeDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.company", action: "write" },
        { id: "crm.company.details.write", type: "service", module: "crm.company", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_COMPANIES_WORKSPACE_ID, userId: CRM_COMPANIES_USER_ID }
      ),
    []
  );

  const company = useMemo(() => {
    void version;
    return service.getCompany(companyId as CompanyId, CRM_COMPANIES_WORKSPACE_ID, readDecision);
  }, [companyId, readDecision, service, version]);

  useEffect(() => subscribeToCrmCompanyStore(() => setVersion((value) => value + 1)), []);

  const openEditDialog = useCallback((companyToEdit: Company) => {
    setError(null);
    setEditingCompany(companyToEdit);
    setForm(companyToForm(companyToEdit));
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingCompany(null);
    setError(null);
  }, []);

  const saveCompany = useCallback(async () => {
    if (!editingCompany) return false;
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
    return true;
  }, [editingCompany, form, service, writeDecision]);

  return {
    activeTab,
    canRead: readDecision.allowed,
    canWrite: writeDecision.allowed,
    closeDialog,
    company,
    dialogOpen,
    editingCompany,
    error,
    form,
    openEditDialog,
    readDecision,
    saveCompany,
    setActiveTab,
    setForm,
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
