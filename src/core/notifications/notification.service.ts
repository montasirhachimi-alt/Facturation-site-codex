import {
  archiveNotification,
  getNotification,
  getNotifications,
  getNotificationsByCategory,
  getNotificationsByPriority,
  getUnreadNotifications,
  markAllAsRead,
  markAsRead,
  registerNotification
} from "./notification.registry";
import type { NotificationCategory, NotificationInput, NotificationPriority } from "./notification.types";

export const notificationService = {
  register(input: NotificationInput) {
    return registerNotification(input);
  },

  getById(id: string) {
    return getNotification(id);
  },

  getAll() {
    return getNotifications();
  },

  getUnread() {
    return getUnreadNotifications();
  },

  getByCategory(category: NotificationCategory) {
    return getNotificationsByCategory(category);
  },

  getByPriority(priority: NotificationPriority) {
    return getNotificationsByPriority(priority);
  },

  markAsRead(id: string) {
    return markAsRead(id);
  },

  markAllAsRead() {
    return markAllAsRead();
  },

  archive(id: string) {
    return archiveNotification(id);
  }
};
