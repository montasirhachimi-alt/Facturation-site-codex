import type { EntityMetric } from "../types/entity-ui.types";

export function MetricCard({ icon: Icon, label, value, helper }: EntityMetric) {
  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_rgba(10,30,63,0.10)] shadow-slate-200/70 transition duration-200 hover:-translate-y-1.5 hover:border-hicotech-blue/35 hover:shadow-[0_28px_80px_rgba(13,110,253,0.16)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <span className="absolute inset-x-0 top-0 h-1.5 bg-hicotech-blue" />
      <span className="absolute -right-10 -top-10 size-28 rounded-full bg-hicotech-sky/80 transition group-hover:scale-125 dark:bg-hicotech-blue/10" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-300">{label}</p>
          <p className="mt-4 font-display text-4xl font-bold leading-none text-hicotech-navy dark:text-white">{value}</p>
        </div>
        <div className="relative grid size-14 place-items-center rounded-[1.15rem] bg-hicotech-navy text-white shadow-lg shadow-slate-300/70 ring-1 ring-slate-900/5 transition group-hover:bg-hicotech-blue dark:bg-hicotech-blue dark:shadow-none">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-5 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">{helper}</p>
    </article>
  );
}
