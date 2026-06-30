import type { CoreModuleId } from "../registry";
import type {
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  AUDIT_SEVERITIES,
  AUDIT_STATUSES
} from "./audit.constants";

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export type AuditDetails = Record<string, string | number | boolean | null | undefined>;

export type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

export type AuditEvent = {
  id: string;
  timestamp: string;
  userId?: string;
  workspaceId?: string;
  companyId?: string;
  moduleId?: CoreModuleId;
  entityType?: string;
  entityId?: string;
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  status: AuditStatus;
  message: string;
  details?: AuditDetails;
  metadata?: AuditMetadata;
  ip?: string;
  device?: string;
  browser?: string;
  platform?: string;
  sessionId?: string;
  correlationId?: string;
  success: boolean;
  duration?: number;
  createdAt: string;
};

export type AuditEventInput = Omit<AuditEvent, "id" | "timestamp" | "createdAt" | "success" | "status"> & {
  id?: string;
  timestamp?: string;
  createdAt?: string;
  success?: boolean;
  status?: AuditStatus;
};

export type AuditSearchQuery = {
  text?: string;
  userId?: string;
  moduleId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  success?: boolean;
};
