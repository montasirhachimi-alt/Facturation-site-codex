import type { AuditAction, AuditCategory, AuditEventInput, AuditSeverity } from "@/core/audit";
import type { PlatformEvent, PlatformEventCategory } from "@/runtime/platform-events";

export type AuditRecordMetadata = Record<string, unknown>;

export type AuditRecord = Readonly<{
  id: string;
  eventId: string;
  workspaceId?: string;
  actorId?: string;
  action: AuditAction;
  category: AuditCategory;
  resourceType?: string;
  resourceId?: string;
  timestamp: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  permission?: string;
  severity: AuditSeverity;
  success: boolean;
  metadata?: AuditRecordMetadata;
}>;

export type AuditEventMapper = (event: PlatformEvent) => AuditRecord | undefined;

export type AuditEventSubscriberService = {
  log: (input: AuditEventInput) => unknown;
  getRecent?: (limit?: number) => Array<{ id: string }>;
};

export type SupportedAuditEventCategoryPrefix =
  | "security"
  | "permissions"
  | "authentication"
  | "workspace"
  | "crm"
  | "sales"
  | "finance"
  | "system";

export type SupportedAuditEventCategory = `${SupportedAuditEventCategoryPrefix}.${string}` | PlatformEventCategory;
