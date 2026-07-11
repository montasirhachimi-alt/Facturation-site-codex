import { CORE_MODULE_ICONS } from "../constants";
import type { CorePermissionAction, CorePermissionRequirement } from "../types";
import type { CoreModuleDefinition, CoreModuleId } from "../registry/types";

const standardPermissions = (module: string): CorePermissionRequirement[] => {
  const actions: CorePermissionAction[] = ["view", "create", "edit", "delete", "export", "print"];

  return actions.map((action) => ({ module, action }));
};

const defineModule = (
  definition: Omit<CoreModuleDefinition, "enabled" | "permissions"> & {
    permissionModule: string;
    permissions?: CorePermissionRequirement[];
  }
): CoreModuleDefinition => {
  const { permissionModule, permissions, ...rest } = definition;

  return {
    ...rest,
    enabled: true,
    permissions: permissions ?? standardPermissions(permissionModule)
  };
};

export const coreModuleDefinitions: CoreModuleDefinition[] = [
  defineModule({
    id: "dashboard",
    name: "Dashboard",
    category: "home",
    icon: CORE_MODULE_ICONS.dashboard,
    route: "/dashboard",
    permissionModule: "dashboard",
    aliases: ["home", "pilot center", "command center", "tableau de bord"],
    searchable: true,
    favorite: true,
    widgets: [
      { id: "business_health", area: "dashboard", defaultEnabled: true },
      { id: "quick_actions", area: "dashboard", defaultEnabled: true },
      { id: "smart_insights", area: "dashboard", defaultEnabled: true },
      { id: "kpi_cards", area: "dashboard", defaultEnabled: true }
    ],
    description: "Executive control center for daily business decisions."
  }),
  defineModule({
    id: "clients",
    name: "Sociétés",
    category: "business",
    icon: CORE_MODULE_ICONS.clients,
    route: "/crm/companies",
    permissionModule: "clients",
    aliases: ["sociétés", "societes", "companies", "comptes", "clients", "customers", "crm"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "suppliers",
    name: "Suppliers",
    category: "business",
    icon: CORE_MODULE_ICONS.suppliers,
    route: "/fournisseurs",
    permissionModule: "suppliers",
    aliases: ["vendors", "suppliers", "supplier"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "products",
    name: "Products",
    category: "business",
    icon: CORE_MODULE_ICONS.products,
    route: "/stock",
    permissionModule: "stock",
    aliases: ["stock", "inventory", "catalog", "products", "produits"],
    searchable: true,
    favorite: true,
    widgets: [{ id: "stock_alerts", area: "dashboard", defaultEnabled: true }]
  }),
  defineModule({
    id: "documents",
    name: "Documents",
    category: "sales",
    icon: CORE_MODULE_ICONS.documents,
    route: "/ventes",
    permissionModule: "quotes",
    aliases: ["sales", "commercial documents", "documents commerciaux"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "quotes",
    name: "Quotes",
    category: "sales",
    icon: CORE_MODULE_ICONS.quotes,
    route: "/devis",
    permissionModule: "quotes",
    aliases: ["quotes", "estimate", "proposal"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "invoices",
    name: "Invoices",
    category: "sales",
    icon: CORE_MODULE_ICONS.invoices,
    route: "/factures",
    permissionModule: "invoices",
    aliases: ["invoice", "billing", "facturation"],
    searchable: true,
    favorite: true,
    widgets: [{ id: "overdue_invoices", area: "dashboard", defaultEnabled: true }]
  }),
  defineModule({
    id: "delivery_notes",
    name: "Delivery Notes",
    category: "sales",
    icon: CORE_MODULE_ICONS.delivery_notes,
    route: "/livraisons",
    permissionModule: "delivery_notes",
    aliases: ["delivery", "shipping", "bl", "bons de livraison"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "purchases",
    name: "Purchases",
    category: "finance",
    icon: CORE_MODULE_ICONS.purchases,
    route: "/achats",
    permissionModule: "purchases",
    aliases: ["purchase", "buying", "factures achat"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "cash",
    name: "Cash",
    category: "finance",
    icon: CORE_MODULE_ICONS.cash,
    route: "/caisse",
    permissionModule: "cash",
    aliases: ["cash desk", "treasury", "trésorerie"],
    searchable: true,
    favorite: true,
    widgets: [{ id: "cash_balance", area: "dashboard", defaultEnabled: true }]
  }),
  defineModule({
    id: "payments",
    name: "Payments",
    category: "finance",
    icon: CORE_MODULE_ICONS.payments,
    route: "/paiements",
    permissionModule: "payments",
    aliases: ["payment tracking", "receivables", "suivi paiements"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "employees",
    name: "Employees",
    category: "people",
    icon: CORE_MODULE_ICONS.employees,
    route: "/rh/employes",
    permissionModule: "hr",
    aliases: ["staff", "employees", "rh"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "contracts",
    name: "Contracts",
    category: "people",
    icon: CORE_MODULE_ICONS.contracts,
    route: "/rh/contrats",
    permissionModule: "hr",
    aliases: ["contracts", "employment contracts", "contrats rh"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "attendance",
    name: "Attendance",
    category: "people",
    icon: CORE_MODULE_ICONS.attendance,
    route: "/rh/presences",
    permissionModule: "hr",
    aliases: ["attendance", "time tracking", "pointage"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "absences",
    name: "Absences",
    category: "people",
    icon: CORE_MODULE_ICONS.absences,
    route: "/rh/absences",
    permissionModule: "hr",
    aliases: ["absence", "absences rh"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "leaves",
    name: "Leaves",
    category: "people",
    icon: CORE_MODULE_ICONS.leaves,
    route: "/rh/conges",
    permissionModule: "hr",
    aliases: ["leave", "vacation", "congés"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "payroll",
    name: "Payroll",
    category: "people",
    icon: CORE_MODULE_ICONS.payroll,
    route: "/rh/salaires",
    permissionModule: "hr",
    aliases: ["salary", "payslip", "paie"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "advances",
    name: "Advances",
    category: "people",
    icon: CORE_MODULE_ICONS.advances,
    route: "/rh/avances",
    permissionModule: "hr",
    aliases: ["salary advances", "advance"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "hr_documents",
    name: "HR Documents",
    category: "people",
    icon: CORE_MODULE_ICONS.hr_documents,
    route: "/rh/documents",
    permissionModule: "hr",
    aliases: ["hr documents", "documents ressources humaines"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "reports",
    name: "Reports",
    category: "analytics",
    icon: CORE_MODULE_ICONS.reports,
    route: "/rapports",
    permissionModule: "reports",
    aliases: ["reports", "analytics", "reporting"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "statistics",
    name: "Statistics",
    category: "analytics",
    icon: CORE_MODULE_ICONS.statistics,
    route: "/statistiques",
    permissionModule: "reports",
    aliases: ["stats", "statistics", "analytics"],
    searchable: true,
    favorite: true,
    widgets: [{ id: "financial_statistics", area: "dashboard", defaultEnabled: true }]
  }),
  defineModule({
    id: "pdf",
    name: "PDF",
    category: "analytics",
    icon: CORE_MODULE_ICONS.pdf,
    route: "/pdf",
    permissionModule: "pdf_documents",
    aliases: ["pdf documents", "print", "exports"],
    searchable: true,
    favorite: true,
    widgets: []
  }),
  defineModule({
    id: "ai_assistant",
    name: "AI Assistant",
    category: "ai",
    icon: CORE_MODULE_ICONS.ai_assistant,
    route: "/assistant-ia",
    permissionModule: "assistant",
    aliases: ["ai", "assistant", "copilot", "intelligence artificielle"],
    searchable: true,
    favorite: true,
    widgets: [{ id: "ai_assistant", area: "dashboard", defaultEnabled: true }]
  }),
  defineModule({
    id: "settings",
    name: "Settings",
    category: "system",
    icon: CORE_MODULE_ICONS.settings,
    route: "/parametres",
    permissionModule: "settings",
    aliases: ["settings", "configuration", "preferences"],
    searchable: true,
    favorite: false,
    widgets: []
  }),
  defineModule({
    id: "users",
    name: "Users",
    category: "system",
    icon: CORE_MODULE_ICONS.users,
    route: "/utilisateurs",
    permissionModule: "users",
    aliases: ["users", "roles", "permissions"],
    searchable: true,
    favorite: false,
    widgets: []
  })
];

export const coreModuleIds = coreModuleDefinitions.map((definition) => definition.id) as CoreModuleId[];
