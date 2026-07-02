"use client";

import { useMemo, useState } from "react";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import { CompanyService } from "../../../company.service";
import type { CompanyId } from "../../../company.types";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "../../companies.seed";

export type CompanyDetailsTab = "overview" | "contacts" | "opportunities" | "customers" | "sales" | "projects" | "invoices" | "activity" | "notes" | "settings";

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
  const [service] = useState(() => new CompanyService({ seed: crmCompanySeed }));

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

  const company = useMemo(
    () => service.getCompany(companyId as CompanyId, CRM_COMPANIES_WORKSPACE_ID, readDecision),
    [companyId, readDecision, service]
  );

  return {
    activeTab,
    canRead: readDecision.allowed,
    canWrite: writeDecision.allowed,
    company,
    readDecision,
    setActiveTab,
    writeDecision
  };
}
