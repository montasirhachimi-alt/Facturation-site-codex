import { ArrowDown, ArrowUp } from "lucide-react";
import { clsx } from "clsx";
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
  renderActions: (item: TEntity) => React.ReactNode;
  selectedIds: readonly string[];
  sort: Readonly<{ field: TSortKey; direction: "asc" | "desc" }>;
  subtitle: string;
  title: string;
}) {
  return (
    <SectionCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-hicotech-dark-border">
        <div>
          <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-300">{subtitle}</p>
        </div>
        {selectedIds.length > 0 && (
          <span className="rounded-full bg-hicotech-blue/10 px-3 py-1 text-xs font-bold text-hicotech-blue">
            {bulkLabel ?? `${selectedIds.length} sélectionné(s)`}
          </span>
        )}
      </div>

      {isLoading ? (
        <EntityLoadingState />
      ) : items.length === 0 ? (
        <div className="p-5">{emptyState}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-left text-hicotech-navy dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-white">
              <tr>
                <th className="w-12 px-5 py-3.5">
                  <input
                    checked={allVisibleSelected}
                    onChange={onToggleAll}
                    type="checkbox"
                    className="size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue"
                    aria-label="Sélectionner les lignes visibles"
                  />
                </th>
                {columns.map((column) => (
                  <th key={column.key} className={clsx("px-5 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300", column.className)}>
                    {column.sortable && column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.sortKey as TSortKey)}
                        className="inline-flex items-center gap-1 rounded-md outline-none focus:ring-2 focus:ring-hicotech-blue/30"
                      >
                        {column.label}
                        {sort.field === column.sortKey && (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
                <th className="px-5 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={clsx(
                    "border-t border-slate-100 transition duration-150 hover:bg-hicotech-cloud/70 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60",
                    selectedIds.includes(item.id) && "bg-hicotech-sky/60 dark:bg-hicotech-blue/10"
                  )}
                >
                  <td className="px-5 py-5">
                    <input
                      checked={selectedIds.includes(item.id)}
                      onChange={() => onToggleRow(item.id)}
                      type="checkbox"
                      className="size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue"
                      aria-label={`Sélectionner ${getRowLabel(item)}`}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-5 align-middle">
                      {column.render(item)}
                    </td>
                  ))}
                  <td className="px-5 py-5 align-middle">{renderActions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
