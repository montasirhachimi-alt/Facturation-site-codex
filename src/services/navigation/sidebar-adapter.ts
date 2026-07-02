import type { CoreModuleCategory } from "@/core/constants";
import type { CoreModuleId } from "@/core/registry";
import { NavigationService } from "./NavigationService";

export type SidebarNavigationItem = {
  id: CoreModuleId;
  href: string;
  label: string;
  icon: string;
  module: string;
  badge?: string;
  activePaths?: string[];
};

export type SidebarNavigationGroup = {
  label: string;
  category: CoreModuleCategory;
  items: SidebarNavigationItem[];
};

const sidebarCategoryOrder: CoreModuleCategory[] = [
  "home",
  "business",
  "sales",
  "finance",
  "people",
  "analytics",
  "ai",
  "system"
];

const sidebarGroupLabels: Record<CoreModuleCategory, string> = {
  home: "Home",
  business: "Business",
  sales: "Sales",
  finance: "Finance",
  people: "People",
  analytics: "Analytics",
  ai: "AI",
  system: "System"
};

const crmSidebarGroup: SidebarNavigationGroup = {
  label: "CRM",
  category: "business",
  items: [
    {
      id: "crm",
      href: "/crm",
      label: "CRM",
      icon: "ContactRound",
      module: "clients",
      activePaths: ["/crm"]
    },
    {
      id: "crm.companies",
      href: "/crm/companies",
      label: "Companies",
      icon: "Building2",
      module: "clients",
      activePaths: ["/crm/companies"]
    },
    {
      id: "crm.customers",
      href: "/clients",
      label: "Customers",
      icon: "Users",
      module: "clients",
      activePaths: ["/clients"]
    },
    {
      id: "crm.contacts",
      href: "/crm/companies",
      label: "Contacts",
      icon: "ContactRound",
      module: "clients",
      badge: "via société",
      activePaths: []
    },
    {
      id: "crm.activities",
      href: "/crm/companies",
      label: "Activities / Timeline",
      icon: "ClipboardList",
      module: "clients",
      badge: "via société",
      activePaths: []
    },
    {
      id: "crm.meetings",
      href: "/crm/companies",
      label: "Meetings",
      icon: "CalendarCheck",
      module: "clients",
      badge: "via contact",
      activePaths: []
    },
    {
      id: "crm.tasks",
      href: "/crm/companies",
      label: "Tasks",
      icon: "ScrollText",
      module: "clients",
      badge: "via contact",
      activePaths: []
    },
    {
      id: "crm.notes",
      href: "/crm/companies",
      label: "Notes",
      icon: "FileText",
      module: "clients",
      badge: "via contact",
      activePaths: []
    }
  ]
};

const sidebarModuleOrder: Partial<Record<CoreModuleCategory, CoreModuleId[]>> = {
  home: ["dashboard"],
  business: ["clients", "suppliers", "products"],
  sales: ["documents", "quotes", "invoices", "delivery_notes"],
  finance: ["purchases", "cash", "payments"],
  people: ["employees", "contracts", "attendance", "absences", "leaves", "payroll", "advances", "hr_documents"],
  analytics: ["statistics", "reports", "pdf"],
  ai: ["ai_assistant"],
  system: ["users", "settings"]
};

const sidebarLabels: Partial<Record<CoreModuleId, string>> = {
  dashboard: "Dashboard",
  clients: "Clients",
  suppliers: "Fournisseurs",
  products: "Produits & stock",
  documents: "Documents",
  quotes: "Devis",
  invoices: "Factures",
  delivery_notes: "Bons de livraison",
  purchases: "Achats",
  cash: "Caisse",
  payments: "Suivi paiements",
  employees: "Employés",
  contracts: "Contrats",
  attendance: "Présences",
  absences: "Absences",
  leaves: "Congés",
  payroll: "Salaires",
  advances: "Avances",
  hr_documents: "Documents RH",
  statistics: "Statistiques",
  reports: "Rapports",
  pdf: "Documents PDF",
  ai_assistant: "Assistant IA",
  users: "Utilisateurs",
  settings: "Paramètres"
};

function getPermissionModule(item: ReturnType<NavigationService["getNavigationItems"]>[number]) {
  return item.permissions.find((permission) => permission.action === "view")?.module ?? item.id;
}

export function getSidebarGroups(navigationService = new NavigationService()): SidebarNavigationGroup[] {
  const navigationItems = navigationService.getNavigationItems();

  const registryGroups = sidebarCategoryOrder
    .map((category) => {
      const order = sidebarModuleOrder[category] ?? [];
      const items = order
        .map((moduleId) => navigationItems.find((item) => item.id === moduleId))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item) => ({
          id: item.id,
          href: item.route,
          label: sidebarLabels[item.id] ?? item.name,
          icon: item.icon,
          module: getPermissionModule(item)
        }));

      return {
        label: sidebarGroupLabels[category],
        category,
        items
      };
    })
    .filter((group) => group.items.length > 0);

  return [
    ...registryGroups.slice(0, 1),
    crmSidebarGroup,
    ...registryGroups.slice(1)
  ];
}
