"use client";

import { useContext } from "react";
import { PreferencesRuntimeContext } from "./preferences-runtime-context";

export function usePreferencesRuntime() {
  const context = useContext(PreferencesRuntimeContext);

  if (!context) {
    throw new Error("usePreferencesRuntime must be used within a PreferencesRuntimeProvider.");
  }

  return context;
}
