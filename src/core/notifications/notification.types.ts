import type { CoreModuleId } from "../registry";
import type {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES
} from "./notification.constants";

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationActionTarget = {
  moduleId?: CoreModuleId;
  route?: string;
  entityId?: string;
  entityType?: string;
};

export type NotificationMetadata = Record<string, string | number | boolean | null | undefined>;

export type HicoPilotNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  moduleId?: CoreModuleId;
  createdAt: string;
  read: boolean;
  archived: boolean;
  actionLabel?: string;
  actionTarget?: NotificationActionTarget;
  metadata?: NotificationMetadata;
};

export type NotificationInput = Omit<HicoPilotNotification, "read" | "archived"> & {
  read?: boolean;
  archived?: boolean;
};
