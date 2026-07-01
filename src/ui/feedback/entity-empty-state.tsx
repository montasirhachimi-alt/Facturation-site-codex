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
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-14 text-center dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
      <div className="grid size-14 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
