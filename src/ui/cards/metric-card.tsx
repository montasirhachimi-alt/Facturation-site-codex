import type { EntityMetric } from "../types/entity-ui.types";

export function MetricCard({ icon: Icon, label, value, helper }: EntityMetric) {
  return (
    <article className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-hicotech-blue/25 hover:shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{value}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-300">{helper}</p>
    </article>
  );
}
