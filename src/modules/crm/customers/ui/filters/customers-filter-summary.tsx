import { EntityFilterSummary } from "@/ui";
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

  return <EntityFilterSummary items={active} onClear={onClear} />;
}
