import { setPreference } from "./preferences.registry";
import type { PreferenceInput } from "./preferences.types";

export const demoPreferences: PreferenceInput[] = [
  {
    userId: "user-admin",
    workspaceId: "workspace-main",
    key: "theme",
    value: "dark",
    type: "enum",
    category: "appearance",
    scope: "user",
    metadata: { source: "admin profile" }
  },
  {
    userId: "user-admin",
    workspaceId: "workspace-main",
    key: "language",
    value: "fr",
    type: "enum",
    category: "language",
    scope: "user"
  },
  {
    userId: "user-admin",
    workspaceId: "workspace-main",
    key: "sidebarCollapsed",
    value: false,
    type: "boolean",
    category: "sidebar",
    scope: "user"
  },
  {
    userId: "user-admin",
    workspaceId: "workspace-main",
    key: "dashboardLayout",
    value: ["executive-summary", "business-health", "smart-insights", "priorities"],
    type: "array",
    category: "dashboard",
    scope: "workspace",
    moduleId: "dashboard"
  },
  {
    workspaceId: "workspace-finance",
    key: "defaultCurrency",
    value: "MAD",
    type: "enum",
    category: "system",
    scope: "workspace",
    moduleId: "cash"
  },
  {
    workspaceId: "workspace-finance",
    key: "showOverdueInvoices",
    value: true,
    type: "boolean",
    category: "dashboard",
    scope: "workspace",
    moduleId: "invoices"
  },
  {
    workspaceId: "workspace-finance",
    key: "financeWidgetOrder",
    value: ["cash-balance", "payments-received", "invoices-late"],
    type: "array",
    category: "widgets",
    scope: "workspace",
    moduleId: "dashboard"
  },
  {
    workspaceId: "workspace-sales",
    key: "salesWidgetOrder",
    value: ["quick-actions", "top-clients", "sales-evolution"],
    type: "array",
    category: "widgets",
    scope: "workspace",
    moduleId: "dashboard"
  },
  {
    workspaceId: "workspace-sales",
    key: "defaultSalesModule",
    value: "quotes",
    type: "enum",
    category: "commands",
    scope: "workspace",
    moduleId: "quotes"
  },
  {
    userId: "user-admin",
    key: "notificationCategories",
    value: ["finance", "stock", "security", "ai"],
    type: "array",
    category: "notifications",
    scope: "user"
  },
  {
    userId: "user-admin",
    key: "notificationPriorityThreshold",
    value: "normal",
    type: "enum",
    category: "notifications",
    scope: "user"
  },
  {
    userId: "user-admin",
    key: "aiRecommendationsEnabled",
    value: true,
    type: "boolean",
    category: "ai",
    scope: "user",
    moduleId: "ai_assistant"
  },
  {
    userId: "user-admin",
    key: "aiTone",
    value: "professional",
    type: "enum",
    category: "ai",
    scope: "user",
    moduleId: "ai_assistant"
  },
  {
    userId: "user-admin",
    key: "tableDensity",
    value: "compact",
    type: "enum",
    category: "tables",
    scope: "user"
  },
  {
    userId: "user-admin",
    key: "productsTableColumns",
    value: ["reference", "designation", "stock", "price", "status"],
    type: "array",
    category: "tables",
    scope: "user",
    moduleId: "products"
  },
  {
    workspaceId: "workspace-finance",
    key: "printFormat",
    value: "A4",
    type: "enum",
    category: "printing",
    scope: "workspace",
    moduleId: "pdf"
  },
  {
    workspaceId: "workspace-finance",
    key: "showCompanyStamp",
    value: true,
    type: "boolean",
    category: "printing",
    scope: "workspace",
    moduleId: "pdf"
  },
  {
    userId: "user-admin",
    key: "searchShortcut",
    value: "CtrlOrCommand+K",
    type: "string",
    category: "search",
    scope: "user"
  },
  {
    userId: "user-admin",
    key: "commandPaletteRecentLimit",
    value: 8,
    type: "number",
    category: "commands",
    scope: "user"
  },
  {
    workspaceId: "workspace-main",
    key: "securityAlertsVisible",
    value: true,
    type: "boolean",
    category: "security",
    scope: "workspace",
    moduleId: "users"
  }
];

demoPreferences.forEach(setPreference);
