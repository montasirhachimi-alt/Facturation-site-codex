"use client";

import { CalendarClock, FileText, Mail, MessageCircle, Phone, Search, Settings, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionCard, entityInputClassName } from "@/ui";
import type { Activity, ActivityPriority, ActivityStatus, ActivityType } from "@/modules/crm/activities";
import type { ContactActivityFilters } from "../hooks/use-contact-details";

const typeIcons: Record<ActivityType, LucideIcon> = {
  call: Phone,
  meeting: CalendarClock,
  email: Mail,
  task: MessageCircle,
  note: StickyNote,
  comment: MessageCircle,
  status_change: Settings,
  document: FileText,
  system: Settings,
  custom: MessageCircle
};

export function ContactActivitiesPanel({
  activities,
  filters,
  onFiltersChange
}: {
  activities: readonly Activity[];
  filters: ContactActivityFilters;
  onFiltersChange: (filters: ContactActivityFilters) => void;
}) {
  return (
    <SectionCard className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Activités</p>
          <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Timeline du contact</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Historique contextuel des échanges liés uniquement à ce contact.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            <Search size={16} className="text-slate-400" />
            <input value={filters.query} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher..." />
          </label>
          <select value={filters.type} onChange={(event) => onFiltersChange({ ...filters, type: event.target.value as ActivityType | "all" })} className={entityInputClassName}>
            <option value="all">Tous types</option>
            <option value="call">Appel</option>
            <option value="meeting">Réunion</option>
            <option value="email">Email</option>
            <option value="task">Tâche</option>
            <option value="note">Note</option>
            <option value="document">Document</option>
          </select>
          <select value={filters.priority} onChange={(event) => onFiltersChange({ ...filters, priority: event.target.value as ActivityPriority | "all" })} className={entityInputClassName}>
            <option value="all">Toutes priorités</option>
            <option value="low">Basse</option>
            <option value="normal">Normal</option>
            <option value="high">Haute</option>
            <option value="critical">Critique</option>
          </select>
          <select value={filters.status} onChange={(event) => onFiltersChange({ ...filters, status: event.target.value as ActivityStatus | "all" })} className={entityInputClassName}>
            <option value="all">Tous statuts</option>
            <option value="open">Ouverte</option>
            <option value="completed">Terminée</option>
            <option value="archived">Archivée</option>
          </select>
        </div>
      </div>

      <ol className="mt-5 space-y-0">
        {activities.length > 0 ? (
          activities.map((activity) => <ContactActivityItem key={activity.id} activity={activity} />)
        ) : (
          <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm text-slate-500 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 dark:text-slate-300">
            Aucune activité ne correspond à ce contact.
          </li>
        )}
      </ol>
    </SectionCard>
  );
}

function ContactActivityItem({ activity }: { activity: Activity }) {
  const Icon = typeIcons[activity.type];

  return (
    <li className="flex gap-4 border-b border-slate-100 py-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-hicotech-dark-border">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-blue-100">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{activity.title}</h3>
          <Badge label={formatActivityType(activity.type)} />
          <Badge label={formatActivityPriority(activity.priority)} />
          <Badge label={formatActivityStatus(activity.status)} />
        </div>
        {activity.description && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{activity.description}</p>}
        <p className="mt-2 text-xs font-semibold text-slate-400">
          {activity.performedBy} · {formatDate(activity.performedAt)}
        </p>
      </div>
    </li>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">{label}</span>;
}

function formatActivityType(type: ActivityType) {
  const labels: Record<ActivityType, string> = {
    call: "Appel",
    meeting: "Réunion",
    email: "Email",
    task: "Tâche",
    note: "Note",
    comment: "Commentaire",
    status_change: "Statut",
    document: "Document",
    system: "Système",
    custom: "Personnalisée"
  };
  return labels[type];
}

function formatActivityPriority(priority: ActivityPriority) {
  const labels: Record<ActivityPriority, string> = {
    low: "Basse",
    normal: "Normale",
    high: "Haute",
    critical: "Critique"
  };
  return labels[priority];
}

function formatActivityStatus(status: ActivityStatus) {
  const labels: Record<ActivityStatus, string> = {
    open: "Ouverte",
    completed: "Terminée",
    archived: "Archivée"
  };
  return labels[status];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
