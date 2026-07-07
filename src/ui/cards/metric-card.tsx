import type { EntityMetric } from "../types/entity-ui.types";

export function MetricCard({ icon: Icon, label, value, helper }: EntityMetric) {
  return (
    <article className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 transition duration-200 hover:border-hicotech-blue/25 hover:shadow-md hover:shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-300">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold leading-none text-hicotech-navy dark:text-white">{value}</p>
        </div>
        <div className="grid size-9 place-items-center rounded-lg bg-slate-50 text-hicotech-blue ring-1 ring-slate-100 dark:bg-white/10 dark:ring-white/10">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-300">{helper}</p>
    </article>
  );
}
