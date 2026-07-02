import { DEFAULT_TASK_PRIORITY, DEFAULT_TASK_SORT, DEFAULT_TASK_STATUS, DEFAULT_TASK_TYPE } from "./task.constants";
import type { CreateActivityInput } from "@/modules/crm/activities";
import type { CreateTaskInput, Task, TaskFilters, TaskSearchQuery, TaskSort, TaskStatus, UpdateTaskInput } from "./task.types";
import { filterCrmEntities, normalizeCrmTags, searchCrmEntities, sortCrmEntities } from "@/modules/crm/shared";

export function normalizeCreateTaskInput(input: CreateTaskInput) {
  return {
    ...input,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    taskType: input.taskType ?? DEFAULT_TASK_TYPE,
    priority: input.priority ?? DEFAULT_TASK_PRIORITY,
    status: input.status ?? DEFAULT_TASK_STATUS,
    tags: normalizeCrmTags(input.tags)
  };
}

export function normalizeUpdateTaskInput(input: UpdateTaskInput) {
  return {
    ...input,
    title: input.title?.trim(),
    description: input.description?.trim() || undefined,
    tags: input.tags ? normalizeCrmTags(input.tags) : undefined
  };
}

export function filterTasks(tasks: readonly Task[], filters: TaskFilters) {
  return filterCrmEntities(tasks, {
    workspaceId: filters.workspaceId,
    status: filters.status,
    ownerId: filters.assignedTo,
    tags: filters.tags,
    archived: false
  }).filter((task) => {
    if (!filters.includeCancelled && isTaskCancelled(task)) return false;
    if (filters.companyId && task.companyId !== filters.companyId) return false;
    if (filters.contactId && task.contactId !== filters.contactId) return false;
    if (filters.meetingId && task.meetingId !== filters.meetingId) return false;
    if (filters.taskType && task.taskType !== filters.taskType) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.dueFrom && task.dueDate < filters.dueFrom) return false;
    if (filters.dueTo && task.dueDate > filters.dueTo) return false;
    return true;
  });
}

export function matchesTaskSearch(task: Task, search: TaskSearchQuery) {
  if (task.workspaceId !== search.workspaceId) return false;
  if (search.companyId && task.companyId !== search.companyId) return false;
  if (search.contactId && task.contactId !== search.contactId) return false;
  if (search.meetingId && task.meetingId !== search.meetingId) return false;
  if (!search.includeCancelled && isTaskCancelled(task)) return false;
  if (!search.query.trim()) return true;

  return searchCrmEntities([task], {
    query: search.query,
    fields: ["title", "description", "taskType", "priority", "status", "assignedTo"]
  }).length > 0;
}

export function sortTasks(tasks: readonly Task[], sort: TaskSort = DEFAULT_TASK_SORT) {
  return sortCrmEntities(tasks, [sort]);
}

export function prepareTaskActivityInput(task: Task, event: "created" | "completed" | "cancelled" = "created"): CreateActivityInput {
  const statusByEvent: Record<typeof event, TaskStatus> = {
    created: "open",
    completed: "completed",
    cancelled: "cancelled"
  };

  return Object.freeze({
    workspaceId: task.workspaceId,
    companyId: task.companyId,
    contactId: task.contactId,
    type: "task",
    title: createTaskActivityTitle(task, event),
    description: task.description ?? `Task ${statusByEvent[event]}: ${task.title}`,
    performedBy: task.assignedTo,
    performedAt: event === "completed" ? task.completedAt ?? task.updatedAt : task.updatedAt,
    status: event === "created" ? "open" : "completed",
    priority: task.priority === "urgent" ? "critical" : task.priority === "high" ? "high" : "normal",
    tags: Object.freeze(["task", event, ...task.tags]),
    metadata: Object.freeze({ taskId: task.id, taskType: task.taskType, meetingId: task.meetingId })
  });
}

export function createFollowUpTaskFromMeeting(input: CreateTaskInput): CreateTaskInput {
  return Object.freeze({
    ...input,
    taskType: input.taskType ?? "follow_up",
    tags: Object.freeze(["meeting-follow-up", ...normalizeCrmTags(input.tags)])
  });
}

export function isTaskUpcoming(task: Task, now = new Date().toISOString()) {
  return !isTaskCancelled(task) && !isTaskCompleted(task) && task.dueDate >= now;
}

export function isTaskOverdue(task: Task, now = new Date().toISOString()) {
  return !isTaskCancelled(task) && !isTaskCompleted(task) && task.dueDate < now;
}

export function isTaskCompleted(task: Task) {
  return task.status === "completed";
}

export function isTaskCancelled(task: Task) {
  return task.status === "cancelled";
}

function createTaskActivityTitle(task: Task, event: "created" | "completed" | "cancelled") {
  const labels = {
    created: "Task created",
    completed: "Task completed",
    cancelled: "Task cancelled"
  };
  return `${labels[event]}: ${task.title}`;
}
