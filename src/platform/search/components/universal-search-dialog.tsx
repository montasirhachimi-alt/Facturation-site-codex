"use client";

import { ArrowRight, Command, CornerDownLeft, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { UniversalSearchItem } from "../universal-search.types";
import { useUniversalSearch } from "../providers";

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
    setQuery
  } = useUniversalSearch();
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItem = flatItems[activeIndex];
  const shortcutLabel = usePlatformShortcutLabel();

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
      return;
    }

    if (event.key === "Tab") {
      trapFocus(event);
    }
  }

  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    const focusable = getFocusableElements(dialogRef.current);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-hicotech-navy/35 px-3 pt-[9vh] backdrop-blur-md animate-in fade-in duration-150 dark:bg-black/50 sm:px-6" role="presentation">
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
        aria-labelledby="global-search-title"
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl shadow-slate-950/20 outline-none transition duration-200 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card/95 dark:shadow-black/40"
      >
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-4 dark:border-hicotech-dark-border sm:px-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100">
            <Search size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="global-search-title" className="sr-only">
              Recherche globale
            </h2>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent font-display text-lg font-semibold text-hicotech-navy outline-none placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 dark:text-white"
              aria-describedby="global-search-description"
            />
            <p id="global-search-description" className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-300">
              Fondation prête pour Recent, Suggestions et Navigation. Les providers seront connectés plus tard.
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

        <div className="max-h-[min(34rem,68vh)] overflow-y-auto px-3 py-3 sm:px-4">
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
                        item={item}
                        active={itemIndex === activeIndex}
                        onFocus={() => setActiveIndex(itemIndex)}
                        onSelect={() => selectItem(item)}
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
  item,
  onFocus,
  onSelect
}: {
  active: boolean;
  item: UniversalSearchItem;
  onFocus: () => void;
  onSelect: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      disabled={item.disabled}
      onFocus={onFocus}
      onMouseEnter={onFocus}
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left outline-none transition duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "bg-hicotech-sky text-hicotech-navy ring-1 ring-hicotech-blue/20 dark:bg-hicotech-blue/15 dark:text-white dark:ring-hicotech-blue/30"
          : "text-hicotech-navy hover:bg-slate-50 focus:bg-slate-50 dark:text-white dark:hover:bg-hicotech-dark-page/70 dark:focus:bg-hicotech-dark-page/70"
      }`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-hicotech-blue shadow-sm ring-1 ring-slate-200/70 dark:bg-hicotech-dark-page dark:text-blue-100 dark:ring-hicotech-dark-border">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-display text-sm font-bold">{item.title}</span>
          {item.eyebrow && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 ring-1 ring-slate-200/70 dark:bg-hicotech-dark-page dark:text-slate-300 dark:ring-hicotech-dark-border">
              {item.eyebrow}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">{item.description}</span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:text-hicotech-blue" />
    </button>
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

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
}
