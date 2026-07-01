import { clsx } from "clsx";
import type { CompanyStatus } from "../../company.types";

const labels: Record<CompanyStatus, string> = {
  active: "Active",
  archived: "Archive",
  inactive: "Inactive",
  lead: "Prospect"
};

const styles: Record<CompanyStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
  archived: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
  inactive: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
  lead: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/20"
};

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1", styles[status])}>{labels[status]}</span>;
}

