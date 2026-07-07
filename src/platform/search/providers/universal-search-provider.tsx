"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { UniversalSearchDialog } from "../components/universal-search-dialog";
import { getFoundationSearchSections } from "../universal-search-foundation";
import type { UniversalSearchItem, UniversalSearchSectionResolver } from "../universal-search.types";
import { UniversalSearchContext } from "./universal-search-context";
import type { UniversalSearchContextValue } from "./universal-search-context";

type UniversalSearchProviderProps = {
  children: ReactNode;
  resolveSections?: UniversalSearchSectionResolver;
  onSelectItem?: (item: UniversalSearchItem) => void;
};

export function UniversalSearchProvider({ children, resolveSections = getFoundationSearchSections, onSelectItem }: UniversalSearchProviderProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const sections = useMemo(() => resolveSections(query), [query, resolveSections]);
  const flatItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  const openSearch = useCallback(() => {
    setOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const selectNext = useCallback(() => {
    setActiveIndex((index) => (flatItems.length ? (index + 1) % flatItems.length : 0));
  }, [flatItems.length]);

  const selectPrevious = useCallback(() => {
    setActiveIndex((index) => (flatItems.length ? (index - 1 + flatItems.length) % flatItems.length : 0));
  }, [flatItems.length]);

  const selectItem = useCallback((item?: UniversalSearchItem) => {
    if (!item || item.disabled) return;
    onSelectItem?.(item);
    closeSearch();
  }, [closeSearch, onSelectItem]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (isSearchShortcut) {
        event.preventDefault();
        openSearch();
        return;
      }

      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSearch, open, openSearch]);

  const value = useMemo<UniversalSearchContextValue>(() => ({
    open,
    query,
    activeIndex,
    sections,
    flatItems,
    openSearch,
    closeSearch,
    setQuery,
    selectNext,
    selectPrevious,
    setActiveIndex,
    selectItem
  }), [activeIndex, closeSearch, flatItems, open, openSearch, query, sections, selectItem, selectNext, selectPrevious]);

  return (
    <UniversalSearchContext.Provider value={value}>
      {children}
      <UniversalSearchDialog />
    </UniversalSearchContext.Provider>
  );
}
