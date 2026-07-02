import type { PermissionDecision } from "@/runtime/permissions";
import type { Activity, CreateActivityInput } from "@/modules/crm/activities";
import type { MeetingId } from "@/modules/crm/meetings";
import type { CompanyId, UserId, WorkspaceId } from "../companies/company.types";
import type { ContactId } from "../contacts/contact.types";

export type TaskId = string & { readonly __brand: "TaskId" };

export type TaskType = "follow_up" | "call" | "email" | "reminder" | "document" | "sales" | "support" | "internal" | "custom";
export type TaskStatus = "open" | "in_progress" | "waiting" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Task = Readonly<{
  id: TaskId;
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  contactId: ContactId;
  meetingId?: MeetingId;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: UserId;
  dueDate: string;
  completedAt?: string;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
}>;

export type CreateTaskInput = Readonly<{
  workspaceId: WorkspaceId;
  companyId: CompanyId;
  contactId: ContactId;
  meetingId?: MeetingId;
  title: string;
  description?: string;
  taskType?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo: UserId;
  dueDate: string;
  completedAt?: string;
  tags?: readonly string[];
  permission?: PermissionDecision;
}>;

export type UpdateTaskInput = Readonly<{
  id: TaskId;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  title?: string;
  description?: string;
  taskType?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: UserId;
  dueDate?: string;
  completedAt?: string;
  tags?: readonly string[];
  permission?: PermissionDecision;
}>;

export type TaskFilters = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  taskType?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: UserId;
  dueFrom?: string;
  dueTo?: string;
  tags?: readonly string[];
  includeCancelled?: boolean;
  permission?: PermissionDecision;
}>;

export type TaskSearchQuery = Readonly<{
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
  query: string;
  includeCancelled?: boolean;
  permission?: PermissionDecision;
}>;

export type TaskSortField = "dueDate" | "updatedAt" | "title" | "taskType" | "priority" | "status";
export type TaskSortDirection = "asc" | "desc";

export type TaskSort = Readonly<{
  field: TaskSortField;
  direction: TaskSortDirection;
}>;

export type TaskListResult = Readonly<{
  tasks: readonly Task[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
  companyId?: CompanyId;
  contactId?: ContactId;
  meetingId?: MeetingId;
}>;

export type TaskActivityPreparation = Readonly<{
  task: Task;
  activityInput: CreateActivityInput;
  activity?: Activity;
}>;
