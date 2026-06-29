import type { CoreRegistryItem } from "../types";

export type NotificationCategory =
  | "system"
  | "finance"
  | "stock"
  | "sales"
  | "hr"
  | "security"
  | "ai"
  | (string & {});

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export type NotificationStatus = "unread" | "read" | "archived";

export type NotificationDefinition = CoreRegistryItem<{
  category: NotificationCategory;
  priority?: NotificationPriority;
}> & {
  category: NotificationCategory;
  priority?: NotificationPriority;
};

export type NotificationPayload = {
  id: string;
  definitionId: string;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  href?: string;
  metadata?: Record<string, unknown>;
};
