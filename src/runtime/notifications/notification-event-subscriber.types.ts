import type { NotificationCategory, NotificationInput, NotificationPriority, NotificationType } from "@/core/notifications";
import type { PlatformEvent, PlatformEventCategory } from "@/runtime/platform-events";

export type NotificationEventSeverity = NotificationPriority;

export type NotificationEventRequest = {
  id: string;
  title: string;
  message: string;
  severity: NotificationEventSeverity;
  category: NotificationCategory;
  timestamp: string;
  workspaceId?: string;
  sourceEventId: string;
  notificationType: NotificationType;
  metadata?: NotificationInput["metadata"];
};

export type NotificationEventMapper = (event: PlatformEvent) => NotificationEventRequest | undefined;

export type NotificationEventSubscriberService = {
  notify: (input: NotificationInput) => unknown;
  getAll?: () => Array<{ id: string }>;
};

export type SupportedNotificationEventCategoryPrefix =
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

export type SupportedNotificationEventCategory = `${SupportedNotificationEventCategoryPrefix}.${string}` | PlatformEventCategory;
