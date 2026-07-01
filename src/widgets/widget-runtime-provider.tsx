"use client";

import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { usePreferencesRuntime } from "@/preferences";
import { PermissionService } from "@/services/permissions";
import { WidgetRuntimeContext } from "./widget-runtime-context";
import type { WidgetPermissionState, WidgetRuntimeItem, WidgetVisibilityState } from "./widget-runtime.types";

export function WidgetRuntimeProvider({ children }: { children: ReactNode }) {
  const permissionService = useMemo(() => new PermissionService(), []);
  const preferenceRuntime = usePreferencesRuntime();
  const {
    currentWorkspace,
    preferences,
    workspaceSnapshot,
    isLoading,
    error,
    refreshPreferences
  } = preferenceRuntime;

  const widgets = useMemo(() => workspaceSnapshot?.widgets ?? [], [workspaceSnapshot?.widgets]);

  const permissions = useMemo<Record<string, WidgetPermissionState>>(() => {
    return widgets.reduce<Record<string, WidgetPermissionState>>((state, widget) => {
      const decisions = permissionService.evaluateRequirements(
        widget.permissions,
        {
          id: widget.id,
          type: "widget",
          module: widget.moduleId,
          enabled: widget.enabled
        },
        { workspace: currentWorkspace }
      );

      state[widget.id] = {
        required: widget.permissions,
        allowed: decisions.every((decision) => decision.allowed),
        decisions
      };
      return state;
    }, {});
  }, [currentWorkspace, permissionService, widgets]);

  const visibilityState = useMemo<WidgetVisibilityState>(() => {
    return widgets.reduce<WidgetVisibilityState>((state, widget) => {
      state[widget.id] = widget.enabled;
      return state;
    }, {});
  }, [widgets]);

  const pinnedWidgetIds = useMemo(() => widgets.filter((widget) => widget.pinned).map((widget) => widget.id), [widgets]);

  const hiddenWidgetIds = useMemo(
    () => widgets.filter((widget) => !visibilityState[widget.id]).map((widget) => widget.id),
    [visibilityState, widgets]
  );

  const isWidgetVisible = useCallback(
    (widgetId: string) => Boolean(visibilityState[widgetId]),
    [visibilityState]
  );

  const refreshRuntime = useCallback(() => {
    refreshPreferences();
  }, [refreshPreferences]);

  const refreshWidget = useCallback(
    (widgetId: string) => {
      void widgetId;
      refreshPreferences();
    },
    [refreshPreferences]
  );

  const getWidgetRuntime = useCallback(
    (widgetId: string): WidgetRuntimeItem | undefined => {
      const widget = widgets.find((item) => item.id === widgetId);
      if (!widget) return undefined;

      return {
        widget,
        currentWorkspace,
        workspaceSnapshot,
        workspacePreferences: preferences,
        preferenceRuntime,
        permissions: permissions[widget.id] ?? { required: widget.permissions, allowed: true, decisions: [] },
        isVisible: isWidgetVisible(widget.id),
        isLoading,
        error,
        metadata: widget.metadata,
        refresh: () => refreshWidget(widget.id)
      };
    },
    [
      currentWorkspace,
      error,
      isLoading,
      isWidgetVisible,
      permissions,
      preferenceRuntime,
      refreshWidget,
      widgets,
      preferences,
      workspaceSnapshot
    ]
  );

  const value = useMemo(
    () => ({
      currentWorkspace,
      workspaceSnapshot,
      workspacePreferences: preferences,
      preferenceRuntime,
      widgets,
      permissions,
      visibilityState,
      loadingState: {
        runtime: isLoading,
        workspace: isLoading
      },
      errorState: {
        runtime: error,
        workspace: error
      },
      pinnedWidgetIds,
      hiddenWidgetIds,
      getWidgetRuntime,
      isWidgetVisible,
      refreshWidget,
      refreshRuntime
    }),
    [
      currentWorkspace,
      error,
      getWidgetRuntime,
      hiddenWidgetIds,
      isLoading,
      isWidgetVisible,
      permissions,
      pinnedWidgetIds,
      preferenceRuntime,
      refreshRuntime,
      refreshWidget,
      visibilityState,
      widgets,
      preferences,
      workspaceSnapshot
    ]
  );

  return <WidgetRuntimeContext.Provider value={value}>{children}</WidgetRuntimeContext.Provider>;
}
