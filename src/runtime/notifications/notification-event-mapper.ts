import type { NotificationCategory, NotificationInput, NotificationPriority, NotificationType } from "@/core/notifications";
import type { PlatformEvent } from "@/runtime/platform-events";
import type {
  NotificationEventRequest,
  SupportedNotificationEventCategoryPrefix
} from "./notification-event-subscriber.types";

const supportedCategoryPrefixes: SupportedNotificationEventCategoryPrefix[] = [
  "workspace",
  "dashboard",
  "widget",
  "preferences",
  "crm",
  "sales",
  "inventory",
  "finance",
  "plugin",
  "system"
];

const categoryLabels: Record<SupportedNotificationEventCategoryPrefix, string> = {
  workspace: "Espace de travail",
  dashboard: "Tableau de bord",
  widget: "Widget",
  preferences: "Préférences",
  crm: "CRM",
  sales: "Ventes",
  inventory: "Stock",
  finance: "Finance",
  plugin: "Extension",
  system: "Système"
};

export function mapPlatformEventToNotification(event: PlatformEvent): NotificationEventRequest | undefined {
  if (!isValidEvent(event)) return undefined;

  const prefix = getCategoryPrefix(event.category);
  if (!isSupportedCategoryPrefix(prefix)) return undefined;

  const notificationType = getNotificationType(event);
  const severity = getNotificationSeverity(event);
  const label = categoryLabels[prefix];

  return {
    id: getNotificationId(event.id),
    title: `${label} mis à jour`,
    message: `Un événement ${event.type} a été reçu par la plateforme.`,
    severity,
    category: mapNotificationCategory(prefix),
    timestamp: event.timestamp,
    workspaceId: event.workspaceId,
    sourceEventId: event.id,
    notificationType,
    metadata: compactMetadata({
      source: "platform-event",
      sourceEventId: event.id,
      eventType: event.type,
      eventCategory: event.category,
      workspaceId: event.workspaceId,
      actorId: event.actorId,
      resourceType: event.resourceType,
      resourceId: event.resourceId
    })
  };
}

export function toNotificationInput(request: NotificationEventRequest): NotificationInput {
  return {
    id: request.id,
    title: request.title,
    message: request.message,
    type: request.notificationType,
    priority: request.severity,
    category: request.category,
    createdAt: request.timestamp,
    metadata: request.metadata
  };
}

export function getNotificationId(eventId: string) {
  return `platform-event:${eventId}`;
}

function isValidEvent(event: PlatformEvent) {
  return Boolean(event.id && event.type && event.category && event.timestamp);
}

function getCategoryPrefix(category: string) {
  return category.split(".")[0];
}

function isSupportedCategoryPrefix(prefix: string): prefix is SupportedNotificationEventCategoryPrefix {
  return supportedCategoryPrefixes.includes(prefix as SupportedNotificationEventCategoryPrefix);
}

function mapNotificationCategory(prefix: SupportedNotificationEventCategoryPrefix): NotificationCategory {
  if (prefix === "finance") return "finance";
  if (prefix === "sales") return "sales";
  if (prefix === "inventory") return "stock";

  return "system";
}

function getNotificationSeverity(event: PlatformEvent): NotificationPriority {
  const severity = event.metadata?.severity;

  if (severity === "low" || severity === "normal" || severity === "high" || severity === "critical") {
    return severity;
  }

  return "normal";
}

function getNotificationType(event: PlatformEvent): NotificationType {
  const notificationType = event.metadata?.notificationType;

  if (
    notificationType === "info" ||
    notificationType === "success" ||
    notificationType === "warning" ||
    notificationType === "error" ||
    notificationType === "security" ||
    notificationType === "ai"
  ) {
    return notificationType;
  }

  return event.type.includes("error") || event.type.includes("failed") ? "warning" : "info";
}

function compactMetadata(metadata: NonNullable<NotificationInput["metadata"]>): NotificationInput["metadata"] {
  return Object.entries(metadata).reduce<NonNullable<NotificationInput["metadata"]>>((nextMetadata, [key, value]) => {
    if (value !== undefined) {
      nextMetadata[key] = value;
    }

    return nextMetadata;
  }, {});
}
