import { useRouter } from "next/navigation";
import { Archive, Eye, Link2, Pencil } from "lucide-react";
import { EntityActionButton, EntityActionMenu, EntityEmptyState, EntityTable, type EntityTableColumn } from "@/ui";
import type { Company, CompanyId } from "../../company.types";
import type { CompanySortKey } from "../hooks/use-companies-page";
import { CompanyStatusBadge } from "../components/company-status-badge";

const columns: Array<EntityTableColumn<Company, CompanySortKey>> = [
  {
    key: "logo",
    label: "Logo",
    render: (company) => (
      <div className="grid size-11 place-items-center rounded-xl bg-hicotech-navy text-sm font-bold text-white shadow-sm shadow-slate-300/60 dark:bg-hicotech-blue dark:shadow-none">
        {company.displayName.slice(0, 2).toUpperCase()}
      </div>
    )
  },
  {
    key: "displayName",
    label: "Société",
    sortable: true,
    sortKey: "displayName",
    render: (company) => (
      <div>
        <p className="font-bold text-hicotech-navy dark:text-white">{company.displayName}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{company.legalName}</p>
      </div>
    )
  },
  { key: "industry", label: "Secteur", sortable: true, sortKey: "industry", render: (company) => <span className="font-semibold text-slate-700 dark:text-slate-200">{company.industry}</span> },
  { key: "country", label: "Pays", sortable: true, sortKey: "country", render: (company) => <span className="text-slate-600 dark:text-slate-300">{company.country ?? "-"}</span> },
  { key: "owner", label: "Responsable", render: (company) => <span className="text-slate-600 dark:text-slate-300">{company.ownerId ?? "-"}</span> },
  { key: "email", label: "Email", sortable: true, sortKey: "email", render: (company) => <span className="text-slate-600 dark:text-slate-300">{company.email ?? "-"}</span> },
  { key: "phone", label: "Téléphone", sortable: true, sortKey: "phone", render: (company) => <span className="text-slate-600 dark:text-slate-300">{company.phone ?? "-"}</span> },
  { key: "status", label: "Statut", sortable: true, sortKey: "status", render: (company) => <CompanyStatusBadge status={company.status} /> },
  { key: "updatedAt", label: "Mis à jour", sortable: true, sortKey: "updatedAt", render: (company) => <span className="text-slate-600 dark:text-slate-300">{formatShortDate(company.updatedAt)}</span> }
];

export function CompaniesTable({
  canCreate,
  canWrite,
  companies,
  onArchive,
  onCreate,
  onEdit,
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
  onEdit: (company: Company) => void;
  onSort: (field: CompanySortKey) => void;
  onToggleAll: () => void;
  onToggleRow: (id: CompanyId) => void;
  selectedIds: readonly CompanyId[];
  sort: Readonly<{ field: CompanySortKey; direction: "asc" | "desc" }>;
}) {
  const router = useRouter();
  const allVisibleSelected = companies.length > 0 && companies.every((company) => selectedIds.includes(company.id));

  return (
    <EntityTable
      allVisibleSelected={allVisibleSelected}
      bulkLabel={`${selectedIds.length} sélectionnée(s)`}
      columns={columns}
      emptyState={<EntityEmptyState icon={Link2} title="Aucune société trouvée" description="Aucune société ne correspond aux critères sélectionnés. Ajustez les filtres ou créez un compte central." action={canCreate ? <button type="button" onClick={onCreate} className="rounded-xl bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200/60 transition hover:bg-blue-700">Ajouter société</button> : null} />}
      getRowLabel={(company) => company.displayName}
      items={companies}
      onSort={onSort}
      onOpenRow={(company) => router.push(`/crm/companies/${company.id}`)}
      onToggleAll={onToggleAll}
      onToggleRow={onToggleRow}
      renderActions={(company) => (
        <EntityActionMenu>
          <EntityActionButton icon={<Eye size={16} />} label="Voir" onClick={() => router.push(`/crm/companies/${company.id}`)} />
          <EntityActionButton icon={<Pencil size={16} />} label="Modifier" disabled={!canWrite} disabledReason="Modification société non autorisée." onClick={() => onEdit(company)} />
          <EntityActionButton icon={<Archive size={16} />} label="Archiver" disabled={!canWrite} disabledReason="Archivage société non autorisé." onClick={() => onArchive(company)} danger />
        </EntityActionMenu>
      )}
      selectedIds={selectedIds}
      sort={sort}
      subtitle="Sociétés centrales reliées aux contacts, opportunités, devis et factures."
      title="Sociétés"
    />
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
