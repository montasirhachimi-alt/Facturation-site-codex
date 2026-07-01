import type { PermissionDecision } from "@/runtime/permissions";

export type CompanyId = string & { readonly __brand: "CompanyId" };
export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type UserId = string & { readonly __brand: "UserId" };

export type CompanyStatus = "lead" | "active" | "inactive" | "archived";
export type CompanyIndustry =
  | "education"
  | "healthcare"
  | "technology"
  | "finance"
  | "retail"
  | "manufacturing"
  | "services"
  | "government"
  | "other"
  | "unknown";

export type Company = Readonly<{
  id: CompanyId;
  workspaceId: WorkspaceId;
  legalName: string;
  displayName: string;
  registrationNumber?: string;
  taxNumber?: string;
  industry: CompanyIndustry;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status: CompanyStatus;
  tags: readonly string[];
  notes?: string;
  ownerId?: UserId;
  createdAt: string;
  updatedAt: string;
  createdBy: UserId;
  updatedBy?: UserId;
}>;

export type CompanyPermissionContext = Readonly<{
  read?: PermissionDecision;
  write?: PermissionDecision;
}>;

export type CreateCompanyInput = Readonly<{
  workspaceId: WorkspaceId;
  legalName: string;
  displayName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  industry?: CompanyIndustry;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: CompanyStatus;
  tags?: readonly string[];
  notes?: string;
  ownerId?: UserId;
  createdBy: UserId;
  permission?: PermissionDecision;
}>;

export type UpdateCompanyInput = Readonly<{
  id: CompanyId;
  workspaceId: WorkspaceId;
  legalName?: string;
  displayName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  industry?: CompanyIndustry;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: CompanyStatus;
  tags?: readonly string[];
  notes?: string;
  ownerId?: UserId;
  updatedBy: UserId;
  permission?: PermissionDecision;
}>;

export type CompanyFilters = Readonly<{
  workspaceId: WorkspaceId;
  status?: CompanyStatus;
  industry?: CompanyIndustry;
  city?: string;
  country?: string;
  tags?: readonly string[];
  ownerId?: UserId;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type CompanySearchQuery = Readonly<{
  workspaceId: WorkspaceId;
  query: string;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type CompanySortField =
  | "legalName"
  | "displayName"
  | "industry"
  | "city"
  | "country"
  | "status"
  | "createdAt"
  | "updatedAt";

export type CompanySortDirection = "asc" | "desc";

export type CompanySort = Readonly<{
  field: CompanySortField;
  direction: CompanySortDirection;
}>;

export type CompanyListResult = Readonly<{
  companies: readonly Company[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
}>;

