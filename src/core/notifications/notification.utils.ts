import type { HicoPilotNotification, NotificationInput } from "./notification.types";

export function createNotification(input: NotificationInput): HicoPilotNotification {
  return {
    ...input,
    read: input.read ?? false,
    archived: input.archived ?? false
  };
}

export function sortNotificationsByDate(notifications: HicoPilotNotification[]) {
  return [...notifications].sort((first, second) => {
    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}

export function isUnreadNotification(notification: HicoPilotNotification) {
  return !notification.read && !notification.archived;
}
