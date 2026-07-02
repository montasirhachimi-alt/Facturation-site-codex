import { DEFAULT_OPPORTUNITY_SORT } from "./opportunity.constants";
import type {
  CreateOpportunityInput,
  Opportunity,
  OpportunityActivityPreparation,
  OpportunityFilters,
  OpportunityId,
  OpportunityListResult,
  OpportunitySearchQuery,
  OpportunitySort,
  UpdateOpportunityInput
} from "./opportunity.types";
import type { Activity } from "@/modules/crm/activities";
import type { CompanyId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";
import {
  filterOpportunities,
  matchesOpportunitySearch,
  normalizeCreateOpportunityInput,
  normalizeUpdateOpportunityInput,
  prepareOpportunityActivityInput,
  sortOpportunities
} from "./opportunity.utils";
import { validateCreateOpportunityInput, validateUpdateOpportunityInput } from "./opportunity.validation";

export type OpportunityServiceOptions = Readonly<{
  seed?: readonly Opportunity[];
  now?: () => string;
  createId?: () => OpportunityId;
  createActivity?: (input: ReturnType<typeof prepareOpportunityActivityInput>) => Activity | undefined;
}>;

export class OpportunityService {
  private readonly opportunities = new Map<OpportunityId, Opportunity>();
  private readonly now: () => string;
  private readonly createId: () => OpportunityId;
  private readonly createActivity?: OpportunityServiceOptions["createActivity"];

  constructor(options: OpportunityServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => `opp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as OpportunityId);
    this.createActivity = options.createActivity;

    for (const opportunity of options.seed ?? []) {
      this.opportunities.set(opportunity.id, freezeOpportunity(opportunity));
    }
  }

  listOpportunities(filters: OpportunityFilters, sort: OpportunitySort = DEFAULT_OPPORTUNITY_SORT): OpportunityListResult {
    if (filters.permission && !filters.permission.allowed) {
      return createListResult([], 0, filters.workspaceId, filters.companyId, filters.contactId);
    }

    const workspaceOpportunities = [...this.opportunities.values()].filter((opportunity) => opportunity.workspaceId === filters.workspaceId);
    const filtered = filterOpportunities(workspaceOpportunities, filters);

    return createListResult(sortOpportunities(filtered, sort), workspaceOpportunities.length, filters.workspaceId, filters.companyId, filters.contactId);
  }

  getOpportunity(id: OpportunityId, workspaceId: WorkspaceId, permission = undefined as OpportunityFilters["permission"]) {
    if (permission && !permission.allowed) return undefined;

    const opportunity = this.opportunities.get(id);
    return opportunity?.workspaceId === workspaceId ? opportunity : undefined;
  }

  listByCompany(companyId: CompanyId, workspaceId: WorkspaceId, permission = undefined as OpportunityFilters["permission"], sort: OpportunitySort = DEFAULT_OPPORTUNITY_SORT) {
    return this.listOpportunities({ workspaceId, companyId, permission }, sort);
  }

  listByContact(contactId: ContactId, workspaceId: WorkspaceId, permission = undefined as OpportunityFilters["permission"], sort: OpportunitySort = DEFAULT_OPPORTUNITY_SORT) {
    return this.listOpportunities({ workspaceId, contactId, permission }, sort);
  }

  createOpportunity(input: CreateOpportunityInput) {
    const validation = validateCreateOpportunityInput(input);
    if (!validation.valid) return Object.freeze({ opportunity: undefined, validation, activity: undefined, activityInput: undefined });

    const normalized = normalizeCreateOpportunityInput(input);
    const timestamp = this.now();
    const opportunity = freezeOpportunity({
      id: this.createId(),
      workspaceId: normalized.workspaceId,
      companyId: normalized.companyId,
      primaryContactId: normalized.primaryContactId,
      title: normalized.title,
      description: normalized.description,
      stage: normalized.stage,
      probability: normalized.probability,
      estimatedValue: normalized.estimatedValue,
      expectedCloseDate: normalized.expectedCloseDate,
      ownerId: normalized.ownerId,
      status: normalized.status,
      priority: normalized.priority,
      tags: normalized.tags,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    this.opportunities.set(opportunity.id, opportunity);
    const activityInput = prepareOpportunityActivityInput(opportunity, "created");
    const activity = this.createActivity?.(activityInput);

    return Object.freeze({ opportunity, validation, activity, activityInput } satisfies OpportunityActivityPreparation & { validation: typeof validation });
  }

  updateOpportunity(input: UpdateOpportunityInput) {
    const validation = validateUpdateOpportunityInput(input);
    if (!validation.valid) return Object.freeze({ opportunity: undefined, validation, activity: undefined, activityInput: undefined });

    const existing = this.getOpportunity(input.id, input.workspaceId, input.permission);
    if (!existing) return Object.freeze({ opportunity: undefined, validation, activity: undefined, activityInput: undefined });

    const normalized = normalizeUpdateOpportunityInput(input);
    const opportunity = freezeOpportunity({
      ...existing,
      companyId: normalized.companyId ?? existing.companyId,
      primaryContactId: normalized.primaryContactId ?? existing.primaryContactId,
      title: normalized.title ?? existing.title,
      description: normalized.description ?? existing.description,
      stage: normalized.stage ?? existing.stage,
      probability: normalized.probability ?? existing.probability,
      estimatedValue: normalized.estimatedValue ?? existing.estimatedValue,
      expectedCloseDate: normalized.expectedCloseDate ?? existing.expectedCloseDate,
      ownerId: normalized.ownerId ?? existing.ownerId,
      status: normalized.status ?? existing.status,
      priority: normalized.priority ?? existing.priority,
      tags: normalized.tags ?? existing.tags,
      archivedAt: normalized.archivedAt ?? existing.archivedAt,
      updatedAt: this.now()
    });

    this.opportunities.set(opportunity.id, opportunity);
    const activityInput = prepareOpportunityActivityInput(opportunity, opportunity.archivedAt ? "archived" : "updated");
    const activity = this.createActivity?.(activityInput);

    return Object.freeze({ opportunity, validation, activity, activityInput });
  }

  archiveOpportunity(id: OpportunityId, workspaceId: WorkspaceId, permission?: UpdateOpportunityInput["permission"]) {
    return this.updateOpportunity({ id, workspaceId, status: "archived", archivedAt: this.now(), permission });
  }

  searchOpportunities(search: OpportunitySearchQuery, sort: OpportunitySort = DEFAULT_OPPORTUNITY_SORT): OpportunityListResult {
    if (search.permission && !search.permission.allowed) {
      return createListResult([], 0, search.workspaceId, search.companyId, search.contactId);
    }

    const workspaceOpportunities = [...this.opportunities.values()].filter((opportunity) => opportunity.workspaceId === search.workspaceId);
    const filtered = workspaceOpportunities.filter((opportunity) => matchesOpportunitySearch(opportunity, search));

    return createListResult(sortOpportunities(filtered, sort), workspaceOpportunities.length, search.workspaceId, search.companyId, search.contactId);
  }
}

export function freezeOpportunity(opportunity: Opportunity): Opportunity {
  return Object.freeze({
    ...opportunity,
    estimatedValue: Object.freeze({ ...opportunity.estimatedValue }),
    tags: Object.freeze([...opportunity.tags])
  });
}

function createListResult(opportunities: readonly Opportunity[], total: number, workspaceId: WorkspaceId, companyId?: CompanyId, contactId?: ContactId): OpportunityListResult {
  return Object.freeze({
    opportunities: Object.freeze([...opportunities]),
    total,
    filtered: opportunities.length,
    workspaceId,
    companyId,
    contactId
  });
}

export const opportunityService = new OpportunityService();
