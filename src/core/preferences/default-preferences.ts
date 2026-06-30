import { registerDefaultPreference } from "./preferences.registry";
import type { PreferenceInput } from "./preferences.types";

export const defaultPreferences: PreferenceInput[] = [
  { key: "theme", value: "system", type: "enum", category: "appearance", scope: "system" },
  { key: "language", value: "fr", type: "enum", category: "language", scope: "system" },
  { key: "sidebarCollapsed", value: false, type: "boolean", category: "sidebar", scope: "user" },
  { key: "dashboardDensity", value: "comfortable", type: "enum", category: "dashboard", scope: "user", moduleId: "dashboard" },
  { key: "defaultCurrency", value: "MAD", type: "enum", category: "system", scope: "company" },
  { key: "dateFormat", value: "DD/MM/YYYY", type: "string", category: "system", scope: "company" },
  { key: "timeZone", value: "Africa/Casablanca", type: "string", category: "system", scope: "company" },
  { key: "notificationsEnabled", value: true, type: "boolean", category: "notifications", scope: "user" },
  { key: "aiAssistantEnabled", value: true, type: "boolean", category: "ai", scope: "user", moduleId: "ai_assistant" },
  { key: "searchShortcut", value: "CtrlOrCommand+K", type: "string", category: "search", scope: "user" },
  { key: "tableDensity", value: "comfortable", type: "enum", category: "tables", scope: "user" },
  { key: "printFormat", value: "A4", type: "enum", category: "printing", scope: "company", moduleId: "pdf" }
];

defaultPreferences.forEach(registerDefaultPreference);
