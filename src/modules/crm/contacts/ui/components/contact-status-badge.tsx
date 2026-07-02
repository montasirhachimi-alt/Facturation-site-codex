import type { ContactStatus } from "../../contact.types";

const labels: Record<ContactStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  archived: "Archivé"
};

const classes: Record<ContactStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100",
  inactive: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  archived: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-100"
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${classes[status]}`}>{labels[status]}</span>;
}
