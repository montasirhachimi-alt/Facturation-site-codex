import type { EntityMetric } from "../types/entity-ui.types";

export function MetricCard({ icon: Icon, label, value, helper }: EntityMetric) {
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-hicotech-blue/25 hover:shadow-lg hover:shadow-slate-200/70 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-300">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold leading-none text-hicotech-navy dark:text-white">{value}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-xl bg-slate-50 text-hicotech-blue ring-1 ring-slate-100 transition group-hover:bg-hicotech-sky dark:bg-white/10 dark:ring-white/10">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">{helper}</p>
    </article>
  );
}
