import type { AuditEvent, AuditEventInput, AuditSearchQuery } from "./audit.types";

export function createAuditEvent(input: AuditEventInput): AuditEvent {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const success = input.success ?? (input.severity !== "error" && input.severity !== "critical");

  return {
    ...input,
    id: input.id ?? `audit-${timestamp}-${input.action}-${input.entityId ?? "event"}`,
    timestamp,
    createdAt: input.createdAt ?? timestamp,
    success,
    status: input.status ?? (success ? "completed" : "failed")
  };
}

export function sortAuditEvents(events: AuditEvent[]) {
  return [...events].sort((first, second) => {
    return new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime();
  });
}

export function auditEventMatchesQuery(event: AuditEvent, query: AuditSearchQuery) {
  const text = query.text?.trim().toLowerCase();

  if (query.userId && event.userId !== query.userId) return false;
  if (query.moduleId && event.moduleId !== query.moduleId) return false;
  if (query.entityType && event.entityType !== query.entityType) return false;
  if (query.entityId && event.entityId !== query.entityId) return false;
  if (query.action && event.action !== query.action) return false;
  if (query.category && event.category !== query.category) return false;
  if (query.severity && event.severity !== query.severity) return false;
  if (typeof query.success === "boolean" && event.success !== query.success) return false;

  if (!text) return true;

  return [
    event.id,
    event.message,
    event.entityType,
    event.entityId,
    event.moduleId,
    event.userId,
    event.correlationId
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(text));
}
