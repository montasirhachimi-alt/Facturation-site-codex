import { Activity, CalendarClock, FileText, FolderOpen, Pin, StickyNote } from "lucide-react";
import { SectionCard } from "@/ui";

const inspectorSections = [
  { icon: Activity, title: "Activité récente", text: "5 interactions de démonstration préparées" },
  { icon: Pin, title: "Épinglé", text: "Compte stratégique en préparation" },
  { icon: FolderOpen, title: "Fichiers", text: "Disponible dans un futur module" },
  { icon: CalendarClock, title: "Réunions à venir", text: "1 réunion de démonstration" },
  { icon: FileText, title: "Documents récents", text: "Disponible dans un futur module" },
  { icon: StickyNote, title: "Notes récentes", text: "3 notes de démonstration préparées" }
];

export function CompanyInspectorPanel() {
  return (
    <aside className="space-y-4 xl:sticky xl:top-40 xl:self-start">
      <SectionCard className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Inspecteur</p>
        <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Contexte société</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">Une vue compacte de ce qui compte autour de cette société.</p>
      </SectionCard>

      {inspectorSections.map((section) => {
        const Icon = section.icon;
        return (
          <SectionCard key={section.title} className="p-4 transition hover:-translate-y-0.5 hover:border-hicotech-blue/25">
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
                <Icon size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-hicotech-navy dark:text-white">{section.title}</h3>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-300">{section.text}</p>
              </div>
            </div>
          </SectionCard>
        );
      })}
    </aside>
  );
}
