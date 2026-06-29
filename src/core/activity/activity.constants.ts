export const ACTIVITY_TYPES = [
  "created",
  "updated",
  "deleted",
  "payment",
  "warning",
  "success",
  "error",
  "login",
  "logout",
  "backup",
  "security",
  "ai",
  "system"
] as const;

export const ACTIVITY_SEVERITIES = [
  "low",
  "normal",
  "high",
  "critical"
] as const;

export const ACTIVITY_CATEGORIES = [
  "sales",
  "finance",
  "stock",
  "crm",
  "hr",
  "system",
  "security",
  "ai",
  "administration"
] as const;
