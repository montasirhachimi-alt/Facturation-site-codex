"use client";

import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { HicoPilotPreferenceCategory } from "@/core/preferences";
import { useWorkspace } from "@/hooks";
import { PreferencesRuntimeContext } from "./preferences-runtime-context";
import type { FeatureFlagState } from "./preferences-runtime.types";

export function PreferencesRuntimeProvider({ children }: { children: ReactNode }) {
  const {
    currentWorkspace,
    workspacePreferences,
    workspaceSnapshot,
    isLoading,
    error,
    reloadSnapshot
  } = useWorkspace();

  const preferences = useMemo(() => workspaceSnapshot?.preferences ?? workspacePreferences, [
    workspacePreferences,
    workspaceSnapshot?.preferences
  ]);

  const userPreferences = useMemo(() => preferences.filter((preference) => preference.scope === "user"), [preferences]);

  const scopedWorkspacePreferences = useMemo(
    () => preferences.filter((preference) => preference.scope === "workspace"),
    [preferences]
  );

  const widgetPreferences = useMemo(
    () => preferences.filter((preference) => preference.category === "widgets"),
    [preferences]
  );

  const preferenceByKey = useMemo(() => {
    return preferences.reduce<Map<string, (typeof preferences)[number]>>((index, preference) => {
      index.set(preference.key, preference);
      return index;
    }, new Map());
  }, [preferences]);

  const getPreference = useCallback((key: string) => preferenceByKey.get(key), [preferenceByKey]);

  const getPreferenceValue = useCallback(
    (key: string) => getPreference(key)?.value,
    [getPreference]
  );

  const getPreferencesByCategory = useCallback(
    (category: HicoPilotPreferenceCategory) => preferences.filter((preference) => preference.category === category),
    [preferences]
  );

  const featureFlags = useMemo<FeatureFlagState>(() => {
    return preferences.reduce<FeatureFlagState>((flags, preference) => {
      if (preference.category === "system" && typeof preference.value === "boolean") {
        flags[preference.key] = preference.value;
      }

      return flags;
    }, {});
  }, [preferences]);

  const hasFeatureFlag = useCallback((flag: string) => Boolean(featureFlags[flag]), [featureFlags]);

  const format = useMemo(
    () => ({
      theme: getPreferenceValue("theme"),
      density: getPreferenceValue("dashboardDensity") ?? getPreferenceValue("tableDensity"),
      language: getPreferenceValue("language"),
      dateFormat: getPreferenceValue("dateFormat"),
      numberFormat: getPreferenceValue("numberFormat"),
      timeZone: getPreferenceValue("timeZone")
    }),
    [getPreferenceValue]
  );

  const refreshPreferences = useCallback(() => {
    reloadSnapshot();
  }, [reloadSnapshot]);

  const value = useMemo(
    () => ({
      currentWorkspace,
      workspaceSnapshot,
      preferences,
      workspacePreferences: scopedWorkspacePreferences,
      userPreferences,
      widgetPreferences,
      featureFlags,
      format,
      isLoading,
      error,
      getPreference,
      getPreferenceValue,
      getPreferencesByCategory,
      hasFeatureFlag,
      refreshPreferences
    }),
    [
      currentWorkspace,
      error,
      featureFlags,
      format,
      getPreference,
      getPreferenceValue,
      getPreferencesByCategory,
      hasFeatureFlag,
      isLoading,
      preferences,
      refreshPreferences,
      scopedWorkspacePreferences,
      userPreferences,
      widgetPreferences,
      workspaceSnapshot
    ]
  );

  return <PreferencesRuntimeContext.Provider value={value}>{children}</PreferencesRuntimeContext.Provider>;
}
