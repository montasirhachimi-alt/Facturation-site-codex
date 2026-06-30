import type { CoreModuleCategory } from "@/core/constants";
import type { CoreModuleId } from "@/core/registry";
import { NavigationService } from "./NavigationService";

export type SidebarNavigationItem = {
  id: CoreModuleId;
  href: string;
  label: string;
  icon: string;
  module: string;
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

  return sidebarCategoryOrder
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
}
