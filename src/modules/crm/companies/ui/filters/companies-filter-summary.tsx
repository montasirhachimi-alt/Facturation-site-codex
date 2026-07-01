import { EntityFilterSummary } from "@/ui";
import type { CompanyIndustry, CompanyStatus } from "../../company.types";

export function CompaniesFilterSummary({
  country,
  industry,
  onClear,
  owner,
  query,
  status,
  tag
}: {
  country: string;
  industry: CompanyIndustry | "all";
  onClear: () => void;
  owner: string;
  query: string;
  status: CompanyStatus | "all";
  tag: string;
}) {
  const active = [
    query ? `Recherche: ${query}` : undefined,
    industry !== "all" ? `Industrie: ${industry}` : undefined,
    status !== "all" ? `Statut: ${status}` : undefined,
    country !== "all" ? `Pays: ${country}` : undefined,
    owner !== "all" ? `Owner: ${owner}` : undefined,
    tag !== "all" ? `Tag: ${tag}` : undefined
  ].filter((item): item is string => Boolean(item));

  return <EntityFilterSummary items={active} onClear={onClear} />;
}

