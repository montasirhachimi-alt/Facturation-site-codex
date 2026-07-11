import { Archive, Eye, Pencil } from "lucide-react";
import { EntityActionButton, EntityActionMenu, EntityTable, type EntityTableColumn } from "@/ui";
import type { Customer, CustomerId } from "../../customer.types";
import type { CustomerSortKey } from "../hooks/use-customers-page";
import { CustomerEmptyState } from "../components/customer-empty-state";
import { CustomerStatusBadge } from "../components/customer-status-badge";

const columns: Array<EntityTableColumn<Customer, CustomerSortKey>> = [
  {
    key: "displayName",
    label: "Client",
    sortable: true,
    sortKey: "displayName",
    render: (customer) => (
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-hicotech-navy text-sm font-bold text-white shadow-sm shadow-slate-300/60 dark:bg-hicotech-blue dark:shadow-none">
          {customer.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-hicotech-navy dark:text-white">{customer.displayName}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{customer.type === "company" ? "Société" : "Particulier"}</p>
        </div>
      </div>
    )
  },
  {
    key: "companyName",
    label: "Société",
    sortable: true,
    sortKey: "companyName",
    render: (customer) => <span className="font-semibold text-slate-700 dark:text-slate-200">{customer.companyName ?? "-"}</span>
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
    sortKey: "email",
    render: (customer) => <span className="text-slate-600 dark:text-slate-300">{customer.email ?? "-"}</span>
  },
  {
    key: "phone",
    label: "Téléphone",
    sortable: true,
    sortKey: "phone",
    render: (customer) => <span className="text-slate-600 dark:text-slate-300">{customer.phone ?? "-"}</span>
  },
  {
    key: "status",
    label: "Statut",
    sortable: true,
    sortKey: "status",
    render: (customer) => <CustomerStatusBadge status={customer.status} />
  },
  {
    key: "updatedAt",
    label: "Mis à jour",
    sortable: true,
    sortKey: "updatedAt",
    render: (customer) => <span className="text-slate-600 dark:text-slate-300">{formatShortDate(customer.updatedAt)}</span>
  }
];

export function CustomersTable({
  canCreate,
  canEdit,
  customers,
  isLoading,
  onArchive,
  onCreate,
  onEdit,
  onView,
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
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  onSort: (field: CustomerSortKey) => void;
  onToggleAll: () => void;
  onToggleRow: (id: CustomerId) => void;
  selectedIds: readonly CustomerId[];
  sort: Readonly<{ field: CustomerSortKey; direction: "asc" | "desc" }>;
}) {
  const allVisibleSelected = customers.length > 0 && customers.every((customer) => selectedIds.includes(customer.id));

  return (
    <EntityTable
      allVisibleSelected={allVisibleSelected}
      bulkLabel={`${selectedIds.length} sélectionné(s)`}
      columns={columns}
      emptyState={<CustomerEmptyState canCreate={canCreate} onCreate={onCreate} />}
      getRowLabel={(customer) => customer.displayName}
      isLoading={isLoading}
      items={customers}
      onSort={onSort}
      onOpenRow={onView}
      onToggleAll={onToggleAll}
      onToggleRow={onToggleRow}
      renderActions={(customer) => (
        <EntityActionMenu>
          <EntityActionButton icon={<Eye size={16} />} label="Voir" onClick={() => onView(customer)} />
          <EntityActionButton icon={<Pencil size={16} />} label="Modifier" disabled={!canEdit} disabledReason="Modification client non autorisée." onClick={() => onEdit(customer)} />
          <EntityActionButton icon={<Archive size={16} />} label="Archiver" disabled={!canEdit} disabledReason="Archivage client non autorisé." onClick={() => onArchive(customer)} danger />
        </EntityActionMenu>
      )}
      selectedIds={selectedIds}
      sort={sort}
      subtitle="Vue commerciale centralisée du portefeuille client."
      title="Clients"
    />
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
