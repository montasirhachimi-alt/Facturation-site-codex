import { getModule, getModules } from "@/core/registry";
import type { CoreModuleDefinition } from "@/core/registry";
import { ActivityService } from "@/services/activity";
import { FavoritesService } from "@/services/favorites";
import { NavigationService } from "@/services/navigation";
import { NotificationService } from "@/services/notifications";
import { PreferencesService } from "@/services/preferences";
import { RecentItemsService } from "@/services/recent";
import { WidgetsService } from "@/services/widgets";
import { demoWorkspaces } from "./demo-workspaces";
import type { HicoPilotWorkspace, WorkspaceLayoutSnapshot, WorkspaceSnapshot, WorkspaceType } from "./workspace.types";

export class WorkspaceService {
  private activeWorkspaceId = demoWorkspaces[0]?.id ?? "workspace-main";
  private readonly activityService = new ActivityService();
  private readonly favoritesService = new FavoritesService();
  private readonly navigationService = new NavigationService();
  private readonly notificationService = new NotificationService();
  private readonly preferencesService = new PreferencesService();
  private readonly recentItemsService = new RecentItemsService();
  private readonly widgetsService = new WidgetsService();

  getWorkspace(workspaceId: string) {
    return demoWorkspaces.find((workspace) => workspace.id === workspaceId);
  }

  getWorkspaces() {
    return [...demoWorkspaces];
  }

  getDefaultWorkspace() {
    return this.getWorkspace(this.activeWorkspaceId) ?? demoWorkspaces[0];
  }

  getWorkspaceByType(type: WorkspaceType) {
    return demoWorkspaces.find((workspace) => workspace.type === type);
  }

  getWorkspaceModules(workspaceId: string) {
    const workspace = this.resolveWorkspace(workspaceId);
    return workspace.modules
      .map((moduleId) => getModule(moduleId))
      .filter((moduleDefinition): moduleDefinition is CoreModuleDefinition => Boolean(moduleDefinition));
  }

  getWorkspaceWidgets(workspaceId: string) {
    const workspace = this.resolveWorkspace(workspaceId);
    const moduleIds = new Set(workspace.modules);
    const widgetIds = new Set(workspace.widgets);

    return this.widgetsService
      .loadWidgets()
      .filter((widget) => widgetIds.has(widget.id) || (widget.moduleId ? moduleIds.has(widget.moduleId) : false));
  }

  getWorkspacePreferences(workspaceId: string) {
    return this.preferencesService.loadPreferences().filter((preference) => preference.workspaceId === workspaceId);
  }

  getWorkspaceFavorites(workspaceId: string) {
    const workspace = this.resolveWorkspace(workspaceId);
    const moduleIds = new Set(workspace.modules);
    const favoriteKeys = new Set(workspace.favorites.map((favorite) => favorite.toLowerCase()));

    return this.favoritesService.getAll().filter((favorite) => {
      const matchesWorkspaceModule = favorite.moduleId ? moduleIds.has(favorite.moduleId) : false;
      const matchesWorkspaceList = [favorite.id, favorite.targetId, favorite.title]
        .filter(Boolean)
        .some((value) => favoriteKeys.has(value.toLowerCase()));

      return matchesWorkspaceModule || matchesWorkspaceList;
    });
  }

  getWorkspaceRecentItems(workspaceId: string) {
    const workspace = this.resolveWorkspace(workspaceId);
    const moduleIds = new Set(workspace.modules);
    const recentKeys = new Set(workspace.recentItems.map((recentItem) => recentItem.toLowerCase()));

    return this.recentItemsService.getAll().filter((recentItem) => {
      const matchesWorkspaceModule = recentItem.moduleId ? moduleIds.has(recentItem.moduleId) : false;
      const matchesWorkspaceList = [recentItem.id, recentItem.targetId, recentItem.title]
        .filter(Boolean)
        .some((value) => recentKeys.has(value.toLowerCase()));

      return matchesWorkspaceModule || matchesWorkspaceList;
    });
  }

  getWorkspaceSnapshot(workspaceId: string): WorkspaceSnapshot {
    const workspace = this.resolveWorkspace(workspaceId);
    const moduleIds = new Set(workspace.modules);

    return {
      workspace,
      modules: this.getWorkspaceModules(workspace.id),
      widgets: this.getWorkspaceWidgets(workspace.id),
      preferences: this.getWorkspacePreferences(workspace.id),
      favorites: this.getWorkspaceFavorites(workspace.id),
      recentItems: this.getWorkspaceRecentItems(workspace.id),
      notifications: this.notificationService
        .getAll()
        .filter((notification) => !notification.moduleId || moduleIds.has(notification.moduleId)),
      activities: this.activityService
        .getTimeline(25)
        .filter((activity) => !activity.moduleId || moduleIds.has(activity.moduleId))
    };
  }

  loadWorkspace(workspaceId: string) {
    return this.getWorkspaceSnapshot(workspaceId);
  }

  switchWorkspace(workspaceId: string) {
    const workspace = this.resolveWorkspace(workspaceId);
    this.activeWorkspaceId = workspace.id;
    return this.getWorkspaceSnapshot(workspace.id);
  }

  loadLayout(workspaceId: string): WorkspaceLayoutSnapshot {
    const snapshot = this.getWorkspaceSnapshot(workspaceId);
    return {
      workspace: snapshot.workspace,
      widgets: snapshot.widgets,
      preferences: snapshot.preferences
    };
  }

  getNavigationForWorkspace(workspaceId: string) {
    const workspace = this.resolveWorkspace(workspaceId);
    const moduleIds = new Set(workspace.modules);
    return this.navigationService.getNavigationItems().filter((moduleDefinition) => moduleIds.has(moduleDefinition.id));
  }

  private resolveWorkspace(workspaceId?: string): HicoPilotWorkspace {
    const workspace = workspaceId ? this.getWorkspace(workspaceId) : this.getDefaultWorkspace();

    if (workspace) return workspace;

    return {
      id: workspaceId ?? "workspace-fallback",
      name: "Fallback Workspace",
      description: "Fallback workspace generated from all registered modules.",
      type: "custom",
      ownerId: "system",
      companyId: "company-hicotech",
      defaultRoute: "/dashboard",
      modules: getModules().map((moduleDefinition) => moduleDefinition.id),
      widgets: [],
      preferences: [],
      favorites: [],
      recentItems: [],
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      metadata: { fallback: true }
    };
  }
}
