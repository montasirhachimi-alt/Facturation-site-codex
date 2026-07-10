"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UniversalSearchDialog } from "../components/universal-search-dialog";
import { isQuickCreateActionId } from "../action-registry";
import { buildHistorySection } from "../command-center-history.utils";
import { getFoundationSearchSections } from "../universal-search-foundation";
import type { UniversalSearchItem, UniversalSearchSectionResolver } from "../universal-search.types";
import type { QuickCreateActionId } from "../action-registry";
import { useCommandCenterHistory } from "../hooks/use-command-center-history";
import { QuickCreateDialogHost } from "./quick-create-dialog-host";
import { UniversalSearchContext } from "./universal-search-context";
import type { UniversalSearchContextValue } from "./universal-search-context";

type UniversalSearchProviderProps = {
  children: ReactNode;
  resolveSections?: UniversalSearchSectionResolver;
  onSelectItem?: (item: UniversalSearchItem) => void;
};

export function UniversalSearchProvider({ children, resolveSections = getFoundationSearchSections, onSelectItem }: UniversalSearchProviderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeQuickCreateAction, setActiveQuickCreateAction] = useState<QuickCreateActionId | null>(null);
  const { favorites, isFavorite, recent, recordRecent, toggleFavorite } = useCommandCenterHistory();
  const baseSections = useMemo(() => resolveSections(query), [query, resolveSections]);
  const sections = useMemo(() => {
    if (query.trim()) return baseSections;

    const quickCreateSection = baseSections.find((section) => section.id === "quick-create");

    return [
      buildHistorySection({
        id: "favorites",
        title: "Favorites",
        description: "Vos raccourcis importants.",
        emptyTitle: "Aucun favori",
        emptyDescription: "Ajoutez un favori depuis une destination ou un record.",
        items: favorites
      }),
      buildHistorySection({
        id: "recent",
        title: "Recent",
        description: "Vos dernières ouvertures.",
        emptyTitle: "Aucun élément récent",
        emptyDescription: "Ouvrez une destination ou un record depuis le Command Center.",
        items: recent
      }),
      ...(quickCreateSection ? [quickCreateSection] : [])
    ];
  }, [baseSections, favorites, query, recent]);
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
    if (isQuickCreateActionId(item.actionId)) {
      closeSearch();
      setActiveQuickCreateAction(item.actionId);
      return;
    }
    if (item.href) {
      recordRecent(item);
      router.push(item.href);
    }
    closeSearch();
  }, [closeSearch, onSelectItem, recordRecent, router]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= flatItems.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, flatItems.length]);

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
    selectItem,
    isFavorite,
    toggleFavorite
  }), [activeIndex, closeSearch, flatItems, isFavorite, open, openSearch, query, sections, selectItem, selectNext, selectPrevious, toggleFavorite]);

  return (
    <UniversalSearchContext.Provider value={value}>
      {children}
      <UniversalSearchDialog />
      <QuickCreateDialogHost activeAction={activeQuickCreateAction} onClose={() => setActiveQuickCreateAction(null)} />
    </UniversalSearchContext.Provider>
  );
}
