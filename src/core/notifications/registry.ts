import type { NotificationDefinition } from "./types";

const notificationDefinitions: NotificationDefinition[] = [];

export function registerNotificationDefinition(definition: NotificationDefinition) {
  notificationDefinitions.push(definition);
}

export function getNotificationDefinitions() {
  return [...notificationDefinitions];
}

export function clearNotificationDefinitions() {
  notificationDefinitions.length = 0;
}
