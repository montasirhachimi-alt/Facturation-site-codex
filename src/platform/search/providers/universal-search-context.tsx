"use client";

import { createContext, useContext } from "react";
import type { UniversalSearchItem, UniversalSearchSection } from "../universal-search.types";

export type UniversalSearchContextValue = {
  open: boolean;
  query: string;
  activeIndex: number;
  sections: readonly UniversalSearchSection[];
  flatItems: readonly UniversalSearchItem[];
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  setActiveIndex: (index: number) => void;
  selectItem: (item?: UniversalSearchItem) => void;
};

export const UniversalSearchContext = createContext<UniversalSearchContextValue | null>(null);

export function useUniversalSearch() {
  const context = useContext(UniversalSearchContext);

  if (!context) {
    throw new Error("useUniversalSearch must be used inside UniversalSearchProvider");
  }

  return context;
}
