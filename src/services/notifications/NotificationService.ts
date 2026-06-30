import { notificationService } from "@/core/notifications";
import type { NotificationCategory, NotificationInput, NotificationPriority } from "@/core/notifications";

export class NotificationService {
  notify(input: NotificationInput) {
    return notificationService.register(input);
  }

  getAll() {
    return notificationService.getAll();
  }

  getUnread() {
    return notificationService.getUnread();
  }

  getByCategory(category: NotificationCategory) {
    return notificationService.getByCategory(category);
  }

  getByPriority(priority: NotificationPriority) {
    return notificationService.getByPriority(priority);
  }

  markRead(id: string) {
    return notificationService.markAsRead(id);
  }

  markAllRead() {
    return notificationService.markAllAsRead();
  }

  archive(id: string) {
    return notificationService.archive(id);
  }
}
