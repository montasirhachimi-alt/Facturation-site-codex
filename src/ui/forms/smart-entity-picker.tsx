"use client";

import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { EntityPickerItem } from "./entity-picker.types";
import { filterEntityPickerItems, findEntityPickerItem } from "./entity-picker.utils";

export function SmartEntityPicker({
  allowCreate = false,
  createLabel = "Créer",
  emptyDescription = "Essayez un autre nom, numéro ou client.",
  emptyTitle = "Aucun résultat",
  entityType,
  helper,
  initialCreateValue,
  items,
  label,
  onCreate,
  onChange,
  placeholder = "Rechercher...",
  value
}: {
  allowCreate?: boolean;
  createLabel?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  entityType?: string;
  helper?: string;
  initialCreateValue?: string;
  items: readonly EntityPickerItem[];
  label: string;
  onCreate?: (value: string) => EntityPickerItem | Promise<EntityPickerItem>;
  onChange: (selection: { value: string; item: EntityPickerItem | null }) => void;
  placeholder?: string;
  value: string;
}) {
  const pickerId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createValue, setCreateValue] = useState("");
  const [createdItems, setCreatedItems] = useState<readonly EntityPickerItem[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const allItems = useMemo(() => dedupeEntityPickerItems([...createdItems, ...items]), [createdItems, items]);
  const selectedItem = useMemo(() => findEntityPickerItem(allItems, value), [allItems, value]);
  const visibleItems = useMemo(() => filterEntityPickerItems(allItems, query), [allItems, query]);
  const createQuery = (initialCreateValue ?? query).trim();
  const showCreateAction = Boolean(allowCreate && onCreate && createQuery && visibleItems.length === 0 && !createOpen);
  const activeItem = visibleItems[activeIndex];
  const activeCreateAction = showCreateAction && activeIndex === visibleItems.length;

  useEffect(() => {
    if (!open) {
      setQuery(selectedItem?.title ?? value);
    }
  }, [open, selectedItem, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const resultCount = visibleItems.length + (showCreateAction ? 1 : 0);
    if (activeIndex >= resultCount) setActiveIndex(0);
  }, [activeIndex, showCreateAction, visibleItems.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function selectItem(item: EntityPickerItem) {
    if (item.disabled) return;
    onChange({ value: item.title, item });
    setQuery(item.title);
    setCreateOpen(false);
    setOpen(false);
  }

  function clearSelection() {
    onChange({ value: "", item: null });
    setQuery("");
    setCreateOpen(false);
    setOpen(false);
    inputRef.current?.focus();
  }

  function openCreateSurface() {
    if (!showCreateAction) return;
    setCreateValue(createQuery);
    setCreateError(null);
    setCreateOpen(true);
  }

  async function submitCreate() {
    const trimmedValue = createValue.trim();
    if (!trimmedValue || !onCreate || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const createdItem = await onCreate(trimmedValue);
      setCreatedItems((current) => [createdItem, ...current]);
      selectItem(createdItem);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Création impossible. Vérifiez la connexion puis réessayez.");
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      const resultCount = visibleItems.length + (showCreateAction ? 1 : 0);
      setActiveIndex((index) => (resultCount ? (index + 1) % resultCount : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      const resultCount = visibleItems.length + (showCreateAction ? 1 : 0);
      setActiveIndex((index) => (resultCount ? (index - 1 + resultCount) % resultCount : 0));
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      event.stopPropagation();
      if (activeCreateAction) {
        openCreateSurface();
        return;
      }
      if (activeItem) selectItem(activeItem);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (createOpen) {
        setCreateOpen(false);
        inputRef.current?.focus();
        return;
      }
      setOpen(false);
      setQuery(selectedItem?.title ?? value);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={`${pickerId}-input`} className="block text-sm font-bold text-hicotech-navy dark:text-white">
        {label}
      </label>
      <div className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-hicotech-navy shadow-sm shadow-slate-200/40 outline-none ring-hicotech-blue/10 transition focus-within:border-hicotech-blue focus-within:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white dark:shadow-none">
        <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
        <input
          ref={inputRef}
          id={`${pickerId}-input`}
          value={open ? query : selectedItem?.title ?? value}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery(selectedItem?.title ?? value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${pickerId}-listbox`}
          aria-activedescendant={activeCreateAction ? `${pickerId}-create-option` : activeItem ? `${pickerId}-option-${activeItem.id}` : undefined}
        />
        {value ? (
          <button type="button" onClick={clearSelection} className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-hicotech-navy dark:hover:bg-white/10 dark:hover:text-white" aria-label={`Effacer ${label}`}>
            <X size={15} />
          </button>
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
        )}
      </div>
      {helper && <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{helper}</p>}

      {open && (
        <div className="absolute z-[70] mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(10,30,63,0.18)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <div id={`${pickerId}-listbox`} role="listbox" className="max-h-80 overflow-y-auto p-1.5">
            {createOpen ? (
              <InlineCreatePanel
                createLabel={createLabel}
                entityType={entityType ?? label}
                value={createValue}
                error={createError}
                submitting={creating}
                onCancel={() => {
                  if (creating) return;
                  setCreateOpen(false);
                  inputRef.current?.focus();
                }}
                onChange={setCreateValue}
                onSubmit={submitCreate}
              />
            ) : visibleItems.length > 0 ? (
              visibleItems.map((item, index) => (
                <EntityPickerRow
                  key={item.id}
                  id={`${pickerId}-option-${item.id}`}
                  active={index === activeIndex}
                  item={item}
                  selected={selectedItem?.id === item.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onSelect={() => selectItem(item)}
                />
              ))
            ) : showCreateAction ? (
              <CreateActionRow
                id={`${pickerId}-create-option`}
                active={activeCreateAction}
                createLabel={createLabel}
                query={createQuery}
                onMouseEnter={() => setActiveIndex(visibleItems.length)}
                onSelect={openCreateSurface}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
                <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{emptyTitle}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{emptyDescription}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function dedupeEntityPickerItems(items: readonly EntityPickerItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function CreateActionRow({
  active,
  createLabel,
  id,
  onMouseEnter,
  onSelect,
  query
}: {
  active: boolean;
  createLabel: string;
  id: string;
  onMouseEnter: () => void;
  onSelect: () => void;
  query: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={active}
      onMouseEnter={onMouseEnter}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition ${
        active ? "bg-emerald-50 text-hicotech-navy ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-white dark:ring-emerald-400/25" : "text-hicotech-navy hover:bg-emerald-50/70 dark:text-white dark:hover:bg-emerald-400/10"
      }`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/25">
        <Plus size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-bold">{createLabel} “{query}”</span>
        <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-300">Créer sans quitter ce formulaire.</span>
      </span>
    </button>
  );
}

function InlineCreatePanel({
  createLabel,
  entityType,
  onCancel,
  onChange,
  onSubmit,
  error,
  submitting,
  value
}: {
  createLabel: string;
  entityType: string;
  onCancel: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  error?: string | null;
  submitting?: boolean;
  value: string;
}) {
  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (submitting) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      onSubmit();
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
          <Plus size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{createLabel}</p>
          <p className="mt-0.5 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">Création de {entityType}. Le formulaire parent reste intact.</p>
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">{error}</p>}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitting}
        autoFocus
        className="mt-3 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-hicotech-navy outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-emerald-400/20 dark:bg-hicotech-dark-page dark:text-white"
        aria-label={createLabel}
      />
      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={submitting} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 disabled:opacity-60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white">
          Annuler
        </button>
        <button type="button" onClick={() => void onSubmit()} disabled={submitting} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-60">
          {submitting ? "Enregistrement..." : "Créer et sélectionner"}
        </button>
      </div>
    </div>
  );
}

function EntityPickerRow({
  active,
  id,
  item,
  onMouseEnter,
  onSelect,
  selected
}: {
  active: boolean;
  id: string;
  item: EntityPickerItem;
  onMouseEnter: () => void;
  onSelect: () => void;
  selected: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={selected}
      disabled={item.disabled}
      onMouseEnter={onMouseEnter}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        active ? "bg-hicotech-sky text-hicotech-navy dark:bg-hicotech-blue/15 dark:text-white" : "text-hicotech-navy hover:bg-slate-50 dark:text-white dark:hover:bg-hicotech-dark-page/70"
      }`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-hicotech-blue ring-1 ring-slate-200/70 dark:bg-hicotech-dark-page dark:text-blue-100 dark:ring-hicotech-dark-border">
        <Icon size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-display text-sm font-bold">{item.title}</span>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 ring-1 ring-slate-200/70 dark:bg-hicotech-dark-page dark:text-slate-300 dark:ring-hicotech-dark-border">
            {item.typeLabel}
          </span>
        </span>
        <span className="mt-1 block truncate text-xs font-medium text-slate-500 dark:text-slate-300">{item.metadata}</span>
      </span>
      {selected && <Check size={16} className="shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />}
    </button>
  );
}
