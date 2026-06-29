import type {
  HicoPilotNotification,
  NotificationCategory,
  NotificationInput,
  NotificationPriority
} from "./notification.types";
import { createNotification, isUnreadNotification, sortNotificationsByDate } from "./notification.utils";

const notifications = new Map<string, HicoPilotNotification>();

export function registerNotification(input: NotificationInput) {
  const notification = createNotification(input);
  notifications.set(notification.id, notification);
  return notification;
}

export function getNotification(id: string) {
  return notifications.get(id);
}

export function getNotifications() {
  return sortNotificationsByDate([...notifications.values()]);
}

export function getUnreadNotifications() {
  return getNotifications().filter(isUnreadNotification);
}

export function getNotificationsByCategory(category: NotificationCategory) {
  return getNotifications().filter((notification) => notification.category === category);
}

export function getNotificationsByPriority(priority: NotificationPriority) {
  return getNotifications().filter((notification) => notification.priority === priority);
}

export function markAsRead(id: string) {
  const notification = notifications.get(id);
  if (!notification) return undefined;

  const updated = { ...notification, read: true };
  notifications.set(id, updated);
  return updated;
}

export function markAllAsRead() {
  const updated: HicoPilotNotification[] = [];

  notifications.forEach((notification, id) => {
    const nextNotification = { ...notification, read: true };
    notifications.set(id, nextNotification);
    updated.push(nextNotification);
  });

  return sortNotificationsByDate(updated);
}

export function archiveNotification(id: string) {
  const notification = notifications.get(id);
  if (!notification) return undefined;

  const updated = { ...notification, archived: true };
  notifications.set(id, updated);
  return updated;
}

export function clearNotifications() {
  notifications.clear();
}
