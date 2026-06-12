import { Plus } from "lucide-react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
};

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-hicotech-blue">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          {description}
        </p>
      </div>
      {action && (
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700">
          <Plus size={18} />
          {action}
        </button>
      )}
    </div>
  );
}
