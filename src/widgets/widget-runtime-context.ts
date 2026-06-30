"use client";

import { createContext } from "react";
import type { WidgetRuntimeValue } from "./widget-runtime.types";

export const WidgetRuntimeContext = createContext<WidgetRuntimeValue | undefined>(undefined);
