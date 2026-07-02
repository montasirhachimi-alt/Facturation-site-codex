import { EntityFilterSummary } from "@/ui";
import type { BooleanFilter } from "../hooks/use-company-contacts-workspace";
import type { ContactStatus } from "../../contact.types";

export function ContactsFilterSummary({
  decisionMaker,
  department,
  onClear,
  primary,
  query,
  status
}: {
  decisionMaker: BooleanFilter;
  department: string;
  onClear: () => void;
  primary: BooleanFilter;
  query: string;
  status: ContactStatus | "all";
}) {
  const items = [
    query.trim() ? `Recherche : ${query}` : null,
    status !== "all" ? `Statut : ${status}` : null,
    department !== "all" ? `Département : ${department}` : null,
    primary !== "all" ? `Principal : ${primary === "yes" ? "oui" : "non"}` : null,
    decisionMaker !== "all" ? `Décideur : ${decisionMaker === "yes" ? "oui" : "non"}` : null
  ].filter(Boolean) as string[];

  return <EntityFilterSummary items={items} onClear={onClear} />;
}
