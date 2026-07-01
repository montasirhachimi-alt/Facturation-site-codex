import { X } from "lucide-react";
import type { CustomerStatus, CustomerType } from "../../customer.types";

export function CustomersFilterSummary({
  query,
  status,
  tag,
  type,
  onClear
}: {
  query: string;
  status: CustomerStatus | "all";
  tag: string;
  type: CustomerType | "all";
  onClear: () => void;
}) {
  const active = [
    query ? `Recherche: ${query}` : undefined,
    status !== "all" ? `Statut: ${status}` : undefined,
    type !== "all" ? `Type: ${type}` : undefined,
    tag !== "all" ? `Tag: ${tag}` : undefined
  ].filter((item): item is string => Boolean(item));

  if (!active.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-300">
      {active.map((item) => (
        <span key={item} className="rounded-full bg-hicotech-sky px-3 py-1 text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
          {item}
        </span>
      ))}
      <button type="button" onClick={onClear} className="ml-auto inline-flex items-center gap-1 text-hicotech-blue">
        <X size={14} />
        Réinitialiser
      </button>
    </div>
  );
}
