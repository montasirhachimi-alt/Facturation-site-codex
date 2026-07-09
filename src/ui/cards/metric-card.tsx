import type { EntityMetric } from "../types/entity-ui.types";

export function MetricCard({ icon: Icon, label, value, helper }: EntityMetric) {
  return (
    <article className="group relative overflow-hidden rounded-[1.15rem] border border-slate-200/80 bg-white p-4 shadow-[0_14px_42px_rgba(10,30,63,0.08)] shadow-slate-200/60 transition duration-200 hover:-translate-y-1 hover:border-hicotech-blue/30 hover:shadow-[0_20px_58px_rgba(13,110,253,0.12)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <span className="absolute inset-x-0 top-0 h-1 bg-hicotech-blue" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-slate-400 dark:text-slate-300">{label}</p>
          <p className="mt-3 font-display text-3xl font-bold leading-none text-hicotech-navy dark:text-white">{value}</p>
        </div>
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-hicotech-navy text-white shadow-sm shadow-slate-300/60 ring-1 ring-slate-900/5 transition group-hover:bg-hicotech-blue dark:bg-hicotech-blue dark:shadow-none">
          <Icon size={16} strokeWidth={2.25} />
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">{helper}</p>
    </article>
  );
}
