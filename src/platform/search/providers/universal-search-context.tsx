"use client";

import { createContext, useContext } from "react";
import type { ModuleSearchResult } from "@/core/search";

export type UniversalSearchContextValue = {
  open: boolean;
  query: string;
  selectedIndex: number;
  results: ModuleSearchResult[];
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  selectResult: (result?: ModuleSearchResult) => void;
};

export const UniversalSearchContext = createContext<UniversalSearchContextValue | null>(null);

export function useUniversalSearch() {
  const context = useContext(UniversalSearchContext);

  if (!context) {
    throw new Error("useUniversalSearch must be used inside UniversalSearchProvider");
  }

  return context;
}
