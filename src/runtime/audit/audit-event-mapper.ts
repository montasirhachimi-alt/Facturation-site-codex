import type { AuditAction, AuditCategory, AuditDetails, AuditEventInput, AuditMetadata, AuditSeverity } from "@/core/audit";
import type { PlatformEvent } from "@/runtime/platform-events";
import type { AuditRecord, SupportedAuditEventCategoryPrefix } from "./audit-event-subscriber.types";

const supportedCategoryPrefixes: SupportedAuditEventCategoryPrefix[] = [
  "security",
  "permissions",
  "authentication",
  "workspace",
  "crm",
  "sales",
  "finance",
  "system"
];

export function mapPlatformEventToAuditRecord(event: PlatformEvent): AuditRecord | undefined {
  if (!isValidEvent(event)) return undefined;

  const prefix = getCategoryPrefix(event.category);
  if (!isSupportedCategoryPrefix(prefix)) return undefined;

  const severity = getAuditSeverity(event);

  return Object.freeze({
    id: getAuditRecordId(event.id),
    eventId: event.id,
    workspaceId: event.workspaceId,
    actorId: event.actorId,
    action: getAuditAction(event),
    category: mapAuditCategory(prefix),
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    timestamp: event.timestamp,
    oldValue: event.payload?.oldValue,
    newValue: event.payload?.newValue,
    ipAddress: getStringMetadata(event, "ipAddress"),
    userAgent: getStringMetadata(event, "userAgent"),
    permission: getStringMetadata(event, "permission"),
    severity,
    success: severity !== "error" && severity !== "critical",
    metadata: compactRecordMetadata({
      source: "platform-event",
      sourceEventId: event.id,
      eventType: event.type,
      eventCategory: event.category,
      workspaceId: event.workspaceId,
      actorId: event.actorId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      correlationId: getStringMetadata(event, "correlationId")
    })
  } satisfies AuditRecord);
}

export function toAuditEventInput(record: AuditRecord): AuditEventInput {
  return {
    id: record.id,
    timestamp: record.timestamp,
    userId: record.actorId,
    workspaceId: record.workspaceId,
    entityType: record.resourceType,
    entityId: record.resourceId,
    action: record.action,
    category: record.category,
    severity: record.severity,
    success: record.success,
    message: `${record.category}.${record.action} recorded from platform event ${record.eventId}`,
    details: compactAuditDetails({
      oldValue: serializeValue(record.oldValue),
      newValue: serializeValue(record.newValue),
      permission: record.permission,
      sourceEventId: record.eventId
    }),
    metadata: compactAuditMetadata({
      source: "platform-event",
      sourceEventId: record.eventId,
      workspaceId: record.workspaceId,
      actorId: record.actorId,
      resourceType: record.resourceType,
      resourceId: record.resourceId
    }),
    ip: record.ipAddress,
    browser: record.userAgent,
    correlationId: typeof record.metadata?.correlationId === "string" ? record.metadata.correlationId : record.eventId
  };
}

export function getAuditRecordId(eventId: string) {
  return `platform-event:${eventId}`;
}

function isValidEvent(event: PlatformEvent) {
  return Boolean(event.id && event.type && event.category && event.timestamp);
}

function getCategoryPrefix(category: string) {
  return category.split(".")[0];
}

function isSupportedCategoryPrefix(prefix: string): prefix is SupportedAuditEventCategoryPrefix {
  return supportedCategoryPrefixes.includes(prefix as SupportedAuditEventCategoryPrefix);
}

function mapAuditCategory(prefix: SupportedAuditEventCategoryPrefix): AuditCategory {
  if (prefix === "authentication") return "authentication";
  if (prefix === "security" || prefix === "permissions") return "security";
  if (prefix === "sales") return "sales";
  if (prefix === "finance") return "finance";
  if (prefix === "crm") return "crm";

  return "system";
}

function getAuditAction(event: PlatformEvent): AuditAction {
  const action = event.metadata?.auditAction;

  if (
    action === "create" ||
    action === "update" ||
    action === "delete" ||
    action === "view" ||
    action === "print" ||
    action === "export" ||
    action === "import" ||
    action === "login" ||
    action === "logout" ||
    action === "execute" ||
    action === "approve" ||
    action === "reject" ||
    action === "restore" ||
    action === "archive" ||
    action === "sync" ||
    action === "ai" ||
    action === "custom"
  ) {
    return action;
  }

  if (event.type.includes("login")) return "login";
  if (event.type.includes("logout")) return "logout";
  if (event.type.includes("created")) return "create";
  if (event.type.includes("updated") || event.type.includes("changed")) return "update";
  if (event.type.includes("deleted")) return "delete";
  if (event.type.includes("approved")) return "approve";
  if (event.type.includes("rejected") || event.type.includes("denied")) return "reject";
  if (event.type.includes("exported")) return "export";
  if (event.type.includes("imported")) return "import";
  if (event.type.includes("sync")) return "sync";

  return "custom";
}

function getAuditSeverity(event: PlatformEvent): AuditSeverity {
  const severity = event.metadata?.auditSeverity ?? event.metadata?.severity;

  if (
    severity === "info" ||
    severity === "success" ||
    severity === "warning" ||
    severity === "error" ||
    severity === "critical"
  ) {
    return severity;
  }

  if (event.type.includes("failed") || event.type.includes("denied")) return "warning";
  if (event.type.includes("error")) return "error";

  return "info";
}

function getStringMetadata(event: PlatformEvent, key: string) {
  const value = event.metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function serializeValue(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;

  return JSON.stringify(value);
}

function compactRecordMetadata(metadata: AuditRecord["metadata"]): AuditRecord["metadata"] {
  return Object.entries(metadata ?? {}).reduce<NonNullable<AuditRecord["metadata"]>>((nextMetadata, [key, value]) => {
    if (value !== undefined) {
      nextMetadata[key] = value;
    }

    return nextMetadata;
  }, {});
}

function compactAuditDetails(details: AuditDetails): AuditDetails {
  return Object.entries(details).reduce<AuditDetails>((nextDetails, [key, value]) => {
    if (value !== undefined) {
      nextDetails[key] = value;
    }

    return nextDetails;
  }, {});
}

function compactAuditMetadata(metadata: AuditMetadata): AuditMetadata {
  return Object.entries(metadata).reduce<AuditMetadata>((nextMetadata, [key, value]) => {
    if (value !== undefined) {
      nextMetadata[key] = value;
    }

    return nextMetadata;
  }, {});
}
