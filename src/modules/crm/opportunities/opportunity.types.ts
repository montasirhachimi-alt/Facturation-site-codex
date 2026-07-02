import type { PermissionDecision } from "@/runtime/permissions";
import type { Activity, CreateActivityInput } from "@/modules/crm/activities";
import type { CompanyId, UserId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";

export type OpportunityId = string & { readonly __brand: "OpportunityId" };

export type OpportunityStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type OpportunityStatus = "open" | "won" | "lost" | "archived";
export type OpportunityPriority = "low" | "medium" | "high" | "urgent";
export type OpportunityCurrency = "MAD" | "EUR" | "USD";

export type OpportunityValue = Readonly<{
  amount: number;
  currency: OpportunityCurrency;
}>;

export type Opportunity = Readonly<{
  id: OpportunityId;
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  primaryContactId: ContactId;
  title: string;
  description?: string;
  stage: OpportunityStage;
  probability: number;
  estimatedValue: OpportunityValue;
  expectedCloseDate?: string;
  ownerId: UserId;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}>;

export type CreateOpportunityInput = Readonly<{
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  primaryContactId: ContactId;
  title: string;
  description?: string;
  stage?: OpportunityStage;
  probability?: number;
  estimatedValue: OpportunityValue;
  expectedCloseDate?: string;
  ownerId: UserId;
  status?: OpportunityStatus;
  priority?: OpportunityPriority;
  tags?: readonly string[];
  permission?: PermissionDecision;
}>;

export type UpdateOpportunityInput = Readonly<{
  id: OpportunityId;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  primaryContactId?: ContactId;
  title?: string;
  description?: string;
  stage?: OpportunityStage;
  probability?: number;
  estimatedValue?: OpportunityValue;
  expectedCloseDate?: string;
  ownerId?: UserId;
  status?: OpportunityStatus;
  priority?: OpportunityPriority;
  tags?: readonly string[];
  archivedAt?: string;
  permission?: PermissionDecision;
}>;

export type OpportunityFilters = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  stage?: OpportunityStage;
  status?: OpportunityStatus;
  priority?: OpportunityPriority;
  ownerId?: UserId;
  tags?: readonly string[];
  minValue?: number;
  maxValue?: number;
  closeFrom?: string;
  closeTo?: string;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type OpportunitySearchQuery = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  query: string;
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type OpportunitySortField = "expectedCloseDate" | "estimatedValue" | "updatedAt" | "title" | "stage" | "probability" | "priority";
export type OpportunitySortDirection = "asc" | "desc";

export type OpportunitySort = Readonly<{
  field: OpportunitySortField;
  direction: OpportunitySortDirection;
}>;

export type OpportunityListResult = Readonly<{
  opportunities: readonly Opportunity[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
}>;

export type OpportunityActivityPreparation = Readonly<{
  opportunity: Opportunity;
  activityInput: CreateActivityInput;
  activity?: Activity;
}>;
