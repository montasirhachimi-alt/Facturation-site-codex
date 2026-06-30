"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { UniversalSearchDialog } from "../components/universal-search-dialog";
import { searchCoreModules } from "../services";
import type { ModuleSearchResult } from "../types";
import { UniversalSearchContext } from "./universal-search-context";
import type { UniversalSearchContextValue } from "./universal-search-context";

type UniversalSearchProviderProps = {
  children: ReactNode;
  searchResults?: (query: string) => ModuleSearchResult[];
  onSelectResult?: (result: ModuleSearchResult) => void;
};

export function UniversalSearchProvider({ children, searchResults = searchCoreModules, onSelectResult }: UniversalSearchProviderProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const results = useMemo(() => searchResults(query), [query, searchResults]);

  const openSearch = useCallback(() => {
    setOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const selectNext = useCallback(() => {
    setSelectedIndex((index) => (results.length ? (index + 1) % results.length : 0));
  }, [results.length]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
  }, [results.length]);

  const selectResult = useCallback((result?: ModuleSearchResult) => {
    if (!result) return;
    if (onSelectResult) {
      onSelectResult(result);
    } else {
      console.log("Open module:", result.module.name);
    }
    closeSearch();
  }, [closeSearch, onSelectResult]);

  useEffect(() => {
    setSelectedIndex(0);
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
    selectedIndex,
    results,
    openSearch,
    closeSearch,
    setQuery,
    setSelectedIndex,
    selectNext,
    selectPrevious,
    selectResult
  }), [closeSearch, open, openSearch, query, results, selectNext, selectPrevious, selectResult, selectedIndex]);

  return (
    <UniversalSearchContext.Provider value={value}>
      {children}
      <UniversalSearchDialog />
    </UniversalSearchContext.Provider>
  );
}
