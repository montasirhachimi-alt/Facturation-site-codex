import { Archive, CalendarClock, Edit3, Eye, Mail, MoreHorizontal, UsersRound } from "lucide-react";
import Link from "next/link";
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
      <div className="grid size-10 place-items-center rounded-xl bg-hicotech-navy text-sm font-bold text-white dark:bg-hicotech-blue">
        {getContactAvatarLabel(contact)}
      </div>
    )
  },
  {
    key: "fullName",
    label: "Full Name",
    sortable: true,
    sortKey: "fullName",
    render: (contact) => (
      <div>
        <p className="font-bold text-hicotech-navy dark:text-white">{contact.fullName}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{contact.role ?? "contact"}</p>
      </div>
    )
  },
  { key: "jobTitle", label: "Job Title", sortable: true, sortKey: "jobTitle", render: (contact) => <span className="text-slate-600 dark:text-slate-300">{contact.jobTitle ?? "-"}</span> },
  { key: "department", label: "Department", sortable: true, sortKey: "department", render: (contact) => <span className="font-semibold text-slate-700 dark:text-slate-200">{contact.department ?? "-"}</span> },
  { key: "email", label: "Email", sortable: true, sortKey: "email", render: (contact) => <span className="text-slate-600 dark:text-slate-300">{contact.email ?? "-"}</span> },
  { key: "mobilePhone", label: "Mobile", sortable: true, sortKey: "mobilePhone", render: (contact) => <span className="text-slate-600 dark:text-slate-300">{contact.mobilePhone ?? "-"}</span> },
  { key: "status", label: "Status", sortable: true, sortKey: "status", render: (contact) => <ContactStatusBadge status={contact.status} /> },
  { key: "primary", label: "Primary Contact", render: (contact) => <BooleanChip active={contact.isPrimaryContact} /> },
  { key: "decision", label: "Decision Maker", render: (contact) => <BooleanChip active={contact.isDecisionMaker} /> },
  { key: "updatedAt", label: "Updated", sortable: true, sortKey: "updatedAt", render: (contact) => <span className="text-slate-600 dark:text-slate-300">{formatShortDate(contact.updatedAt)}</span> }
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
  const allVisibleSelected = contacts.length > 0 && contacts.every((contact) => selectedIds.includes(contact.id));

  return (
    <EntityTable
      allVisibleSelected={allVisibleSelected}
      bulkLabel={`${selectedIds.length} contact(s) sélectionné(s)`}
      columns={columns}
      emptyState={<EntityEmptyState icon={UsersRound} title="Aucun contact pour cette société" description="Ajoutez les personnes clés de cette société pour préparer les futurs workflows CRM, emails, réunions et opportunités." action={canCreate ? <button type="button" onClick={onCreate} className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">Ajouter contact</button> : null} />}
      getRowLabel={(contact) => contact.fullName}
      items={contacts}
      onSort={onSort}
      onToggleAll={onToggleAll}
      onToggleRow={onToggleRow}
      renderActions={(contact) => (
        <EntityActionMenu>
          <Link
            href={`/crm/contacts/${contact.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page"
          >
            <Eye size={16} />
            Voir
          </Link>
          <EntityActionButton icon={<Edit3 size={16} />} label="Modifier" disabled={!canWrite} onClick={() => onEdit(contact)} />
          <EntityActionButton icon={<Archive size={16} />} label="Archiver" disabled={!canWrite} onClick={() => onArchive(contact)} danger />
          <EntityActionButton icon={<CalendarClock size={16} />} label="Activités" disabled />
          <EntityActionButton icon={<Mail size={16} />} label="Emails" disabled />
          <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:text-slate-300 dark:hover:bg-hicotech-dark-page" aria-label="Plus d'actions">
            <MoreHorizontal size={16} />
          </button>
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
