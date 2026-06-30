import {
  clear,
  getEvent,
  getEvents,
  getEventsByAction,
  getEventsByCategory,
  getEventsByEntity,
  getEventsByModule,
  getEventsBySeverity,
  getEventsByUser,
  getRecentEvents,
  log,
  searchEvents
} from "./audit.registry";
import type { AuditAction, AuditCategory, AuditEventInput, AuditSearchQuery, AuditSeverity } from "./audit.types";

export const auditService = {
  log(input: AuditEventInput) {
    return log(input);
  },

  getById(id: string) {
    return getEvent(id);
  },

  getAll() {
    return getEvents();
  },

  getByUser(userId: string) {
    return getEventsByUser(userId);
  },

  getByModule(moduleId: string) {
    return getEventsByModule(moduleId);
  },

  getByCategory(category: AuditCategory) {
    return getEventsByCategory(category);
  },

  getBySeverity(severity: AuditSeverity) {
    return getEventsBySeverity(severity);
  },

  getByAction(action: AuditAction) {
    return getEventsByAction(action);
  },

  getByEntity(entityType: string, entityId?: string) {
    return getEventsByEntity(entityType, entityId);
  },

  getRecent(limit?: number) {
    return getRecentEvents(limit);
  },

  search(query: AuditSearchQuery) {
    return searchEvents(query);
  },

  clear() {
    clear();
  }
};
