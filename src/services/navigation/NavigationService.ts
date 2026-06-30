import { getModule, getModules } from "@/core/registry";
import type { CoreModuleCategory } from "@/core/constants";
import type { CoreModuleId } from "@/core/registry";

export type NavigationTarget = {
  type: "module" | "workspace" | "dashboard" | "settings" | "history";
  route?: string;
  moduleId?: CoreModuleId;
  workspaceId?: string;
};

export class NavigationService {
  getNavigationItems() {
    return getModules().filter((moduleDefinition) => moduleDefinition.enabled);
  }

  getNavigationByCategory(category: CoreModuleCategory) {
    return this.getNavigationItems().filter((moduleDefinition) => moduleDefinition.category === category);
  }

  getNavigationItemByRoute(route: string) {
    return this.getNavigationItems().find((moduleDefinition) => moduleDefinition.route === route);
  }

  openModule(moduleId: CoreModuleId): NavigationTarget | undefined {
    const moduleDefinition = getModule(moduleId);
    if (!moduleDefinition) return undefined;

    return {
      type: "module",
      moduleId: moduleDefinition.id,
      route: moduleDefinition.route
    };
  }

  openWorkspace(workspaceId: string): NavigationTarget {
    return {
      type: "workspace",
      workspaceId
    };
  }

  goBack(): NavigationTarget {
    return { type: "history", route: "back" };
  }

  goForward(): NavigationTarget {
    return { type: "history", route: "forward" };
  }

  openDashboard(): NavigationTarget | undefined {
    return this.openModule("dashboard");
  }

  openSettings(): NavigationTarget | undefined {
    return this.openModule("settings");
  }
}
