import { WorkspaceService } from "./WorkspaceService";
import type { HicoPilotWorkspace, WorkspaceAdapterItem, WorkspaceSnapshot } from "./workspace.types";

export function toWorkspaceAdapterItem(workspace: HicoPilotWorkspace, service = new WorkspaceService()): WorkspaceAdapterItem {
  const snapshot = service.getWorkspaceSnapshot(workspace.id);

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    type: workspace.type,
    defaultRoute: workspace.defaultRoute,
    moduleCount: snapshot.modules.length,
    widgetCount: snapshot.widgets.length,
    favoriteCount: snapshot.favorites.length,
    recentItemCount: snapshot.recentItems.length,
    updatedAt: workspace.updatedAt
  };
}

export function getWorkspaceAdapterItems(service = new WorkspaceService()): WorkspaceAdapterItem[] {
  return service.getWorkspaces().map((workspace) => toWorkspaceAdapterItem(workspace, service));
}

export function getWorkspaceAdapterItem(workspaceId: string, service = new WorkspaceService()) {
  const workspace = service.getWorkspace(workspaceId);
  return workspace ? toWorkspaceAdapterItem(workspace, service) : undefined;
}

export function createWorkspaceSnapshot(workspaceId: string, service = new WorkspaceService()): WorkspaceSnapshot {
  return service.getWorkspaceSnapshot(workspaceId);
}
