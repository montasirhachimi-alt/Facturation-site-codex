"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { PreferencesRuntimeProvider } from "@/preferences";
import { useWidgetRuntime, WidgetRuntimeProvider } from "@/widgets";

function DashboardRuntimeConsumer({ children }: { children: ReactNode }) {
  const {
    currentWorkspace,
    workspaceSnapshot,
    workspacePreferences,
    widgets,
    permissions,
    visibilityState,
    loadingState,
    errorState,
    pinnedWidgetIds,
    hiddenWidgetIds,
    refreshRuntime
  } = useWidgetRuntime();

  const dashboardRuntimeIntegration = useMemo(
    () => ({
      currentWorkspace,
      snapshot: workspaceSnapshot,
      preferences: workspacePreferences,
      widgets,
      permissions,
      visibilityState,
      loadingState,
      errorState,
      pinnedWidgetIds,
      hiddenWidgetIds,
      refreshRuntime
    }),
    [
      currentWorkspace,
      errorState,
      hiddenWidgetIds,
      loadingState,
      permissions,
      pinnedWidgetIds,
      refreshRuntime,
      visibilityState,
      widgets,
      workspacePreferences,
      workspaceSnapshot
    ]
  );

  void dashboardRuntimeIntegration;

  return <>{children}</>;
}

export function DashboardWorkspaceBridge({ children }: { children: ReactNode }) {
  return (
    <PreferencesRuntimeProvider>
      <WidgetRuntimeProvider>
        <DashboardRuntimeConsumer>{children}</DashboardRuntimeConsumer>
      </WidgetRuntimeProvider>
    </PreferencesRuntimeProvider>
  );
}
