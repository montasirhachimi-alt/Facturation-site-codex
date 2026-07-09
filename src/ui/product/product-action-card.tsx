import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";

export function ProductActionCard({
  description,
  href,
  icon: Icon,
  label
}: {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <a
      href={href}
      className="group relative min-h-32 overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-[0_14px_42px_rgba(10,30,63,0.08)] transition duration-200 hover:-translate-y-1 hover:border-hicotech-blue/30 hover:shadow-[0_20px_58px_rgba(13,110,253,0.12)] focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none"
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-hicotech-blue" />
      <span className="absolute -right-10 -top-10 size-24 rounded-full bg-hicotech-sky/70 transition group-hover:scale-110 dark:bg-hicotech-blue/10" />
      <div className="flex items-start justify-between gap-3">
        <span className="relative grid size-11 place-items-center rounded-xl bg-hicotech-navy text-white shadow-md shadow-slate-300/60 transition group-hover:bg-hicotech-blue dark:bg-hicotech-blue/20 dark:shadow-none">
          <Icon size={17} />
        </span>
        <span className="relative grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition group-hover:border-hicotech-blue/30 group-hover:bg-hicotech-sky group-hover:text-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <Plus size={15} />
        </span>
      </div>
      <p className="relative mt-4 text-base font-bold text-hicotech-navy dark:text-white">{label}</p>
      <p className="relative mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">{description}</p>
    </a>
  );
}
