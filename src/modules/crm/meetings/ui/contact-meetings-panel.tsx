"use client";

import { CalendarClock, CheckCircle2, Clock, MapPin, Search, UsersRound, XCircle } from "lucide-react";
import { SectionCard, entityInputClassName } from "@/ui";
import type { Meeting, MeetingStatus, MeetingType } from "../meeting.types";
import type { ContactMeetingFilters } from "@/modules/crm/contacts/ui/details/hooks/use-contact-details";

export function ContactMeetingsPanel({
  filters,
  meetings,
  onFiltersChange
}: {
  filters: ContactMeetingFilters;
  meetings: readonly Meeting[];
  onFiltersChange: (filters: ContactMeetingFilters) => void;
}) {
  const now = new Date().toISOString();
  const upcoming = meetings.filter((meeting) => meeting.startAt >= now && meeting.status !== "cancelled");
  const past = meetings.filter((meeting) => meeting.startAt < now || meeting.status === "completed");

  return (
    <SectionCard className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Meetings</p>
          <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Contact Meetings</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Réunions liées à ce contact et prêtes pour la future intégration calendrier.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            <Search size={16} className="text-slate-400" />
            <input value={filters.query} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher..." />
          </label>
          <select value={filters.meetingType} onChange={(event) => onFiltersChange({ ...filters, meetingType: event.target.value as MeetingType | "all" })} className={entityInputClassName}>
            <option value="all">Tous types</option>
            <option value="on_site">On-site</option>
            <option value="online">Online</option>
            <option value="phone_call">Phone call</option>
            <option value="demo">Demo</option>
            <option value="sales_meeting">Sales meeting</option>
            <option value="customer_success">Customer success</option>
          </select>
          <select value={filters.status} onChange={(event) => onFiltersChange({ ...filters, status: event.target.value as MeetingStatus | "all" })} className={entityInputClassName}>
            <option value="all">Tous statuts</option>
            <option value="planned">Planned</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filters.sortDirection} onChange={(event) => onFiltersChange({ ...filters, sortDirection: event.target.value as "asc" | "desc" })} className={entityInputClassName}>
            <option value="asc">Plus proches</option>
            <option value="desc">Plus récentes</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <MeetingColumn emptyText="Aucune réunion à venir pour ce contact." meetings={upcoming} title="Upcoming Meetings" />
        <MeetingColumn emptyText="Aucune réunion passée pour ce contact." meetings={past} title="Past Meetings" />
      </div>
    </SectionCard>
  );
}

function MeetingColumn({ emptyText, meetings, title }: { emptyText: string; meetings: readonly Meeting[]; title: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{title}</h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">{meetings.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {meetings.length > 0 ? meetings.map((meeting) => <MeetingCard key={meeting.id} meeting={meeting} />) : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-300">{emptyText}</p>}
      </div>
    </section>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-hicotech-blue/30 hover:shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{meeting.title}</h4>
          {meeting.description && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{meeting.description}</p>}
        </div>
        <MeetingStatusBadge status={meeting.status} />
      </div>
      <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2">
          <CalendarClock size={15} />
          {formatDate(meeting.startAt)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock size={15} />
          {formatTimeRange(meeting.startAt, meeting.endAt)}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin size={15} />
          {meeting.location ?? "Lieu à confirmer"}
        </span>
        <span className="inline-flex items-center gap-2">
          <UsersRound size={15} />
          {meeting.participants.length} participant(s)
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge label={formatMeetingType(meeting.meetingType)} />
        {meeting.tags.map((tag) => (
          <Badge key={tag} label={tag} />
        ))}
      </div>
    </article>
  );
}

function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const styles: Record<MeetingStatus, string> = {
    planned: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    confirmed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    completed: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200"
  };
  const Icon = status === "cancelled" ? XCircle : status === "completed" ? CheckCircle2 : CalendarClock;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
      <Icon size={13} />
      {status}
    </span>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">{label}</span>;
}

function formatMeetingType(type: MeetingType) {
  return type.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(value));
}

function formatTimeRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("fr-MA", { hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}
