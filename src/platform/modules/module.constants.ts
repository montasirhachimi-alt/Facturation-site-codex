export const MODULE_CATEGORIES = [
  "core",
  "crm",
  "sales",
  "inventory",
  "purchasing",
  "finance",
  "hr",
  "platform",
  "ai"
] as const;

export const MODULE_STATUSES = [
  "stable",
  "alpha",
  "preview",
  "hidden",
  "planned",
  "deprecated"
] as const;

export const MODULE_VALIDATION_SEVERITIES = ["error", "warning"] as const;
