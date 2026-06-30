"use client";

import { useContext } from "react";
import { WidgetRuntimeContext } from "./widget-runtime-context";

export function useWidgetRuntime() {
  const context = useContext(WidgetRuntimeContext);

  if (!context) {
    throw new Error("useWidgetRuntime must be used within a WidgetRuntimeProvider.");
  }

  return context;
}
