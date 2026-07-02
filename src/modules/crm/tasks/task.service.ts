import { DEFAULT_TASK_SORT } from "./task.constants";
import type {
  CreateTaskInput,
  Task,
  TaskActivityPreparation,
  TaskFilters,
  TaskId,
  TaskListResult,
  TaskSearchQuery,
  TaskSort,
  UpdateTaskInput
} from "./task.types";
import type { Activity } from "@/modules/crm/activities";
import type { MeetingId } from "@/modules/crm/meetings";
import type { CompanyId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";
import { filterTasks, matchesTaskSearch, normalizeCreateTaskInput, normalizeUpdateTaskInput, prepareTaskActivityInput, sortTasks } from "./task.utils";
import { validateCreateTaskInput, validateUpdateTaskInput } from "./task.validation";

export type TaskServiceOptions = Readonly<{
  seed?: readonly Task[];
  now?: () => string;
  createId?: () => TaskId;
  createActivity?: (input: ReturnType<typeof prepareTaskActivityInput>) => Activity | undefined;
}>;

export class TaskService {
  private readonly tasks = new Map<TaskId, Task>();
  private readonly now: () => string;
  private readonly createId: () => TaskId;
  private readonly createActivity?: TaskServiceOptions["createActivity"];

  constructor(options: TaskServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as TaskId);
    this.createActivity = options.createActivity;

    for (const task of options.seed ?? []) {
      this.tasks.set(task.id, freezeTask(task));
    }
  }

  listTasks(filters: TaskFilters, sort: TaskSort = DEFAULT_TASK_SORT): TaskListResult {
    if (filters.permission && !filters.permission.allowed) {
      return createListResult([], 0, filters.workspaceId, filters.companyId, filters.contactId, filters.meetingId);
    }

    const workspaceTasks = [...this.tasks.values()].filter((task) => task.workspaceId === filters.workspaceId);
    const filtered = filterTasks(workspaceTasks, filters);

    return createListResult(sortTasks(filtered, sort), workspaceTasks.length, filters.workspaceId, filters.companyId, filters.contactId, filters.meetingId);
  }

  getTask(id: TaskId, workspaceId: WorkspaceId, permission = undefined as TaskFilters["permission"]) {
    if (permission && !permission.allowed) return undefined;

    const task = this.tasks.get(id);
    return task?.workspaceId === workspaceId ? task : undefined;
  }

  getTasksByCompany(companyId: CompanyId, workspaceId: WorkspaceId, permission = undefined as TaskFilters["permission"], sort: TaskSort = DEFAULT_TASK_SORT) {
    return this.listTasks({ workspaceId, companyId, permission }, sort);
  }

  getTasksByContact(contactId: ContactId, workspaceId: WorkspaceId, permission = undefined as TaskFilters["permission"], sort: TaskSort = DEFAULT_TASK_SORT) {
    return this.listTasks({ workspaceId, contactId, permission }, sort);
  }

  getTasksByMeeting(meetingId: MeetingId, workspaceId: WorkspaceId, permission = undefined as TaskFilters["permission"], sort: TaskSort = DEFAULT_TASK_SORT) {
    return this.listTasks({ workspaceId, meetingId, permission }, sort);
  }

  createTask(input: CreateTaskInput) {
    const validation = validateCreateTaskInput(input);
    if (!validation.valid) return Object.freeze({ task: undefined, validation, activity: undefined, activityInput: undefined });

    const normalized = normalizeCreateTaskInput(input);
    const timestamp = this.now();
    const task = freezeTask({
      id: this.createId(),
      workspaceId: normalized.workspaceId,
      companyId: normalized.companyId,
      contactId: normalized.contactId,
      meetingId: normalized.meetingId,
      title: normalized.title,
      description: normalized.description,
      taskType: normalized.taskType,
      priority: normalized.priority,
      status: normalized.status,
      assignedTo: normalized.assignedTo,
      dueDate: normalized.dueDate,
      completedAt: normalized.completedAt,
      tags: normalized.tags,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    this.tasks.set(task.id, task);
    const activityInput = prepareTaskActivityInput(task, "created");
    const activity = this.createActivity?.(activityInput);

    return Object.freeze({ task, validation, activity, activityInput } satisfies TaskActivityPreparation & { validation: typeof validation });
  }

  updateTask(input: UpdateTaskInput) {
    const validation = validateUpdateTaskInput(input);
    if (!validation.valid) return Object.freeze({ task: undefined, validation });

    const existing = this.getTask(input.id, input.workspaceId, input.permission);
    if (!existing) return Object.freeze({ task: undefined, validation });

    const normalized = normalizeUpdateTaskInput(input);
    const task = freezeTask({
      ...existing,
      companyId: normalized.companyId ?? existing.companyId,
      contactId: normalized.contactId ?? existing.contactId,
      meetingId: normalized.meetingId ?? existing.meetingId,
      title: normalized.title ?? existing.title,
      description: normalized.description ?? existing.description,
      taskType: normalized.taskType ?? existing.taskType,
      priority: normalized.priority ?? existing.priority,
      status: normalized.status ?? existing.status,
      assignedTo: normalized.assignedTo ?? existing.assignedTo,
      dueDate: normalized.dueDate ?? existing.dueDate,
      completedAt: normalized.completedAt ?? existing.completedAt,
      tags: normalized.tags ?? existing.tags,
      updatedAt: this.now()
    });

    this.tasks.set(task.id, task);
    return Object.freeze({ task, validation });
  }

  completeTask(id: TaskId, workspaceId: WorkspaceId, permission?: UpdateTaskInput["permission"]) {
    const updated = this.updateTask({ id, workspaceId, status: "completed", completedAt: this.now(), permission });
    const activityInput = updated.task ? prepareTaskActivityInput(updated.task, "completed") : undefined;
    const activity = activityInput ? this.createActivity?.(activityInput) : undefined;
    return Object.freeze({ ...updated, activity, activityInput });
  }

  cancelTask(id: TaskId, workspaceId: WorkspaceId, permission?: UpdateTaskInput["permission"]) {
    const updated = this.updateTask({ id, workspaceId, status: "cancelled", permission });
    const activityInput = updated.task ? prepareTaskActivityInput(updated.task, "cancelled") : undefined;
    const activity = activityInput ? this.createActivity?.(activityInput) : undefined;
    return Object.freeze({ ...updated, activity, activityInput });
  }

  searchTasks(search: TaskSearchQuery, sort: TaskSort = DEFAULT_TASK_SORT): TaskListResult {
    if (search.permission && !search.permission.allowed) {
      return createListResult([], 0, search.workspaceId, search.companyId, search.contactId, search.meetingId);
    }

    const workspaceTasks = [...this.tasks.values()].filter((task) => task.workspaceId === search.workspaceId);
    const filtered = workspaceTasks.filter((task) => matchesTaskSearch(task, search));

    return createListResult(sortTasks(filtered, sort), workspaceTasks.length, search.workspaceId, search.companyId, search.contactId, search.meetingId);
  }
}

export function freezeTask(task: Task): Task {
  return Object.freeze({
    ...task,
    tags: Object.freeze([...task.tags])
  });
}

function createListResult(tasks: readonly Task[], total: number, workspaceId: WorkspaceId, companyId?: CompanyId, contactId?: ContactId, meetingId?: MeetingId): TaskListResult {
  return Object.freeze({
    tasks: Object.freeze([...tasks]),
    total,
    filtered: tasks.length,
    workspaceId,
    companyId,
    contactId,
    meetingId
  });
}

export const taskService = new TaskService();
