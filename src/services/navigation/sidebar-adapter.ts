import type { CoreModuleCategory } from "@/core/constants";
import type { CoreModuleId } from "@/core/registry";
import { getCurrentAlphaActivation } from "@/platform/modules/module-activation.current";
import { getActiveModuleNavigationGroups } from "@/platform/modules/module-navigation";
import type { ModuleId } from "@/platform/modules/module.types";
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

const sidebarCategoryByGroup: Record<string, SidebarCategory> = {
  Accueil: "home",
  CRM: "business",
  Ventes: "sales",
  Système: "system"
};

const permissionModuleByActiveModule: Partial<Record<ModuleId, string>> = {
  "core.dashboard": "dashboard",
  "core.settings": "settings",
  "crm.overview": "clients",
  "crm.companies": "clients",
  "crm.contacts": "clients",
  "crm.meetings": "clients",
  "crm.tasks": "clients",
  "crm.notes": "clients",
  "sales.quotes": "quotes",
  "sales.invoices": "invoices",
  "sales.payments": "payments"
};

export function getSidebarGroups(navigationService = new NavigationService()): SidebarNavigationGroup[] {
  void navigationService;

  const activation = getCurrentAlphaActivation();

  return getActiveModuleNavigationGroups(activation).map((group) => ({
    label: group.label,
    category: sidebarCategoryByGroup[group.label] ?? "business",
    items: group.items.map((item) => ({
      id: item.moduleId,
      href: item.href,
      label: item.label,
      icon: item.iconKey,
      module: permissionModuleByActiveModule[item.moduleId] ?? "dashboard",
      activePaths: [item.href],
      helper: ""
    }))
  }));
}
