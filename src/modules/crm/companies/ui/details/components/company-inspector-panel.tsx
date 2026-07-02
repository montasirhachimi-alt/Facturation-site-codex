import { Activity, CalendarClock, FileText, FolderOpen, Pin, StickyNote } from "lucide-react";
import { SectionCard } from "@/ui";

const inspectorSections = [
  { icon: Activity, title: "Recent Activity", text: "5 mock interactions prepared" },
  { icon: Pin, title: "Pinned", text: "Strategic account placeholder" },
  { icon: FolderOpen, title: "Files", text: "Available in future module" },
  { icon: CalendarClock, title: "Upcoming Meetings", text: "1 meeting placeholder" },
  { icon: FileText, title: "Recent Documents", text: "Available in future module" },
  { icon: StickyNote, title: "Recent Notes", text: "3 mock notes prepared" }
];

export function CompanyInspectorPanel() {
  return (
    <aside className="space-y-4">
      <SectionCard className="p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Inspector</p>
        <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Company context</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">A compact view of what matters around this company.</p>
      </SectionCard>

      {inspectorSections.map((section) => {
        const Icon = section.icon;
        return (
          <SectionCard key={section.title} className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
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
