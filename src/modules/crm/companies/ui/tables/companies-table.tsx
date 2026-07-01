import { Archive, Eye, Link2, MoreHorizontal, Pencil } from "lucide-react";
import { EntityActionButton, EntityActionMenu, EntityEmptyState, EntityTable, type EntityTableColumn } from "@/ui";
import type { Company, CompanyId } from "../../company.types";
import type { CompanySortKey } from "../hooks/use-companies-page";
import { CompanyStatusBadge } from "../components/company-status-badge";

const columns: Array<EntityTableColumn<Company, CompanySortKey>> = [
  {
    key: "logo",
    label: "Logo",
    render: (company) => (
      <div className="grid size-10 place-items-center rounded-lg bg-hicotech-navy text-sm font-bold text-white dark:bg-hicotech-blue">
        {company.displayName.slice(0, 2).toUpperCase()}
      </div>
    )
  },
  {
    key: "displayName",
    label: "Company",
    sortable: true,
    sortKey: "displayName",
    render: (company) => (
      <div>
        <p className="font-bold text-hicotech-navy dark:text-white">{company.displayName}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{company.legalName}</p>
      </div>
    )
  },
  { key: "industry", label: "Industry", sortable: true, sortKey: "industry", render: (company) => <span className="font-semibold text-slate-700 dark:text-slate-200">{company.industry}</span> },
  { key: "country", label: "Country", sortable: true, sortKey: "country", render: (company) => <span className="text-slate-600 dark:text-slate-300">{company.country ?? "-"}</span> },
  { key: "owner", label: "Owner", render: (company) => <span className="text-slate-600 dark:text-slate-300">{company.ownerId ?? "-"}</span> },
  { key: "email", label: "Email", sortable: true, sortKey: "email", render: (company) => <span className="text-slate-600 dark:text-slate-300">{company.email ?? "-"}</span> },
  { key: "phone", label: "Phone", sortable: true, sortKey: "phone", render: (company) => <span className="text-slate-600 dark:text-slate-300">{company.phone ?? "-"}</span> },
  { key: "status", label: "Status", sortable: true, sortKey: "status", render: (company) => <CompanyStatusBadge status={company.status} /> },
  { key: "updatedAt", label: "Updated", sortable: true, sortKey: "updatedAt", render: (company) => <span className="text-slate-600 dark:text-slate-300">{formatShortDate(company.updatedAt)}</span> }
];

export function CompaniesTable({
  canCreate,
  canWrite,
  companies,
  onArchive,
  onCreate,
  onSort,
  onToggleAll,
  onToggleRow,
  selectedIds,
  sort
}: {
  canCreate: boolean;
  canWrite: boolean;
  companies: readonly Company[];
  onArchive: (company: Company) => void;
  onCreate: () => void;
  onSort: (field: CompanySortKey) => void;
  onToggleAll: () => void;
  onToggleRow: (id: CompanyId) => void;
  selectedIds: readonly CompanyId[];
  sort: Readonly<{ field: CompanySortKey; direction: "asc" | "desc" }>;
}) {
  const allVisibleSelected = companies.length > 0 && companies.every((company) => selectedIds.includes(company.id));

  return (
    <EntityTable
      allVisibleSelected={allVisibleSelected}
      bulkLabel={`${selectedIds.length} sélectionnée(s)`}
      columns={columns}
      emptyState={<EntityEmptyState icon={Link2} title="Aucune société trouvée" description="Aucune société ne correspond aux critères sélectionnés." action={canCreate ? <button type="button" onClick={onCreate} className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">Ajouter société</button> : null} />}
      getRowLabel={(company) => company.displayName}
      items={companies}
      onSort={onSort}
      onToggleAll={onToggleAll}
      onToggleRow={onToggleRow}
      renderActions={(company) => (
        <EntityActionMenu>
          <EntityActionButton icon={<Eye size={16} />} label="Voir" />
          <EntityActionButton icon={<Pencil size={16} />} label="Modifier" disabled={!canWrite} />
          <EntityActionButton icon={<Archive size={16} />} label="Archiver" disabled={!canWrite} onClick={() => onArchive(company)} danger />
          <EntityActionButton icon={<Link2 size={16} />} label="Relations" />
          <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:text-slate-300 dark:hover:bg-hicotech-dark-page" aria-label="Plus d'actions">
            <MoreHorizontal size={16} />
          </button>
        </EntityActionMenu>
      )}
      selectedIds={selectedIds}
      sort={sort}
      subtitle="Sociétés centrales reliées aux futurs contacts, opportunités, devis, commandes et factures."
      title="Companies"
    />
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

