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
    <div className="flex items-start gap-2.5">
      {Icon ? (
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-hicotech-navy text-white shadow-md shadow-slate-300/50 dark:bg-hicotech-blue dark:shadow-none">
          <Icon size={16} />
        </span>
      ) : null}
      <div>
        <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
        <p className="mt-0.5 text-sm leading-5 text-slate-500 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}
