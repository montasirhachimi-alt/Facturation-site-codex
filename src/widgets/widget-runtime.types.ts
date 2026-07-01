import type { HicoPilotPreference } from "@/core/preferences";
import type { HicoPilotWidget } from "@/core/widgets";
import type { PreferenceRuntimeValue } from "@/preferences";
import type { HicoPilotWorkspace, WorkspaceSnapshot } from "@/services/workspace";
import type { PermissionDecision } from "@/runtime/permissions";

export type WidgetPermissionState = {
  required: HicoPilotWidget["permissions"];
  allowed: boolean;
  decisions: PermissionDecision[];
};

export type WidgetVisibilityState = Record<string, boolean>;

export type WidgetLoadingState = {
  runtime: boolean;
  workspace: boolean;
};

export type WidgetErrorState = {
  runtime: string | null;
  workspace: string | null;
};

export type WidgetRuntimeItem = {
  widget: HicoPilotWidget;
  currentWorkspace: HicoPilotWorkspace | null;
  workspaceSnapshot: WorkspaceSnapshot | null;
  workspacePreferences: HicoPilotPreference[];
  preferenceRuntime: PreferenceRuntimeValue;
  permissions: WidgetPermissionState;
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;
  metadata: HicoPilotWidget["metadata"];
  refresh: () => void;
};

export type WidgetRuntimeValue = {
  currentWorkspace: HicoPilotWorkspace | null;
  workspaceSnapshot: WorkspaceSnapshot | null;
  workspacePreferences: HicoPilotPreference[];
  preferenceRuntime: PreferenceRuntimeValue;
  widgets: HicoPilotWidget[];
  permissions: Record<string, WidgetPermissionState>;
  visibilityState: WidgetVisibilityState;
  loadingState: WidgetLoadingState;
  errorState: WidgetErrorState;
  pinnedWidgetIds: string[];
  hiddenWidgetIds: string[];
  getWidgetRuntime: (widgetId: string) => WidgetRuntimeItem | undefined;
  isWidgetVisible: (widgetId: string) => boolean;
  refreshWidget: (widgetId: string) => void;
  refreshRuntime: () => void;
};
