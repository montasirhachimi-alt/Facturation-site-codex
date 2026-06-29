export const CORE_MODULE_CATEGORIES = [
  "home",
  "business",
  "sales",
  "finance",
  "people",
  "analytics",
  "ai",
  "system"
] as const;

export type CoreModuleCategory = (typeof CORE_MODULE_CATEGORIES)[number];
