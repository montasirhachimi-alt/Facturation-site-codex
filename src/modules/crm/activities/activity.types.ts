import type { PermissionDecision } from "@/runtime/permissions";
import type { CompanyId, UserId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";

export type ActivityId = string & { readonly __brand: "ActivityId" };

export type ActivityType =
  | "call"
  | "meeting"
  | "email"
  | "task"
  | "note"
  | "comment"
  | "status_change"
  | "document"
  | "system"
  | "custom";

export type ActivityStatus = "open" | "completed" | "archived";
export type ActivityPriority = "low" | "normal" | "high" | "critical";

export type Activity = Readonly<{
  id: ActivityId;
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  contactId?: ContactId;
  type: ActivityType;
  title: string;
  description?: string;
  performedBy: UserId;
  performedAt: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  tags: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateActivityInput = Readonly<{
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  contactId?: ContactId;
  type: ActivityType;
  title: string;
  description?: string;
  performedBy: UserId;
  performedAt?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
  permission?: PermissionDecision;
}>;

export type UpdateActivityInput = Readonly<{
  id: ActivityId;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  type?: ActivityType;
  title?: string;
  description?: string;
  performedBy?: UserId;
  performedAt?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
  permission?: PermissionDecision;
}>;

export type ActivityFilters = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  type?: ActivityType;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  performedBy?: UserId;
  dateFrom?: string;
  dateTo?: string;
  tags?: readonly string[];
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type ActivitySearchQuery = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  query: string;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type ActivitySortField = "performedAt" | "updatedAt" | "title" | "type" | "status" | "priority";
export type ActivitySortDirection = "asc" | "desc";

export type ActivitySort = Readonly<{
  field: ActivitySortField;
  direction: ActivitySortDirection;
}>;

export type ActivityListResult = Readonly<{
  activities: readonly Activity[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
}>;
