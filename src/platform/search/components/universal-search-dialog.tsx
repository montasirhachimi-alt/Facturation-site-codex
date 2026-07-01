"use client";

import {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  ClipboardList,
  ContactRound,
  FileArchive,
  FileOutput,
  FileText,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UserCog,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ModuleSearchResult } from "@/core/search";
import { useUniversalSearch } from "../providers";

const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  ClipboardList,
  ContactRound,
  FileArchive,
  FileOutput,
  FileText,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Truck,
  UserCog,
  Users,
  WalletCards
};

const categoryLabels: Record<string, string> = {
  home: "Home",
  business: "Business",
  sales: "Sales",
  finance: "Finance",
  people: "People",
  analytics: "Analytics",
  ai: "AI",
  system: "System"
};

export function UniversalSearchDialog() {
  const {
    open,
    query,
    results,
    selectedIndex,
    closeSearch,
    selectNext,
    selectPrevious,
    selectResult,
    setQuery,
    setSelectedIndex
  } = useUniversalSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-hicotech-navy/30 px-4 pt-[12vh] backdrop-blur-md dark:bg-black/45" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fermer la recherche"
        onClick={closeSearch}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="universal-search-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/20 outline-none transition duration-200 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card/95 dark:shadow-black/40"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-hicotech-dark-border">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100">
            <Search size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="universal-search-title" className="sr-only">
              Recherche universelle
            </h2>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  selectNext();
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  selectPrevious();
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  selectResult(results[selectedIndex]);
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  closeSearch();
                }
              }}
              placeholder="Rechercher un module, une catégorie, une action..."
              className="w-full bg-transparent font-display text-base font-semibold text-hicotech-navy outline-none placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 dark:text-white"
              aria-activedescendant={results[selectedIndex] ? `search-result-${results[selectedIndex].id}` : undefined}
              aria-controls="universal-search-results"
              aria-autocomplete="list"
              role="combobox"
              aria-expanded="true"
            />
          </div>
          <kbd className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-400 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-slate-300 sm:inline-flex">
            ESC
          </kbd>
        </div>

        <div id="universal-search-results" role="listbox" className="max-h-[26rem] overflow-y-auto p-2">
          {results.length ? (
            results.map((result, index) => (
              <SearchResultRow
                key={result.id}
                result={result}
                active={index === selectedIndex}
                onMouseEnter={() => setSelectedIndex(index)}
                onSelect={() => selectResult(result)}
              />
            ))
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-base font-bold text-hicotech-navy dark:text-white">
                Aucun résultat
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                Essayez un nom de module, une catégorie ou un alias.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/60 dark:text-slate-300">
          <span>Ctrl/Command + K pour ouvrir</span>
          <span>↑ ↓ naviguer · Enter sélectionner</span>
        </div>
      </section>
    </div>
  );
}

function SearchResultRow({
  result,
  active,
  onMouseEnter,
  onSelect
}: {
  result: ModuleSearchResult;
  active: boolean;
  onMouseEnter: () => void;
  onSelect: () => void;
}) {
  const Icon = iconMap[result.icon] ?? FileText;

  return (
    <button
      id={`search-result-${result.id}`}
      type="button"
      role="option"
      aria-selected={active}
      onMouseEnter={onMouseEnter}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left outline-none transition duration-150 ${
        active
          ? "bg-hicotech-sky text-hicotech-navy ring-1 ring-hicotech-blue/20 dark:bg-hicotech-blue/15 dark:text-white dark:ring-hicotech-blue/30"
          : "text-hicotech-navy hover:bg-slate-50 dark:text-white dark:hover:bg-hicotech-dark-page/70"
      }`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-hicotech-blue shadow-sm dark:bg-hicotech-dark-page dark:text-blue-100">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-bold">
          {result.title}
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500 dark:text-slate-300">
          {categoryLabels[result.category] ?? result.category} · {result.route}
        </span>
      </span>
      <span className="hidden rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:bg-hicotech-dark-page dark:text-slate-300 sm:inline-flex">
        {result.matchedOn}
      </span>
    </button>
  );
}
