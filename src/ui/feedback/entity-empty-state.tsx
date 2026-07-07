import type { LucideIcon } from "lucide-react";

export function EntityEmptyState({
  action,
  description,
  icon: Icon,
  title
}: {
  action?: React.ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="grid place-items-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-[0_22px_70px_rgba(10,30,63,0.10)] shadow-slate-200/70 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="relative grid size-28 place-items-center rounded-[1.6rem] bg-hicotech-navy text-white shadow-2xl shadow-slate-300/80 dark:bg-hicotech-blue dark:shadow-none">
        <div className="absolute -right-3 -top-3 grid size-9 place-items-center rounded-full bg-hicotech-blue text-white ring-4 ring-white dark:ring-hicotech-dark-card" />
        <div className="absolute -bottom-2 -left-2 h-10 w-16 rounded-full bg-white/15" />
        <Icon size={30} />
      </div>
      <h3 className="mt-7 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{title}</h3>
      <p className="mt-3 max-w-md text-base leading-7 text-slate-500 dark:text-slate-300">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
