export const PREFERENCE_TYPES = [
  "string",
  "number",
  "boolean",
  "json",
  "array",
  "date",
  "enum"
] as const;

export const PREFERENCE_CATEGORIES = [
  "appearance",
  "language",
  "dashboard",
  "sidebar",
  "widgets",
  "tables",
  "notifications",
  "ai",
  "search",
  "commands",
  "printing",
  "security",
  "system"
] as const;

export const PREFERENCE_SCOPES = [
  "user",
  "workspace",
  "company",
  "system"
] as const;
