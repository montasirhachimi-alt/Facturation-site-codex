import type { PermissionDecision } from "@/runtime/permissions";
import type { CompanyId } from "../companies/company.types";

export type CustomerId = string & { readonly __brand: "CustomerId" };
export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type UserId = string & { readonly __brand: "UserId" };

export type CustomerStatus = "lead" | "active" | "inactive" | "archived";
export type CustomerType = "individual" | "company";
export type CustomerSource = "manual" | "import" | "website" | "referral" | "campaign" | "unknown";

export type Customer = Readonly<{
  id: CustomerId;
  workspaceId: WorkspaceId;
  displayName: string;
  companyId?: CompanyId;
  companyName?: string;
  email?: string;
  phone?: string;
  status: CustomerStatus;
  type: CustomerType;
  source: CustomerSource;
  tags: readonly string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: UserId;
  updatedBy?: UserId;
}>;

export type CustomerPermissionContext = Readonly<{
  read?: PermissionDecision;
  write?: PermissionDecision;
}>;

export type CreateCustomerInput = Readonly<{
  workspaceId: WorkspaceId;
  displayName: string;
  companyId?: CompanyId;
  companyName?: string;
  email?: string;
  phone?: string;
  status?: CustomerStatus;
  type?: CustomerType;
  source?: CustomerSource;
  tags?: readonly string[];
  notes?: string;
  createdBy: UserId;
  permission?: PermissionDecision;
}>;

export type UpdateCustomerInput = Readonly<{
  id: CustomerId;
  workspaceId: WorkspaceId;
  displayName?: string;
  companyId?: CompanyId;
  companyName?: string;
  email?: string;
  phone?: string;
  status?: CustomerStatus;
  type?: CustomerType;
  source?: CustomerSource;
  tags?: readonly string[];
  notes?: string;
  updatedBy: UserId;
  permission?: PermissionDecision;
}>;

export type CustomerFilters = Readonly<{
  workspaceId: WorkspaceId;
  status?: CustomerStatus;
  type?: CustomerType;
  source?: CustomerSource;
  tags?: readonly string[];
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type CustomerSearchQuery = Readonly<{
  workspaceId: WorkspaceId;
  query: string;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type CustomerSortField = "displayName" | "companyName" | "status" | "type" | "source" | "createdAt" | "updatedAt";
export type CustomerSortDirection = "asc" | "desc";

export type CustomerSort = Readonly<{
  field: CustomerSortField;
  direction: CustomerSortDirection;
}>;

export type CustomerListResult = Readonly<{
  customers: readonly Customer[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
}>;
