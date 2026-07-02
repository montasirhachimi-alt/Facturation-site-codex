import { DEFAULT_ACTIVITY_SORT } from "./activity.constants";
import type {
  Activity,
  ActivityFilters,
  ActivityId,
  ActivityListResult,
  ActivitySearchQuery,
  ActivitySort,
  CreateActivityInput,
  UpdateActivityInput
} from "./activity.types";
import type { CompanyId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";
import { filterActivities, matchesActivitySearch, normalizeCreateActivityInput, normalizeUpdateActivityInput, sortActivities } from "./activity.utils";
import { validateCreateActivityInput, validateUpdateActivityInput } from "./activity.validation";

export type ActivityServiceOptions = Readonly<{
  seed?: readonly Activity[];
  now?: () => string;
  createId?: () => ActivityId;
}>;

export class ActivityService {
  private readonly activities = new Map<ActivityId, Activity>();
  private readonly now: () => string;
  private readonly createId: () => ActivityId;

  constructor(options: ActivityServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as ActivityId);

    for (const activity of options.seed ?? []) {
      this.activities.set(activity.id, freezeActivity(activity));
    }
  }

  listActivities(filters: ActivityFilters, sort: ActivitySort = DEFAULT_ACTIVITY_SORT): ActivityListResult {
    if (filters.permission && !filters.permission.allowed) {
      return createListResult([], 0, filters.workspaceId, filters.companyId, filters.contactId);
    }

    const workspaceActivities = [...this.activities.values()].filter((activity) => activity.workspaceId === filters.workspaceId);
    const filtered = filterActivities(workspaceActivities, filters);

    return createListResult(sortActivities(filtered, sort), workspaceActivities.length, filters.workspaceId, filters.companyId, filters.contactId);
  }

  getActivity(id: ActivityId, workspaceId: WorkspaceId, permission = undefined as ActivityFilters["permission"]) {
    if (permission && !permission.allowed) return undefined;

    const activity = this.activities.get(id);
    return activity?.workspaceId === workspaceId ? activity : undefined;
  }

  getActivitiesByCompany(companyId: CompanyId, workspaceId: WorkspaceId, permission = undefined as ActivityFilters["permission"], sort: ActivitySort = DEFAULT_ACTIVITY_SORT) {
    return this.listActivities({ workspaceId, companyId, permission }, sort);
  }

  getActivitiesByContact(contactId: ContactId, workspaceId: WorkspaceId, permission = undefined as ActivityFilters["permission"], sort: ActivitySort = DEFAULT_ACTIVITY_SORT) {
    return this.listActivities({ workspaceId, contactId, permission }, sort);
  }

  createActivity(input: CreateActivityInput) {
    const validation = validateCreateActivityInput(input);
    if (!validation.valid) return Object.freeze({ activity: undefined, validation });

    const timestamp = this.now();
    const normalized = normalizeCreateActivityInput(input, timestamp);
    const activity = freezeActivity({
      id: this.createId(),
      workspaceId: normalized.workspaceId,
      companyId: normalized.companyId,
      contactId: normalized.contactId,
      type: normalized.type,
      title: normalized.title,
      description: normalized.description,
      performedBy: normalized.performedBy,
      performedAt: normalized.performedAt,
      status: normalized.status,
      priority: normalized.priority,
      tags: normalized.tags,
      metadata: normalized.metadata,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    this.activities.set(activity.id, activity);
    return Object.freeze({ activity, validation });
  }

  updateActivity(input: UpdateActivityInput) {
    const validation = validateUpdateActivityInput(input);
    if (!validation.valid) return Object.freeze({ activity: undefined, validation });

    const existing = this.getActivity(input.id, input.workspaceId, input.permission);
    if (!existing) return Object.freeze({ activity: undefined, validation });

    const normalized = normalizeUpdateActivityInput(input);
    const activity = freezeActivity({
      ...existing,
      companyId: normalized.companyId ?? existing.companyId,
      contactId: normalized.contactId ?? existing.contactId,
      type: normalized.type ?? existing.type,
      title: normalized.title ?? existing.title,
      description: normalized.description ?? existing.description,
      performedBy: normalized.performedBy ?? existing.performedBy,
      performedAt: normalized.performedAt ?? existing.performedAt,
      status: normalized.status ?? existing.status,
      priority: normalized.priority ?? existing.priority,
      tags: normalized.tags ?? existing.tags,
      metadata: normalized.metadata ?? existing.metadata,
      updatedAt: this.now()
    });

    this.activities.set(activity.id, activity);
    return Object.freeze({ activity, validation });
  }

  archiveActivity(id: ActivityId, workspaceId: WorkspaceId, permission?: UpdateActivityInput["permission"]) {
    return this.updateActivity({ id, workspaceId, status: "archived", permission });
  }

  searchActivities(search: ActivitySearchQuery, sort: ActivitySort = DEFAULT_ACTIVITY_SORT): ActivityListResult {
    if (search.permission && !search.permission.allowed) {
      return createListResult([], 0, search.workspaceId, search.companyId, search.contactId);
    }

    const workspaceActivities = [...this.activities.values()].filter((activity) => activity.workspaceId === search.workspaceId);
    const filtered = workspaceActivities.filter((activity) => matchesActivitySearch(activity, search));

    return createListResult(sortActivities(filtered, sort), workspaceActivities.length, search.workspaceId, search.companyId, search.contactId);
  }
}

export function freezeActivity(activity: Activity): Activity {
  return Object.freeze({
    ...activity,
    tags: Object.freeze([...activity.tags]),
    metadata: activity.metadata ? Object.freeze({ ...activity.metadata }) : undefined
  });
}

function createListResult(activities: readonly Activity[], total: number, workspaceId: WorkspaceId, companyId?: CompanyId, contactId?: ContactId): ActivityListResult {
  return Object.freeze({
    activities: Object.freeze([...activities]),
    total,
    filtered: activities.length,
    workspaceId,
    companyId,
    contactId
  });
}

export const activityService = new ActivityService();
