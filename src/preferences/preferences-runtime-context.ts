"use client";

import { createContext } from "react";
import type { PreferenceRuntimeValue } from "./preferences-runtime.types";

export const PreferencesRuntimeContext = createContext<PreferenceRuntimeValue | undefined>(undefined);
