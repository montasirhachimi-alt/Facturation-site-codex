import { StickyNote } from "lucide-react";
import { SectionCard } from "@/ui";

const notes = [
  "Décideur principal à identifier lors du prochain échange.",
  "Préparer une offre de maintenance annuelle.",
  "Segment prioritaire pour futures intégrations commerciales."
];

export function CompanyNotesPanel() {
  return (
    <SectionCard className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-100">
          <StickyNote size={18} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Notes</p>
          <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Notes récentes</h2>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {notes.map((note) => (
          <article key={note} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-sm leading-6 text-slate-600 transition hover:border-hicotech-blue/25 hover:bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-slate-300 dark:hover:bg-hicotech-dark-card">
            {note}
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
