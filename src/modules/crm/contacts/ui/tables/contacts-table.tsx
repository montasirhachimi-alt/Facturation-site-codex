import { Archive, Edit3, Eye, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { EntityActionButton, EntityActionMenu, EntityEmptyState, EntityTable, type EntityTableColumn } from "@/ui";
import { getContactAvatarLabel } from "../../contact.utils";
import type { Contact, ContactId } from "../../contact.types";
import type { ContactSortKey } from "../hooks/use-company-contacts-workspace";
import { ContactStatusBadge } from "../components/contact-status-badge";

const columns: Array<EntityTableColumn<Contact, ContactSortKey>> = [
  {
    key: "avatar",
    label: "Avatar",
    render: (contact) => (
      <div className="grid size-11 place-items-center rounded-xl bg-hicotech-navy text-sm font-bold text-white shadow-sm shadow-slate-300/60 dark:bg-hicotech-blue dark:shadow-none">
        {getContactAvatarLabel(contact)}
      </div>
    )
  },
  {
    key: "fullName",
    label: "Nom complet",
    sortable: true,
    sortKey: "fullName",
    render: (contact) => (
      <div>
        <p className="font-bold text-hicotech-navy dark:text-white">{contact.fullName}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{contact.role ?? "contact"}</p>
      </div>
    )
  },
  { key: "jobTitle", label: "Fonction", sortable: true, sortKey: "jobTitle", render: (contact) => <span className="text-slate-600 dark:text-slate-300">{contact.jobTitle ?? "-"}</span> },
  { key: "department", label: "Département", sortable: true, sortKey: "department", render: (contact) => <span className="font-semibold text-slate-700 dark:text-slate-200">{contact.department ?? "-"}</span> },
  { key: "email", label: "Email", sortable: true, sortKey: "email", render: (contact) => <span className="text-slate-600 dark:text-slate-300">{contact.email ?? "-"}</span> },
  { key: "mobilePhone", label: "Mobile", sortable: true, sortKey: "mobilePhone", render: (contact) => <span className="text-slate-600 dark:text-slate-300">{contact.mobilePhone ?? "-"}</span> },
  { key: "status", label: "Statut", sortable: true, sortKey: "status", render: (contact) => <ContactStatusBadge status={contact.status} /> },
  { key: "primary", label: "Contact principal", render: (contact) => <BooleanChip active={contact.isPrimaryContact} /> },
  { key: "decision", label: "Décideur", render: (contact) => <BooleanChip active={contact.isDecisionMaker} /> },
  { key: "updatedAt", label: "Mis à jour", sortable: true, sortKey: "updatedAt", render: (contact) => <span className="text-slate-600 dark:text-slate-300">{formatShortDate(contact.updatedAt)}</span> }
];

export function ContactsTable({
  canCreate,
  canWrite,
  contacts,
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
  contacts: readonly Contact[];
  onArchive: (contact: Contact) => void;
  onCreate: () => void;
  onEdit: (contact: Contact) => void;
  onSort: (field: ContactSortKey) => void;
  onToggleAll: () => void;
  onToggleRow: (id: ContactId) => void;
  selectedIds: readonly ContactId[];
  sort: Readonly<{ field: ContactSortKey; direction: "asc" | "desc" }>;
}) {
  const router = useRouter();
  const allVisibleSelected = contacts.length > 0 && contacts.every((contact) => selectedIds.includes(contact.id));

  return (
    <EntityTable
      allVisibleSelected={allVisibleSelected}
      bulkLabel={`${selectedIds.length} contact(s) sélectionné(s)`}
      columns={columns}
      emptyState={<EntityEmptyState icon={UsersRound} title="Aucun contact pour cette société" description="Ajoutez les personnes clés pour préparer les échanges, réunions et opportunités." action={canCreate ? <button type="button" onClick={onCreate} className="rounded-xl bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200/60 transition hover:bg-blue-700">Ajouter contact</button> : null} />}
      getRowLabel={(contact) => contact.fullName}
      items={contacts}
      onSort={onSort}
      onOpenRow={(contact) => router.push(`/crm/contacts/${contact.id}`)}
      onToggleAll={onToggleAll}
      onToggleRow={onToggleRow}
      renderActions={(contact) => (
        <EntityActionMenu>
          <EntityActionButton icon={<Eye size={16} />} label="Voir" onClick={() => router.push(`/crm/contacts/${contact.id}`)} />
          <EntityActionButton icon={<Edit3 size={16} />} label="Modifier" disabled={!canWrite} disabledReason="Modification contact non autorisée." onClick={() => onEdit(contact)} />
          <EntityActionButton icon={<Archive size={16} />} label="Archiver" disabled={!canWrite} disabledReason="Archivage contact non autorisé." onClick={() => onArchive(contact)} danger />
        </EntityActionMenu>
      )}
      selectedIds={selectedIds}
      sort={sort}
      subtitle="Contacts liés uniquement à cette société."
      title="Contacts"
    />
  );
}

function BooleanChip({ active }: { active: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-blue-100" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}>
      {active ? "Oui" : "Non"}
    </span>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
