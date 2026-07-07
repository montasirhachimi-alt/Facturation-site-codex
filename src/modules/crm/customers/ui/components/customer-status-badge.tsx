import { clsx } from "clsx";
import type { CustomerStatus } from "../../customer.types";

const labels: Record<CustomerStatus, string> = {
  active: "Actif",
  archived: "Archivé",
  inactive: "Inactif",
  lead: "Prospect"
};

const styles: Record<CustomerStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
  archived: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
  inactive: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
  lead: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/20"
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ring-1", styles[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
