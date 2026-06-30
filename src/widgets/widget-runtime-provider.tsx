"use client";

import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { useWorkspace } from "@/hooks";
import { WidgetRuntimeContext } from "./widget-runtime-context";
import type { WidgetPermissionState, WidgetRuntimeItem, WidgetVisibilityState } from "./widget-runtime.types";

export function WidgetRuntimeProvider({ children }: { children: ReactNode }) {
  const {
    currentWorkspace,
    workspaceSnapshot,
    workspacePreferences,
    isLoading,
    error,
    reloadSnapshot
  } = useWorkspace();

  const widgets = useMemo(() => workspaceSnapshot?.widgets ?? [], [workspaceSnapshot?.widgets]);

  const permissions = useMemo<Record<string, WidgetPermissionState>>(() => {
    return widgets.reduce<Record<string, WidgetPermissionState>>((state, widget) => {
      state[widget.id] = {
        required: widget.permissions,
        allowed: true
      };
      return state;
    }, {});
  }, [widgets]);

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
    reloadSnapshot();
  }, [reloadSnapshot]);

  const refreshWidget = useCallback(
    (widgetId: string) => {
      void widgetId;
      reloadSnapshot();
    },
    [reloadSnapshot]
  );

  const getWidgetRuntime = useCallback(
    (widgetId: string): WidgetRuntimeItem | undefined => {
      const widget = widgets.find((item) => item.id === widgetId);
      if (!widget) return undefined;

      return {
        widget,
        currentWorkspace,
        workspaceSnapshot,
        workspacePreferences,
        permissions: permissions[widget.id] ?? { required: widget.permissions, allowed: true },
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
      refreshWidget,
      widgets,
      workspacePreferences,
      workspaceSnapshot
    ]
  );

  const value = useMemo(
    () => ({
      currentWorkspace,
      workspaceSnapshot,
      workspacePreferences,
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
      refreshRuntime,
      refreshWidget,
      visibilityState,
      widgets,
      workspacePreferences,
      workspaceSnapshot
    ]
  );

  return <WidgetRuntimeContext.Provider value={value}>{children}</WidgetRuntimeContext.Provider>;
}
