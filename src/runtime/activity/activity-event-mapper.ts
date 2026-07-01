import type { ActivityCategory, ActivityInput, ActivitySeverity, ActivityType } from "@/core/activity";
import type { PlatformEvent } from "@/runtime/platform-events";
import type { ActivityEventModel, SupportedActivityEventCategoryPrefix } from "./activity-event-subscriber.types";

const supportedCategoryPrefixes: SupportedActivityEventCategoryPrefix[] = [
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

const categoryLabels: Record<SupportedActivityEventCategoryPrefix, string> = {
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

export function mapPlatformEventToActivity(event: PlatformEvent): ActivityEventModel | undefined {
  if (!isValidEvent(event)) return undefined;

  const prefix = getCategoryPrefix(event.category);
  if (!isSupportedCategoryPrefix(prefix)) return undefined;

  const action = getActivityAction(event);
  const label = categoryLabels[prefix];

  return {
    id: getActivityId(event.id),
    eventId: event.id,
    workspaceId: event.workspaceId,
    actorId: event.actorId,
    action,
    category: mapActivityCategory(prefix),
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    timestamp: event.timestamp,
    summary: `${label} · ${event.type}`,
    details: `Un événement ${event.type} a été enregistré dans la mémoire opérationnelle.`,
    severity: getActivitySeverity(event),
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

export function toActivityInput(model: ActivityEventModel): ActivityInput {
  return {
    id: model.id,
    title: model.summary,
    description: model.details,
    type: model.action,
    category: model.category,
    createdAt: model.timestamp,
    severity: model.severity,
    user: model.actorId ? { id: model.actorId, name: model.actorId } : undefined,
    metadata: model.metadata
  };
}

export function getActivityId(eventId: string) {
  return `platform-event:${eventId}`;
}

function isValidEvent(event: PlatformEvent) {
  return Boolean(event.id && event.type && event.category && event.timestamp);
}

function getCategoryPrefix(category: string) {
  return category.split(".")[0];
}

function isSupportedCategoryPrefix(prefix: string): prefix is SupportedActivityEventCategoryPrefix {
  return supportedCategoryPrefixes.includes(prefix as SupportedActivityEventCategoryPrefix);
}

function mapActivityCategory(prefix: SupportedActivityEventCategoryPrefix): ActivityCategory {
  if (prefix === "sales") return "sales";
  if (prefix === "finance") return "finance";
  if (prefix === "inventory") return "stock";
  if (prefix === "crm") return "crm";
  if (prefix === "plugin") return "administration";

  return "system";
}

function getActivityAction(event: PlatformEvent): ActivityType {
  const action = event.metadata?.activityType;

  if (
    action === "created" ||
    action === "updated" ||
    action === "deleted" ||
    action === "payment" ||
    action === "warning" ||
    action === "success" ||
    action === "error" ||
    action === "login" ||
    action === "logout" ||
    action === "backup" ||
    action === "security" ||
    action === "ai" ||
    action === "system"
  ) {
    return action;
  }

  if (event.type.includes("created")) return "created";
  if (event.type.includes("updated") || event.type.includes("changed") || event.type.includes("refreshed")) return "updated";
  if (event.type.includes("deleted")) return "deleted";
  if (event.type.includes("payment")) return "payment";
  if (event.type.includes("failed") || event.type.includes("error")) return "error";

  return "system";
}

function getActivitySeverity(event: PlatformEvent): ActivitySeverity {
  const severity = event.metadata?.severity;

  if (severity === "low" || severity === "normal" || severity === "high" || severity === "critical") {
    return severity;
  }

  return event.type.includes("failed") || event.type.includes("error") ? "high" : "normal";
}

function compactMetadata(metadata: NonNullable<ActivityInput["metadata"]>): ActivityInput["metadata"] {
  return Object.entries(metadata).reduce<NonNullable<ActivityInput["metadata"]>>((nextMetadata, [key, value]) => {
    if (value !== undefined) {
      nextMetadata[key] = value;
    }

    return nextMetadata;
  }, {});
}
