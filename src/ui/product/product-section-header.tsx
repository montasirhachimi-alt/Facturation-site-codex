import type { LucideIcon } from "lucide-react";

export function ProductSectionHeader({
  description,
  icon: Icon,
  title
}: {
  description: string;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-hicotech-navy text-white shadow-lg shadow-slate-300/60 dark:bg-hicotech-blue dark:shadow-none">
          <Icon size={18} />
        </span>
      ) : null}
      <div>
        <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}
