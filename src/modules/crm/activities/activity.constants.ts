import type { ActivityPriority, ActivitySort, ActivityStatus, ActivityType } from "./activity.types";

export const ACTIVITY_TYPES = Object.freeze([
  "call",
  "meeting",
  "email",
  "task",
  "note",
  "comment",
  "status_change",
  "document",
  "system",
  "custom"
] satisfies ActivityType[]);

export const ACTIVITY_STATUSES = Object.freeze(["open", "completed", "archived"] satisfies ActivityStatus[]);
export const ACTIVITY_PRIORITIES = Object.freeze(["low", "normal", "high", "critical"] satisfies ActivityPriority[]);

export const DEFAULT_ACTIVITY_STATUS: ActivityStatus = "completed";
export const DEFAULT_ACTIVITY_PRIORITY: ActivityPriority = "normal";
export const DEFAULT_ACTIVITY_SORT: ActivitySort = Object.freeze({ field: "performedAt", direction: "desc" });

export const CRM_ACTIVITY_READ_PERMISSION = Object.freeze({ module: "crm.activity", action: "read" as const });
export const CRM_ACTIVITY_WRITE_PERMISSION = Object.freeze({ module: "crm.activity", action: "write" as const });
