import type { CoreModuleCategory } from "@/core/constants";
import type { CoreModuleId } from "@/core/registry";
import { crmNavigation } from "@/modules/crm/crm.navigation";
import type { CrmNavigationItem } from "@/modules/crm/crm.types";
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
  home: "Accueil",
  business: "Activité",
  sales: "Ventes",
  finance: "Finance",
  people: "Équipe",
  analytics: "Analyse",
  ai: "AI",
  system: "Système"
};

const crmSidebarItemOverrides: Partial<Record<string, Partial<SidebarNavigationItem>>> = {
  crm: {
    icon: "ContactRound",
    activePaths: ["/crm"]
  },
  "crm.companies": {
    icon: "Building2",
    activePaths: ["/crm/companies"]
  },
  "crm.customers": {
    icon: "Users",
    activePaths: ["/clients"]
  },
  "crm.opportunities": {
    icon: "HandCoins",
    activePaths: ["/crm/opportunities"]
  },
  "crm.contacts": {
    icon: "ContactRound",
    badge: "via société",
    activePaths: []
  },
  "crm.activities": {
    label: "Activités / Timeline",
    icon: "ClipboardList",
    badge: "via société",
    activePaths: []
  },
  "crm.meetings": {
    icon: "CalendarCheck",
    badge: "via contact",
    activePaths: []
  },
  "crm.tasks": {
    icon: "ScrollText",
    badge: "via contact",
    activePaths: []
  },
  "crm.notes": {
    icon: "FileText",
    badge: "via contact",
    activePaths: []
  }
};

const crmSidebarOrder = [
  "crm",
  "crm.companies",
  "crm.customers",
  "crm.opportunities",
  "crm.contacts",
  "crm.activities",
  "crm.meetings",
  "crm.tasks",
  "crm.notes"
];

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
  dashboard: "Tableau de bord",
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

function mapCrmNavigationItem(item: CrmNavigationItem): SidebarNavigationItem {
  const override = crmSidebarItemOverrides[item.id] ?? {};

  return {
    id: item.id,
    href: item.route,
    label: item.label,
    icon: "FileText",
    module: "clients",
    activePaths: [item.route],
    ...override
  };
}

function getCrmSidebarGroup(): SidebarNavigationGroup {
  const crmItems: readonly CrmNavigationItem[] = [crmNavigation, ...(crmNavigation.children ?? [])];
  const orderedItems = crmSidebarOrder
    .map((id) => crmItems.find((item) => item.id === id))
    .filter((item): item is CrmNavigationItem => Boolean(item));

  return {
    label: crmNavigation.label,
    category: "business",
    items: orderedItems.map(mapCrmNavigationItem)
  };
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
    getCrmSidebarGroup(),
    ...registryGroups.slice(1)
  ];
}
