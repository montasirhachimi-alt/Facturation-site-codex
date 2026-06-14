"use client";

import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 px-4 py-12 text-center dark:border-hicotech-dark-border">
      <div className="grid size-12 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-300">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
