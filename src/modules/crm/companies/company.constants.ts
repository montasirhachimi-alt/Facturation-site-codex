import type { CompanyIndustry, CompanySort, CompanyStatus } from "./company.types";

export const COMPANY_STATUSES = Object.freeze(["lead", "active", "inactive", "archived"] satisfies CompanyStatus[]);

export const COMPANY_INDUSTRIES = Object.freeze([
  "education",
  "healthcare",
  "technology",
  "finance",
  "retail",
  "manufacturing",
  "services",
  "government",
  "other",
  "unknown"
] satisfies CompanyIndustry[]);

export const DEFAULT_COMPANY_STATUS: CompanyStatus = "lead";
export const DEFAULT_COMPANY_INDUSTRY: CompanyIndustry = "unknown";
export const DEFAULT_COMPANY_COUNTRY = "Maroc";
export const DEFAULT_COMPANY_SORT: CompanySort = Object.freeze({ field: "displayName", direction: "asc" });

export const CRM_COMPANY_READ_PERMISSION = Object.freeze({ module: "crm.company", action: "read" as const });
export const CRM_COMPANY_WRITE_PERMISSION = Object.freeze({ module: "crm.company", action: "write" as const });

