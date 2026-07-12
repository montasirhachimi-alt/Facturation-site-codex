import type { CoreModuleCategory } from "@/core/constants";
import type { CoreModuleId } from "@/core/registry";
import { getBusinessModules } from "@/modules/business-modules";
import { NavigationService } from "./NavigationService";

type SidebarCategory = CoreModuleCategory | "stock";

export type SidebarNavigationItem = {
  id: CoreModuleId;
  href: string;
  label: string;
  icon: string;
  module: string;
  activePaths?: string[];
  helper?: string;
};

export type SidebarNavigationGroup = {
  label: string;
  category: SidebarCategory;
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

const legacySidebarGroups: readonly Readonly<{
  label: string;
  category: SidebarCategory;
  modules: readonly CoreModuleId[];
}>[] = [
  {
    label: "Accueil",
    category: "home",
    modules: ["dashboard"]
  },
  {
    label: "Système",
    category: "system",
    modules: ["settings"]
  }
];

const legacySidebarLabels: Partial<Record<CoreModuleId, string>> = {
  dashboard: "Tableau de bord",
  products: "Produits & stock",
  cash: "Caisse",
  payments: "Suivi paiements",
  purchases: "Achats",
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

function getModuleCategory(moduleId: string): SidebarCategory {
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
    label: getMetadataString(item.metadata, "sidebarLabel", item.label),
    icon: getMetadataString(item.metadata, "icon", "FileText"),
    module: getMetadataString(item.metadata, "permissionModule", item.id),
    activePaths: getActivePaths(item),
    helper: getMetadataString(item.metadata, "helper", "")
  };
}

function getBusinessModuleItems(moduleNavigation: ModuleNavigationItem) {
  const includeRoot = moduleNavigation.metadata?.sidebarRoot === true;
  const items = includeRoot ? [moduleNavigation, ...(moduleNavigation.children ?? [])] : moduleNavigation.children ?? [];

  return items.map(mapBusinessNavigationItem);
}

function getBusinessModuleSidebarGroups(): SidebarNavigationGroup[] {
  return getBusinessModules()
    .map((moduleDefinition) => ({
      label: moduleDefinition.navigation.label,
      category: getModuleCategory(moduleDefinition.id),
      items: getBusinessModuleItems(moduleDefinition.navigation)
    }))
    .filter((group) => group.items.length > 0);
}

export function getSidebarGroups(navigationService = new NavigationService()): SidebarNavigationGroup[] {
  const navigationItems = navigationService.getNavigationItems();

  const registryGroups = legacySidebarGroups
    .map((legacyGroup) => {
      const items = legacyGroup.modules
        .map((moduleId) => navigationItems.find((item) => item.id === moduleId))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item) => ({
          id: item.id,
          href: item.route,
          label: legacySidebarLabels[item.id] ?? item.name,
          icon: item.icon,
          module: getPermissionModule(item)
        }));

      return {
        label: legacyGroup.label,
        category: legacyGroup.category,
        items
      };
    })
    .filter((group) => group.items.length > 0);

  const [homeGroup, ...remainingRegistryGroups] = registryGroups;

  return [homeGroup, ...getBusinessModuleSidebarGroups(), ...remainingRegistryGroups].filter(
    (group): group is SidebarNavigationGroup => Boolean(group)
  );
}
