import type { TaskPriority, TaskSort, TaskStatus, TaskType } from "./task.types";

export const TASK_TYPES = Object.freeze([
  "follow_up",
  "call",
  "email",
  "reminder",
  "document",
  "sales",
  "support",
  "internal",
  "custom"
] satisfies TaskType[]);

export const TASK_STATUSES = Object.freeze(["open", "in_progress", "waiting", "completed", "cancelled"] satisfies TaskStatus[]);
export const TASK_PRIORITIES = Object.freeze(["low", "medium", "high", "urgent"] satisfies TaskPriority[]);

export const DEFAULT_TASK_TYPE: TaskType = "follow_up";
export const DEFAULT_TASK_STATUS: TaskStatus = "open";
export const DEFAULT_TASK_PRIORITY: TaskPriority = "medium";
export const DEFAULT_TASK_SORT: TaskSort = Object.freeze({ field: "dueDate", direction: "asc" });

export const CRM_TASK_READ_PERMISSION = Object.freeze({ module: "crm.task", action: "read" as const });
export const CRM_TASK_WRITE_PERMISSION = Object.freeze({ module: "crm.task", action: "write" as const });
