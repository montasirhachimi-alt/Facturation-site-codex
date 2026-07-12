import type { HicoPilotWorkspace } from "./workspace.types";

const now = "2026-06-30T09:00:00.000Z";

export const demoWorkspaces: HicoPilotWorkspace[] = [
  {
    id: "workspace-main",
    name: "Executive Workspace",
    description: "Daily command center for business owners and administrators.",
    type: "executive",
    ownerId: "user-admin",
    companyId: "company-hicotech",
    defaultRoute: "/dashboard",
    modules: ["dashboard", "clients", "quotes", "invoices", "payments", "settings"],
    widgets: [
      "widget-business-health",
      "widget-quick-actions",
      "widget-smart-insights",
      "widget-todays-priorities",
      "widget-recent-activity",
      "widget-my-tasks",
      "widget-system-status",
      "widget-calendar",
      "widget-executive-summary"
    ],
    preferences: ["theme", "language", "sidebarCollapsed", "dashboardLayout"],
    favorites: ["dashboard", "Executive Workspace", "Paiements"],
    recentItems: ["Executive Workspace", "Finance Dashboard"],
    createdAt: "2026-06-29T08:00:00.000Z",
    updatedAt: now,
    metadata: { default: true, audience: "owner" }
  },
  {
    id: "workspace-finance",
    name: "Finance Workspace",
    description: "Cash, payments, purchases, invoices and financial monitoring.",
    type: "finance",
    ownerId: "user-admin",
    companyId: "company-hicotech",
    defaultRoute: "/sales/payments",
    modules: ["payments", "invoices", "quotes"],
    widgets: [
      "widget-cash-balance",
      "widget-payments-received",
      "widget-invoices-late",
      "widget-financial-distribution",
      "widget-sales-evolution"
    ],
    preferences: ["defaultCurrency", "showOverdueInvoices", "financeWidgetOrder", "printFormat", "showCompanyStamp"],
    favorites: ["Paiements", "Factures", "Devis"],
    recentItems: ["Finance Dashboard", "Invoice F-2026-154"],
    createdAt: "2026-06-29T08:05:00.000Z",
    updatedAt: now,
    metadata: { audience: "finance" }
  },
  {
    id: "workspace-sales",
    name: "Sales Workspace",
    description: "Clients, quotes, invoices and delivery follow-up.",
    type: "sales",
    ownerId: "user-admin",
    companyId: "company-hicotech",
    defaultRoute: "/sales/quotes",
    modules: ["clients", "quotes", "invoices", "payments"],
    widgets: ["widget-quick-actions", "widget-top-clients", "widget-sales-evolution", "widget-invoices-late"],
    preferences: ["salesWidgetOrder", "defaultSalesModule"],
    favorites: ["Sociétés", "Factures", "ABC SARL", "Recherche sociétés"],
    recentItems: ["ABC SARL", "Invoice F-2026-154", "Recherche sociétés"],
    createdAt: "2026-06-29T08:10:00.000Z",
    updatedAt: now,
    metadata: { audience: "sales" }
  },
  {
    id: "workspace-system",
    name: "System Workspace",
    description: "Administration, settings, users and operational governance.",
    type: "system",
    ownerId: "user-admin",
    companyId: "company-hicotech",
    defaultRoute: "/parametres",
    modules: ["settings"],
    widgets: ["widget-system-status", "widget-security-health", "widget-audit-overview"],
    preferences: ["securityAlertsVisible"],
    favorites: ["Notifications", "Audit Logs"],
    recentItems: ["Notification Center"],
    createdAt: "2026-06-29T08:30:00.000Z",
    updatedAt: now,
    metadata: { audience: "admin" }
  }
];
