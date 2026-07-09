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
    <div className="grid place-items-center rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center shadow-[0_12px_34px_rgba(10,30,63,0.06)] shadow-slate-200/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="grid size-16 place-items-center rounded-2xl bg-hicotech-navy text-white shadow-lg shadow-slate-300/60 dark:bg-hicotech-blue dark:shadow-none">
        <Icon size={24} />
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-hicotech-navy dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
