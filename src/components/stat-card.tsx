import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  trend?: string;
  tone: "blue" | "green" | "orange" | "red";
};

const toneClasses = {
  blue: "bg-hicotech-sky text-hicotech-blue",
  green: "bg-emerald-50 text-hicotech-green",
  orange: "bg-orange-50 text-hicotech-orange",
  red: "bg-red-50 text-hicotech-red"
};

export function StatCard({ icon: Icon, label, value, detail, trend, tone }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-hicotech-blue/25 hover:shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
          <p className="mt-3 font-display text-2xl font-bold text-hicotech-navy dark:text-white">
            {value}
          </p>
        </div>
        <div className={clsx("rounded-lg p-3 shadow-sm", toneClasses[tone])}>
          <Icon size={22} />
        </div>
      </div>
      <p className={clsx("mt-4 text-sm font-semibold", tone === "red" ? "text-hicotech-red" : "text-hicotech-green")}>
        {trend ?? detail}
      </p>
    </article>
  );
}
