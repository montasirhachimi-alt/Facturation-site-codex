import type { PermissionDecision } from "@/runtime/permissions";
import type { CompanyId, UserId, WorkspaceId } from "../companies/company.types";

export type ContactId = string & { readonly __brand: "ContactId" };

export type ContactStatus = "active" | "inactive" | "archived";
export type ContactRole = "primary" | "decision_maker" | "influencer" | "technical" | "finance" | "operations" | "other";

export type Contact = Readonly<{
  id: ContactId;
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle?: string;
  department?: string;
  email?: string;
  mobilePhone?: string;
  officePhone?: string;
  preferredLanguage?: string;
  timezone?: string;
  status: ContactStatus;
  role?: ContactRole;
  isPrimaryContact: boolean;
  isDecisionMaker: boolean;
  linkedin?: string;
  notes?: string;
  tags: readonly string[];
  ownerId?: UserId;
  createdAt: string;
  updatedAt: string;
  createdBy: UserId;
  updatedBy?: UserId;
}>;

export type ContactPermissionContext = Readonly<{
  read?: PermissionDecision;
  write?: PermissionDecision;
}>;

export type CreateContactInput = Readonly<{
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  email?: string;
  mobilePhone?: string;
  officePhone?: string;
  preferredLanguage?: string;
  timezone?: string;
  status?: ContactStatus;
  role?: ContactRole;
  isPrimaryContact?: boolean;
  isDecisionMaker?: boolean;
  linkedin?: string;
  notes?: string;
  tags?: readonly string[];
  ownerId?: UserId;
  createdBy: UserId;
  permission?: PermissionDecision;
}>;

export type UpdateContactInput = Readonly<{
  id: ContactId;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  email?: string;
  mobilePhone?: string;
  officePhone?: string;
  preferredLanguage?: string;
  timezone?: string;
  status?: ContactStatus;
  role?: ContactRole;
  isPrimaryContact?: boolean;
  isDecisionMaker?: boolean;
  linkedin?: string;
  notes?: string;
  tags?: readonly string[];
  ownerId?: UserId;
  updatedBy: UserId;
  permission?: PermissionDecision;
}>;

export type ContactFilters = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  status?: ContactStatus;
  role?: ContactRole;
  department?: string;
  tags?: readonly string[];
  ownerId?: UserId;
  isPrimaryContact?: boolean;
  isDecisionMaker?: boolean;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type ContactSearchQuery = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  query: string;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type ContactSortField =
  | "firstName"
  | "lastName"
  | "fullName"
  | "jobTitle"
  | "department"
  | "email"
  | "status"
  | "createdAt"
  | "updatedAt";

export type ContactSortDirection = "asc" | "desc";

export type ContactSort = Readonly<{
  field: ContactSortField;
  direction: ContactSortDirection;
}>;

export type ContactListResult = Readonly<{
  contacts: readonly Contact[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
}>;
