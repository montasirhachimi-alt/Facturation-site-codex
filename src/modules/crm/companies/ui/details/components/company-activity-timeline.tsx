import { CalendarClock, Mail, MessageCircle, Phone, StickyNote } from "lucide-react";
import { SectionCard } from "@/ui";

const activities = [
  { icon: CalendarClock, title: "Réunion", detail: "Revue du compte et prochains échanges", time: "Aujourd'hui — 09:30" },
  { icon: Phone, title: "Call", detail: "Appel de qualification avec le responsable achat", time: "Hier — 16:20" },
  { icon: Mail, title: "Email", detail: "Documents commerciaux envoyés", time: "Hier — 10:45" },
  { icon: MessageCircle, title: "Task", detail: "Préparer une proposition pour le prochain cycle", time: "Cette semaine" },
  { icon: StickyNote, title: "Note", detail: "Compte stratégique à suivre dans le CRM", time: "Cette semaine" }
];

export function CompanyActivityTimeline() {
  return (
    <SectionCard className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Timeline</p>
          <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Activity Timeline</h2>
        </div>
        <span className="rounded-full bg-hicotech-sky px-3 py-1 text-xs font-bold text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-blue-100">
          Mock data
        </span>
      </div>

      <ol className="mt-5 space-y-0">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <li key={`${activity.title}-${index}`} className="flex gap-4 border-b border-slate-100 py-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-hicotech-dark-border">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-blue-100">
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{activity.title}</h3>
                  <span className="text-xs font-semibold text-slate-400">{activity.time}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{activity.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
