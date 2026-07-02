import { DEFAULT_ACTIVITY_PRIORITY, DEFAULT_ACTIVITY_SORT, DEFAULT_ACTIVITY_STATUS } from "./activity.constants";
import type { Activity, ActivityFilters, ActivitySearchQuery, ActivitySort, CreateActivityInput, UpdateActivityInput } from "./activity.types";
import { filterCrmEntities, normalizeCrmTags, searchCrmEntities, sortCrmEntities } from "@/modules/crm/shared";

export function normalizeCreateActivityInput(input: CreateActivityInput, now: string) {
  return {
    ...input,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    performedAt: input.performedAt ?? now,
    status: input.status ?? DEFAULT_ACTIVITY_STATUS,
    priority: input.priority ?? DEFAULT_ACTIVITY_PRIORITY,
    tags: normalizeCrmTags(input.tags),
    metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined
  };
}

export function normalizeUpdateActivityInput(input: UpdateActivityInput) {
  return {
    ...input,
    title: input.title?.trim(),
    description: input.description?.trim() || undefined,
    tags: input.tags ? normalizeCrmTags(input.tags) : undefined,
    metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined
  };
}

export function filterActivities(activities: readonly Activity[], filters: ActivityFilters) {
  return filterCrmEntities(activities, {
    workspaceId: filters.workspaceId,
    status: filters.status,
    tags: filters.tags,
    archived: filters.includeArchived ? undefined : false
  }).filter((activity) => {
    if (!filters.includeArchived && isActivityArchived(activity)) return false;
    if (filters.companyId && activity.companyId !== filters.companyId) return false;
    if (filters.contactId && activity.contactId !== filters.contactId) return false;
    if (filters.type && activity.type !== filters.type) return false;
    if (filters.priority && activity.priority !== filters.priority) return false;
    if (filters.performedBy && activity.performedBy !== filters.performedBy) return false;
    if (filters.dateFrom && activity.performedAt < filters.dateFrom) return false;
    if (filters.dateTo && activity.performedAt > filters.dateTo) return false;
    return true;
  });
}

export function matchesActivitySearch(activity: Activity, search: ActivitySearchQuery) {
  if (activity.workspaceId !== search.workspaceId) return false;
  if (search.companyId && activity.companyId !== search.companyId) return false;
  if (search.contactId && activity.contactId !== search.contactId) return false;
  if (!search.includeArchived && isActivityArchived(activity)) return false;
  if (!search.query.trim()) return true;

  return searchCrmEntities([activity], {
    query: search.query,
    fields: ["type", "title", "description", "performedBy", "status", "priority"]
  }).length > 0;
}

export function sortActivities(activities: readonly Activity[], sort: ActivitySort = DEFAULT_ACTIVITY_SORT) {
  return sortCrmEntities(activities, [sort]);
}

export function isActivityOpen(activity: Activity) {
  return activity.status === "open";
}

export function isActivityCompleted(activity: Activity) {
  return activity.status === "completed";
}

export function isActivityArchived(activity: Activity) {
  return activity.status === "archived";
}
