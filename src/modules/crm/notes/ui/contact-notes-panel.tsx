"use client";

import { FileText, Lock, Search, Star, Tag, UsersRound } from "lucide-react";
import { SectionCard, entityInputClassName } from "@/ui";
import type { ContactNoteFilters } from "@/modules/crm/contacts/ui/details/hooks/use-contact-details";
import type { Note, NoteVisibility } from "../note.types";
import { createNoteExcerpt, isPinnedNote } from "../note.utils";

export function ContactNotesPanel({
  filters,
  notes,
  onFiltersChange
}: {
  filters: ContactNoteFilters;
  notes: readonly Note[];
  onFiltersChange: (filters: ContactNoteFilters) => void;
}) {
  const pinnedNotes = notes.filter(isPinnedNote);
  const recentNotes = notes.filter((note) => !isPinnedNote(note));

  return (
    <SectionCard className="p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Notes</p>
          <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Connaissance contact</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Notes CRM liées au contact et prêtes pour les futurs contextes IA.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm shadow-slate-200/30 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:shadow-none">
            <Search size={16} className="text-slate-400" />
            <input value={filters.query} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher..." />
          </label>
          <select value={filters.visibility} onChange={(event) => onFiltersChange({ ...filters, visibility: event.target.value as NoteVisibility | "all" })} className={entityInputClassName}>
            <option value="all">Toutes visibilités</option>
            <option value="private">Privée</option>
            <option value="team">Équipe</option>
            <option value="company">Société</option>
          </select>
          <select value={filters.sortDirection} onChange={(event) => onFiltersChange({ ...filters, sortDirection: event.target.value as "asc" | "desc" })} className={entityInputClassName}>
            <option value="desc">Plus récentes</option>
            <option value="asc">Plus anciennes</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <NoteColumn emptyText="Aucune note épinglée pour ce contact." notes={pinnedNotes} title="Notes épinglées" variant="pinned" />
        <NoteColumn emptyText="Aucune note récente pour ce contact." notes={recentNotes} title="Notes récentes" variant="recent" />
      </div>
    </SectionCard>
  );
}

function NoteColumn({ emptyText, notes, title, variant }: { emptyText: string; notes: readonly Note[]; title: string; variant: "pinned" | "recent" }) {
  const Icon = variant === "pinned" ? Star : FileText;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-display text-sm font-bold text-hicotech-navy dark:text-white">
          <Icon size={16} />
          {title}
        </h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">{notes.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {notes.length > 0 ? notes.map((note) => <NoteCard key={note.id} note={note} />) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-300">{emptyText}</p>}
      </div>
    </section>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:shadow-md hover:shadow-slate-200/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:hover:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{note.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{createNoteExcerpt(note.content, 150)}</p>
        </div>
        <VisibilityBadge visibility={note.visibility} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {note.tags.map((tag) => (
          <Badge key={tag} label={tag} />
        ))}
        {note.attachments.length > 0 && <Badge label={`${note.attachments.length} pièce(s) jointe(s)`} />}
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-400">
        {note.authorId} · {formatDate(note.updatedAt)}
      </p>
    </article>
  );
}

function VisibilityBadge({ visibility }: { visibility: NoteVisibility }) {
  const styles: Record<NoteVisibility, string> = {
    private: "bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-200",
    team: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    company: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"
  };
  const Icon = visibility === "private" ? Lock : visibility === "team" ? UsersRound : FileText;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${styles[visibility]}`}>
      <Icon size={13} />
      {formatNoteVisibility(visibility)}
    </span>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">
      <Tag size={11} />
      {label}
    </span>
  );
}

function formatNoteVisibility(visibility: NoteVisibility) {
  const labels: Record<NoteVisibility, string> = {
    private: "Privée",
    team: "Équipe",
    company: "Société"
  };
  return labels[visibility];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
