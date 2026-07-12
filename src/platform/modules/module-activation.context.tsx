"use client";

import { createContext, useContext, useMemo } from "react";
import { alphaActivationProfile } from "./module-activation.defaults";
import { resolveModuleActivation } from "./module-activation.current";
import type { ModuleActivationRequest, ModuleActivationResult } from "./module-activation.types";
import type { ModuleId } from "./module.types";

const ModuleActivationContext = createContext<ModuleActivationResult | null>(null);

export function ModuleActivationProvider({
  children,
  request = alphaActivationProfile
}: {
  children: React.ReactNode;
  request?: ModuleActivationRequest;
}) {
  const activation = useMemo(() => resolveModuleActivation(request), [request]);

  return (
    <ModuleActivationContext.Provider value={activation}>
      {children}
    </ModuleActivationContext.Provider>
  );
}

export function useModuleActivation() {
  return useContext(ModuleActivationContext) ?? resolveModuleActivation(alphaActivationProfile);
}

export function useActiveModules() {
  return useModuleActivation().activeModules;
}

export function useModuleEnabled(moduleId: ModuleId) {
  return useModuleActivation().activeModuleIdSet.has(moduleId);
}
