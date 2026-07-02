import { normalizeCrmString, normalizeCrmTokens } from "../shared";
import { DEFAULT_OPPORTUNITY_PRIORITY, DEFAULT_OPPORTUNITY_PROBABILITY, DEFAULT_OPPORTUNITY_STAGE, DEFAULT_OPPORTUNITY_STATUS } from "./opportunity.constants";
import type {
  CreateOpportunityInput,
  Opportunity,
  OpportunityActivityPreparation,
  OpportunityFilters,
  OpportunitySearchQuery,
  OpportunitySort,
  OpportunityValue,
  UpdateOpportunityInput
} from "./opportunity.types";

export function normalizeCreateOpportunityInput(input: CreateOpportunityInput) {
  return Object.freeze({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    primaryContactId: input.primaryContactId,
    title: normalizeText(input.title),
    description: normalizeOptionalText(input.description),
    stage: input.stage ?? DEFAULT_OPPORTUNITY_STAGE,
    probability: input.probability ?? DEFAULT_OPPORTUNITY_PROBABILITY,
    estimatedValue: normalizeOpportunityValue(input.estimatedValue),
    expectedCloseDate: input.expectedCloseDate,
    ownerId: input.ownerId,
    status: input.status ?? DEFAULT_OPPORTUNITY_STATUS,
    priority: input.priority ?? DEFAULT_OPPORTUNITY_PRIORITY,
    tags: Object.freeze(normalizeTags(input.tags))
  });
}

export function normalizeUpdateOpportunityInput(input: UpdateOpportunityInput) {
  return Object.freeze({
    companyId: input.companyId,
    primaryContactId: input.primaryContactId,
    title: input.title === undefined ? undefined : normalizeText(input.title),
    description: input.description === undefined ? undefined : normalizeOptionalText(input.description),
    stage: input.stage,
    probability: input.probability,
    estimatedValue: input.estimatedValue === undefined ? undefined : normalizeOpportunityValue(input.estimatedValue),
    expectedCloseDate: input.expectedCloseDate,
    ownerId: input.ownerId,
    status: input.status,
    priority: input.priority,
    tags: input.tags === undefined ? undefined : Object.freeze(normalizeTags(input.tags)),
    archivedAt: input.archivedAt
  });
}

export function filterOpportunities(opportunities: readonly Opportunity[], filters: OpportunityFilters) {
  return opportunities.filter((opportunity) => {
    if (opportunity.workspaceId !== filters.workspaceId) return false;
    if (!filters.includeArchived && opportunity.status === "archived") return false;
    if (filters.companyId && opportunity.companyId !== filters.companyId) return false;
    if (filters.contactId && opportunity.primaryContactId !== filters.contactId) return false;
    if (filters.stage && opportunity.stage !== filters.stage) return false;
    if (filters.status && opportunity.status !== filters.status) return false;
    if (filters.priority && opportunity.priority !== filters.priority) return false;
    if (filters.ownerId && opportunity.ownerId !== filters.ownerId) return false;
    if (filters.minValue !== undefined && opportunity.estimatedValue.amount < filters.minValue) return false;
    if (filters.maxValue !== undefined && opportunity.estimatedValue.amount > filters.maxValue) return false;
    if (filters.closeFrom && (!opportunity.expectedCloseDate || opportunity.expectedCloseDate < filters.closeFrom)) return false;
    if (filters.closeTo && (!opportunity.expectedCloseDate || opportunity.expectedCloseDate > filters.closeTo)) return false;
    if (filters.tags?.length && !filters.tags.every((tag) => opportunity.tags.includes(tag))) return false;
    return true;
  });
}

export function matchesOpportunitySearch(opportunity: Opportunity, search: OpportunitySearchQuery) {
  if (opportunity.workspaceId !== search.workspaceId) return false;
  if (!search.includeArchived && opportunity.status === "archived") return false;
  if (search.companyId && opportunity.companyId !== search.companyId) return false;
  if (search.contactId && opportunity.primaryContactId !== search.contactId) return false;

  const tokens = normalizeCrmTokens(search.query);
  if (!tokens.length) return true;

  const searchable = normalizeCrmString([
    opportunity.title,
    opportunity.description,
    opportunity.stage,
    opportunity.status,
    opportunity.priority,
    opportunity.estimatedValue.currency,
    ...opportunity.tags
  ].join(" "));

  return tokens.every((token) => searchable.includes(token));
}

export function sortOpportunities(opportunities: readonly Opportunity[], sort: OpportunitySort) {
  return [...opportunities].sort((left, right) => {
    const modifier = sort.direction === "asc" ? 1 : -1;
    const value = compareOpportunityField(left, right, sort.field);
    if (value !== 0) return value * modifier;
    return left.id.localeCompare(right.id);
  });
}

export function isOpenOpportunity(opportunity: Opportunity) {
  return opportunity.status === "open" && !["won", "lost"].includes(opportunity.stage);
}

export function opportunityDisplayLabel(opportunity: Opportunity) {
  return opportunity.title;
}

export function formatOpportunityValue(value: OpportunityValue) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: value.currency
  }).format(value.amount);
}

export function prepareOpportunityActivityInput(opportunity: Opportunity, action: "created" | "updated" | "archived"): OpportunityActivityPreparation["activityInput"] {
  return {
    workspaceId: opportunity.workspaceId,
    companyId: opportunity.companyId,
    contactId: opportunity.primaryContactId,
    type: "system",
    title: activityTitle(action),
    description: opportunity.title,
    performedBy: opportunity.ownerId,
    performedAt: new Date().toISOString(),
    status: "completed",
    priority: opportunity.priority === "urgent" ? "high" : "normal",
    tags: ["opportunity", action],
    metadata: { opportunityId: opportunity.id, stage: opportunity.stage, value: opportunity.estimatedValue.amount }
  };
}

function compareOpportunityField(left: Opportunity, right: Opportunity, field: OpportunitySort["field"]) {
  if (field === "estimatedValue") return left.estimatedValue.amount - right.estimatedValue.amount;
  const leftValue = valueForSort(left, field);
  const rightValue = valueForSort(right, field);
  return leftValue.localeCompare(rightValue);
}

function valueForSort(opportunity: Opportunity, field: Exclude<OpportunitySort["field"], "estimatedValue">) {
  if (field === "expectedCloseDate") return opportunity.expectedCloseDate ?? "";
  return String(opportunity[field] ?? "");
}

function normalizeOpportunityValue(value: OpportunityValue): OpportunityValue {
  return Object.freeze({
    amount: Number(value.amount),
    currency: value.currency
  });
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized || undefined;
}

function normalizeTags(tags: readonly string[] = []) {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function activityTitle(action: "created" | "updated" | "archived") {
  const labels = {
    created: "Opportunité créée",
    updated: "Opportunité mise à jour",
    archived: "Opportunité archivée"
  };
  return labels[action];
}
