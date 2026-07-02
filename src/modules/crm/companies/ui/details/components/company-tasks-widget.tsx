import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { SectionCard } from "@/ui";

const tasks = [
  { label: "Planifier un appel commercial", due: "Aujourd'hui", done: false },
  { label: "Envoyer la proposition de service", due: "Demain", done: false },
  { label: "Vérifier les documents société", due: "Cette semaine", done: true }
];

export function CompanyTasksWidget() {
  return (
    <SectionCard className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-100">
          <ListChecks size={18} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Tasks</p>
          <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Upcoming Tasks</h2>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {tasks.map((task) => (
          <li key={task.label} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            {task.done ? <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" /> : <Circle size={18} className="mt-0.5 text-slate-400" />}
            <div>
              <p className={`text-sm font-bold ${task.done ? "text-slate-400 line-through" : "text-hicotech-navy dark:text-white"}`}>{task.label}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{task.due}</p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
