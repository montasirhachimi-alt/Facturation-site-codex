import type {
  AuditAction,
  AuditCategory,
  AuditEvent,
  AuditEventInput,
  AuditSearchQuery,
  AuditSeverity
} from "./audit.types";
import { auditEventMatchesQuery, createAuditEvent, sortAuditEvents } from "./audit.utils";

const auditEvents = new Map<string, AuditEvent>();

export function log(input: AuditEventInput) {
  const event = createAuditEvent(input);
  auditEvents.set(event.id, event);
  return event;
}

export function getEvent(id: string) {
  return auditEvents.get(id);
}

export function getEvents() {
  return sortAuditEvents([...auditEvents.values()]);
}

export function getEventsByUser(userId: string) {
  return getEvents().filter((event) => event.userId === userId);
}

export function getEventsByModule(moduleId: string) {
  return getEvents().filter((event) => event.moduleId === moduleId);
}

export function getEventsByCategory(category: AuditCategory) {
  return getEvents().filter((event) => event.category === category);
}

export function getEventsBySeverity(severity: AuditSeverity) {
  return getEvents().filter((event) => event.severity === severity);
}

export function getEventsByAction(action: AuditAction) {
  return getEvents().filter((event) => event.action === action);
}

export function getEventsByEntity(entityType: string, entityId?: string) {
  return getEvents().filter((event) => {
    if (event.entityType !== entityType) return false;
    return entityId ? event.entityId === entityId : true;
  });
}

export function getRecentEvents(limit = 20) {
  return getEvents().slice(0, limit);
}

export function searchEvents(query: AuditSearchQuery) {
  return getEvents().filter((event) => auditEventMatchesQuery(event, query));
}

export function clear() {
  auditEvents.clear();
}
