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
    <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="relative grid size-16 place-items-center rounded-full bg-slate-50 text-hicotech-blue ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
        <div className="absolute -right-1 -top-1 size-4 rounded-full bg-hicotech-blue/10" />
        <Icon size={24} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
