import type { CoreModuleCategory } from "@/core/constants";
import type { CoreModuleId } from "@/core/registry";
import { getBusinessModules } from "@/modules/business-modules";
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

type ModuleNavigationItem = Readonly<{
  id: string;
  label: string;
  route: string;
  permission: string;
  children?: readonly ModuleNavigationItem[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
}>;

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

function getMetadataString(
  metadata: ModuleNavigationItem["metadata"] | undefined,
  key: string,
  fallback: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function getMetadataBadge(metadata: ModuleNavigationItem["metadata"] | undefined) {
  const value = metadata?.badge;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getModuleCategory(moduleId: string): CoreModuleCategory {
  if (moduleId === "crm") {
    return "business";
  }

  if (moduleId === "sales") {
    return "sales";
  }

  return "business";
}

function getActivePaths(item: ModuleNavigationItem) {
  const activePath = item.metadata?.activePath;
  const isContextual = item.metadata?.contextual === true;

  if (typeof activePath === "string" && activePath.length > 0) {
    return [activePath];
  }

  return isContextual ? [] : [item.route];
}

function mapBusinessNavigationItem(item: ModuleNavigationItem): SidebarNavigationItem {
  return {
    id: item.id,
    href: item.route,
    label: item.label,
    icon: getMetadataString(item.metadata, "icon", "FileText"),
    module: getMetadataString(item.metadata, "permissionModule", item.id),
    badge: getMetadataBadge(item.metadata),
    activePaths: getActivePaths(item)
  };
}

function getBusinessModuleSidebarGroups(): SidebarNavigationGroup[] {
  return getBusinessModules()
    .map((moduleDefinition) => ({
      label: moduleDefinition.navigation.label,
      category: getModuleCategory(moduleDefinition.id),
      items: (moduleDefinition.navigation.children ?? []).map(mapBusinessNavigationItem)
    }))
    .filter((group) => group.items.length > 0);
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
    ...getBusinessModuleSidebarGroups(),
    ...registryGroups.slice(1).filter((group) => group.category !== "sales")
  ];
}
