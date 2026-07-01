import { Archive, ArrowDown, ArrowUp, Eye, MoreHorizontal, Pencil } from "lucide-react";
import { clsx } from "clsx";
import type { Customer, CustomerId } from "../../customer.types";
import type { CustomerSortKey } from "../hooks/use-customers-page";
import { CustomerEmptyState } from "../components/customer-empty-state";
import { CustomerLoadingState } from "../components/customer-loading-state";
import { CustomerStatusBadge } from "../components/customer-status-badge";

const columns: Array<{ key: CustomerSortKey | "actions"; label: string; sortable?: boolean }> = [
  { key: "displayName", label: "Customer", sortable: true },
  { key: "companyName", label: "Company", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "phone", label: "Phone", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "updatedAt", label: "Updated", sortable: true },
  { key: "actions", label: "Actions" }
];

export function CustomersTable({
  canCreate,
  canEdit,
  customers,
  isLoading,
  onArchive,
  onCreate,
  onSort,
  onToggleAll,
  onToggleRow,
  selectedIds,
  sort
}: {
  canCreate: boolean;
  canEdit: boolean;
  customers: readonly Customer[];
  isLoading?: boolean;
  onArchive: (customer: Customer) => void;
  onCreate: () => void;
  onSort: (field: CustomerSortKey) => void;
  onToggleAll: () => void;
  onToggleRow: (id: CustomerId) => void;
  selectedIds: readonly CustomerId[];
  sort: Readonly<{ field: CustomerSortKey; direction: "asc" | "desc" }>;
}) {
  const allVisibleSelected = customers.length > 0 && customers.every((customer) => selectedIds.includes(customer.id));

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-hicotech-dark-border">
        <div>
          <h2 className="font-display text-base font-bold text-hicotech-navy dark:text-white">Customers</h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-300">Vue commerciale centralisée du portefeuille client.</p>
        </div>
        {selectedIds.length > 0 && (
          <span className="rounded-full bg-hicotech-blue/10 px-3 py-1 text-xs font-bold text-hicotech-blue">
            {selectedIds.length} sélectionné(s)
          </span>
        )}
      </div>

      {isLoading ? (
        <CustomerLoadingState />
      ) : customers.length === 0 ? (
        <div className="p-5">
          <CustomerEmptyState canCreate={canCreate} onCreate={onCreate} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-hicotech-sky text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    checked={allVisibleSelected}
                    onChange={onToggleAll}
                    type="checkbox"
                    className="size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue"
                    aria-label="Sélectionner les clients visibles"
                  />
                </th>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-display text-xs font-bold uppercase">
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.key as CustomerSortKey)}
                        className="inline-flex items-center gap-1 rounded-md outline-none focus:ring-2 focus:ring-hicotech-blue/30"
                      >
                        {column.label}
                        {sort.field === column.key && (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className={clsx(
                    "border-t border-slate-100 transition hover:bg-hicotech-cloud/70 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60",
                    selectedIds.includes(customer.id) && "bg-hicotech-sky/60 dark:bg-hicotech-blue/10"
                  )}
                >
                  <td className="px-4 py-4">
                    <input
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => onToggleRow(customer.id)}
                      type="checkbox"
                      className="size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue"
                      aria-label={`Sélectionner ${customer.displayName}`}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-lg bg-hicotech-navy text-sm font-bold text-white dark:bg-hicotech-blue">
                        {customer.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-hicotech-navy dark:text-white">{customer.displayName}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{customer.type === "company" ? "Société" : "Particulier"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{customer.companyName ?? "-"}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{customer.email ?? "-"}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{customer.phone ?? "-"}</td>
                  <td className="px-4 py-4">
                    <CustomerStatusBadge status={customer.status} />
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatShortDate(customer.updatedAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <RowAction icon={<Eye size={16} />} label="Voir" />
                      <RowAction icon={<Pencil size={16} />} label="Modifier" disabled={!canEdit} />
                      <RowAction icon={<Archive size={16} />} label="Archiver" disabled={!canEdit} onClick={() => onArchive(customer)} danger />
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:text-slate-300 dark:hover:bg-hicotech-dark-page"
                        aria-label="Plus d'actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RowAction({
  danger,
  disabled,
  icon,
  label,
  onClick
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition focus:outline-none focus:ring-4",
        danger
          ? "border-red-100 text-red-600 hover:bg-red-50 focus:ring-red-100 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-400/10"
          : "border-slate-200 text-hicotech-navy hover:bg-hicotech-cloud focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

