"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { clsx } from "clsx";
import { useTableKeyboardNavigation } from "@/platform/keyboard";
import { SectionCard } from "../cards/section-card";
import { EntityLoadingState } from "../feedback/entity-loading-state";
import type { EntityTableColumn } from "../types/entity-ui.types";

export function EntityTable<TEntity extends { id: string }, TSortKey extends string>({
  allVisibleSelected,
  bulkLabel,
  columns,
  emptyState,
  getRowLabel,
  isLoading,
  items,
  onSort,
  onToggleAll,
  onToggleRow,
  onOpenRow,
  renderActions,
  selectedIds,
  sort,
  subtitle,
  title
}: {
  allVisibleSelected: boolean;
  bulkLabel?: string;
  columns: readonly EntityTableColumn<TEntity, TSortKey>[];
  emptyState: React.ReactNode;
  getRowLabel: (item: TEntity) => string;
  isLoading?: boolean;
  items: readonly TEntity[];
  onSort: (field: TSortKey) => void;
  onToggleAll: () => void;
  onToggleRow: (id: TEntity["id"]) => void;
  onOpenRow?: (item: TEntity) => void;
  renderActions: (item: TEntity) => React.ReactNode;
  selectedIds: readonly string[];
  sort: Readonly<{ field: TSortKey; direction: "asc" | "desc" }>;
  subtitle: string;
  title: string;
}) {
  const tableNavigation = useTableKeyboardNavigation({
    items,
    onOpen: onOpenRow,
    onToggleSelection: (item) => onToggleRow(item.id)
  });

  return (
    <SectionCard className="overflow-hidden shadow-[0_12px_36px_rgba(10,30,63,0.07)] dark:shadow-none">
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-hicotech-navy px-4 py-3.5 text-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="absolute right-0 top-0 h-full w-28 bg-white/5" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white">{title}</h2>
            <p className="mt-0.5 text-xs font-medium text-cyan-50/70 dark:text-slate-300">{subtitle}</p>
          </div>
          {selectedIds.length > 0 && (
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-hicotech-blue shadow-sm">
              {bulkLabel ?? `${selectedIds.length} sélectionné(s)`}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <EntityLoadingState />
      ) : items.length === 0 ? (
        <div className="p-4">{emptyState}</div>
      ) : (
        <div className="overflow-x-auto" onKeyDown={tableNavigation.onKeyDown}>
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-left text-hicotech-navy backdrop-blur dark:border-hicotech-dark-border dark:bg-hicotech-dark-card/95 dark:text-white">
              <tr>
                <th className="w-11 px-4 py-2">
                  <input
                    checked={allVisibleSelected}
                    onChange={onToggleAll}
                    type="checkbox"
                    className="size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue"
                    aria-label="Sélectionner les lignes visibles"
                  />
                </th>
                {columns.map((column) => (
                  <th key={column.key} className={clsx("px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-300", column.className)}>
                    {column.sortable && column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.sortKey as TSortKey)}
                        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 outline-none transition hover:bg-white focus:ring-2 focus:ring-hicotech-blue/30 dark:hover:bg-white/10"
                      >
                        {column.label}
                        {sort.field === column.sortKey && (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
                <th className="px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  {...tableNavigation.getRowProps(index)}
                  className={clsx(
                    "border-t border-slate-100 outline-none transition duration-150 hover:bg-hicotech-sky/55 hover:shadow-[inset_3px_0_0_#0D6EFD] focus:bg-hicotech-sky/70 focus:shadow-[inset_3px_0_0_#0D6EFD] focus:ring-2 focus:ring-inset focus:ring-hicotech-blue/20 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60 dark:focus:bg-hicotech-dark-page/70",
                    index === tableNavigation.activeIndex && "bg-hicotech-sky/55 shadow-[inset_3px_0_0_#0D6EFD] dark:bg-hicotech-blue/10",
                    selectedIds.includes(item.id) && "bg-hicotech-sky/80 shadow-[inset_3px_0_0_#0D6EFD] ring-1 ring-inset ring-hicotech-blue/15 dark:bg-hicotech-blue/10"
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      checked={selectedIds.includes(item.id)}
                      onChange={() => onToggleRow(item.id)}
                      type="checkbox"
                      className="size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue"
                      aria-label={`Sélectionner ${getRowLabel(item)}`}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-middle">
                      {column.render(item)}
                    </td>
                  ))}
                  <td className="px-4 py-3 align-middle">{renderActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
