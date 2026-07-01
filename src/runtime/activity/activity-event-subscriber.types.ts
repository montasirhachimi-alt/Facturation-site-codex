import type { ActivityCategory, ActivityInput, ActivitySeverity, ActivityType } from "@/core/activity";
import type { PlatformEvent, PlatformEventCategory } from "@/runtime/platform-events";

export type ActivityEventModel = {
  id: string;
  eventId: string;
  workspaceId?: string;
  actorId?: string;
  action: ActivityType;
  category: ActivityCategory;
  resourceType?: string;
  resourceId?: string;
  timestamp: string;
  summary: string;
  details: string;
  severity: ActivitySeverity;
  metadata?: ActivityInput["metadata"];
};

export type ActivityEventMapper = (event: PlatformEvent) => ActivityEventModel | undefined;

export type ActivityEventSubscriberService = {
  track: (input: ActivityInput) => unknown;
  getTimeline?: (limit?: number) => Array<{ id: string }>;
};

export type SupportedActivityEventCategoryPrefix =
  | "workspace"
  | "dashboard"
  | "widget"
  | "preferences"
  | "crm"
  | "sales"
  | "inventory"
  | "finance"
  | "plugin"
  | "system";

export type SupportedActivityEventCategory = `${SupportedActivityEventCategoryPrefix}.${string}` | PlatformEventCategory;
