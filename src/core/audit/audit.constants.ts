export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "view",
  "print",
  "export",
  "import",
  "login",
  "logout",
  "execute",
  "approve",
  "reject",
  "restore",
  "archive",
  "sync",
  "ai",
  "custom"
] as const;

export const AUDIT_SEVERITIES = [
  "info",
  "success",
  "warning",
  "error",
  "critical"
] as const;

export const AUDIT_CATEGORIES = [
  "authentication",
  "security",
  "sales",
  "finance",
  "inventory",
  "crm",
  "documents",
  "users",
  "settings",
  "notifications",
  "ai",
  "system"
] as const;

export const AUDIT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "blocked"
] as const;
