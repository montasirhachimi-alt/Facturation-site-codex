"use client";

import { ArrowRight, Command, CornerDownLeft, Plus, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { UniversalSearchItem } from "../universal-search.types";
import { useUniversalSearch } from "../providers/universal-search-context";

export function UniversalSearchDialog() {
  const {
    activeIndex,
    closeSearch,
    flatItems,
    open,
    query,
    sections,
    selectItem,
    selectNext,
    selectPrevious,
    setActiveIndex,
    setQuery,
    isFavorite,
    toggleFavorite
  } = useUniversalSearch();
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItem = flatItems[activeIndex];
  const shortcutLabel = usePlatformShortcutLabel();
  const activeItemId = activeItem ? `command-center-item-${activeItem.id}` : undefined;

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleFocusIn(event: FocusEvent) {
      if (!dialogRef.current?.contains(event.target as Node)) {
        inputRef.current?.focus();
      }
    }

    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectNext();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectPrevious();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectItem(activeItem);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-hicotech-navy/30 px-3 pt-[8vh] backdrop-blur-md animate-in fade-in duration-150 dark:bg-black/50 sm:px-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fermer la recherche"
        onClick={closeSearch}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-center-title"
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_28px_90px_rgba(10,30,63,0.24)] outline-none transition duration-200 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card/95 dark:shadow-black/40"
      >
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3.5 dark:border-hicotech-dark-border sm:px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-hicotech-navy text-white dark:bg-hicotech-blue dark:text-blue-100">
            <Command size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="command-center-title" className="sr-only">
              Centre de commandes
            </h2>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ouvrir une page ou un module..."
              className="w-full bg-transparent font-display text-lg font-semibold text-hicotech-navy outline-none placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 dark:text-white"
              aria-describedby="command-center-description"
              aria-activedescendant={activeItemId}
              aria-controls="command-center-results"
            />
            <p id="command-center-description" className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-300">
              Navigation locale instantanée. Aucune requête serveur.
            </p>
          </div>
          <button
            type="button"
            onClick={closeSearch}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky hover:text-hicotech-blue focus:outline-none focus:ring-2 focus:ring-hicotech-blue/40 dark:border-hicotech-dark-border dark:hover:bg-hicotech-blue/15"
            aria-label="Fermer la recherche"
          >
            <X size={17} />
          </button>
        </div>

        <div id="command-center-results" className="max-h-[min(30rem,66vh)] overflow-y-auto px-3 py-2.5 sm:px-4" role="listbox" aria-label="Commandes disponibles">
          {sections.map((section) => (
            <section key={section.id} className="py-2" aria-labelledby={`search-section-${section.id}`}>
              <div className="mb-2 flex items-end justify-between gap-3 px-2">
                <div>
                  <h3 id={`search-section-${section.id}`} className="font-display text-sm font-bold text-hicotech-navy dark:text-white">
                    {section.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-300">{section.description}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {section.items.length > 0 ? (
                  section.items.map((item) => {
                    const itemIndex = flatItems.findIndex((candidate) => candidate.id === item.id);
                    return (
                      <SearchFoundationRow
                        key={item.id}
                        id={`command-center-item-${item.id}`}
                        item={item}
                        active={itemIndex === activeIndex}
                        favorite={isFavorite(item)}
                        onFocus={() => setActiveIndex(itemIndex)}
                        onSelect={() => selectItem(item)}
                        onToggleFavorite={() => toggleFavorite(item)}
                      />
                    );
                  })
                ) : (
                  <SearchEmptyState title={section.emptyTitle} description={section.emptyDescription} />
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/90 px-4 py-3 text-xs font-semibold text-slate-400 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/60 dark:text-slate-300 sm:px-5">
          <span className="inline-flex items-center gap-2">
            <ShortcutKey label={shortcutLabel} />
            ouvrir
          </span>
          <span className="inline-flex items-center gap-2">
            <ShortcutKey label="↑ ↓" />
            naviguer
            <ShortcutKey label="Enter" />
            ouvrir
            <ShortcutKey label="ESC" />
            fermer
          </span>
        </div>
      </section>
    </div>
  );
}

function SearchFoundationRow({
  active,
  id,
  item,
  favorite,
  onFocus,
  onSelect,
  onToggleFavorite
}: {
  active: boolean;
  favorite: boolean;
  id: string;
  item: UniversalSearchItem;
  onFocus: () => void;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const Icon = item.icon;
  const createTone = item.tone === "create";
  const activeClassName = createTone
    ? "bg-emerald-50 text-hicotech-navy ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-white dark:ring-emerald-400/25"
    : "bg-hicotech-sky text-hicotech-navy ring-1 ring-hicotech-blue/20 dark:bg-hicotech-blue/15 dark:text-white dark:ring-hicotech-blue/30";
  const idleClassName = createTone
    ? "text-hicotech-navy hover:bg-emerald-50/70 focus:bg-emerald-50/70 dark:text-white dark:hover:bg-emerald-400/10 dark:focus:bg-emerald-400/10"
    : "text-hicotech-navy hover:bg-slate-50 focus:bg-slate-50 dark:text-white dark:hover:bg-hicotech-dark-page/70 dark:focus:bg-hicotech-dark-page/70";
  const iconClassName = createTone
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/25"
    : "bg-white text-hicotech-blue ring-slate-200/70 dark:bg-hicotech-dark-page dark:text-blue-100 dark:ring-hicotech-dark-border";
  const badgeClassName = createTone
    ? "bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/25"
    : "bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 ring-1 ring-slate-200/70 dark:bg-hicotech-dark-page dark:text-slate-300 dark:ring-hicotech-dark-border";

  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      aria-disabled={item.disabled}
      onFocus={onFocus}
      onMouseEnter={onFocus}
      onClick={() => {
        if (!item.disabled) onSelect();
      }}
      className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition duration-150 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 ${
        active ? activeClassName : idleClassName
      }`}
    >
      <span className={`relative grid size-10 shrink-0 place-items-center rounded-xl shadow-sm ring-1 ${iconClassName}`}>
        <Icon size={18} aria-hidden="true" />
        {createTone && (
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-white dark:ring-hicotech-dark-card">
            <Plus size={10} aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-display text-sm font-bold">{item.title}</span>
          {(item.badge ?? item.eyebrow) && (
            <span className={`rounded-full ${badgeClassName}`}>
              {item.badge ?? item.eyebrow}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">{item.description}</span>
        {item.href && <span className="mt-1 block truncate text-[11px] font-semibold text-slate-400 dark:text-slate-500">{item.href}</span>}
      </span>
      {item.href && !item.actionId && (
        <span
          role="button"
          tabIndex={0}
          aria-label={favorite ? `Retirer ${item.title} des favoris` : `Ajouter ${item.title} aux favoris`}
          aria-pressed={favorite}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite();
            }
          }}
          className={`grid size-8 shrink-0 place-items-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-hicotech-blue/30 ${
            favorite
              ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
              : "border-slate-200 bg-white text-slate-300 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:hover:border-amber-400/20 dark:hover:bg-amber-400/10 dark:hover:text-amber-200"
          }`}
        >
          <Star size={15} className={favorite ? "fill-current" : ""} aria-hidden="true" />
        </span>
      )}
      <span className="hidden shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-400 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page sm:inline-flex">
        Enter
      </span>
      <ArrowRight size={16} className={`shrink-0 transition ${createTone ? "text-emerald-300 group-hover:text-emerald-600" : "text-slate-300 group-hover:text-hicotech-blue"}`} />
    </div>
  );
}

function SearchEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
      <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{description}</p>
    </div>
  );
}

function ShortcutKey({ label }: { label: string }) {
  return (
    <kbd className="inline-flex min-h-6 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-500 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-200">
      {label === "⌘K" && <Command size={12} />}
      {label === "Enter" && <CornerDownLeft size={12} />}
      {label}
    </kbd>
  );
}

function usePlatformShortcutLabel() {
  return useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl+K";
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    return platform.includes("mac") || userAgent.includes("mac os") ? "⌘K" : "Ctrl+K";
  }, []);
}
