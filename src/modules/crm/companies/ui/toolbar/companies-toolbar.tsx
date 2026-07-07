import { Filter, Plus, RefreshCcw } from "lucide-react";
import { EntityFilterPanel, EntitySearchBar, EntityToolbar } from "@/ui";
import type { CompanyIndustry, CompanyStatus } from "../../company.types";

const industries: Array<CompanyIndustry | "all"> = ["all", "education", "healthcare", "technology", "finance", "retail", "manufacturing", "services", "government", "other", "unknown"];

export function CompaniesToolbar({
  canCreate,
  country,
  countryOptions,
  industry,
  onCreate,
  onRefresh,
  onResetPage,
  owner,
  ownerOptions,
  query,
  setCountry,
  setIndustry,
  setOwner,
  setQuery,
  setStatus,
  setTag,
  status,
  tag,
  tagOptions
}: {
  canCreate: boolean;
  country: string;
  countryOptions: readonly string[];
  industry: CompanyIndustry | "all";
  onCreate: () => void;
  onRefresh: () => void;
  onResetPage: () => void;
  owner: string;
  ownerOptions: readonly string[];
  query: string;
  setCountry: (value: string) => void;
  setIndustry: (value: CompanyIndustry | "all") => void;
  setOwner: (value: string) => void;
  setQuery: (value: string) => void;
  setStatus: (value: CompanyStatus | "all") => void;
  setTag: (value: string) => void;
  status: CompanyStatus | "all";
  tag: string;
  tagOptions: readonly string[];
}) {
  return (
    <EntityToolbar
      actions={
        <>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-white">
            <Filter size={16} />
            Filtres
          </button>
          <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-white">
            <RefreshCcw size={16} />
            Actualiser
          </button>
          {canCreate && (
            <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200/60 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/70 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20">
              <Plus size={18} />
              Ajouter société
            </button>
          )}
        </>
      }
    >
      <EntityFilterPanel>
        <EntitySearchBar
          value={query}
          onChange={(value) => {
            setQuery(value);
            onResetPage();
          }}
          placeholder="Rechercher société, secteur, email, téléphone..."
        />
        <select value={industry} onChange={(event) => { setIndustry(event.target.value as CompanyIndustry | "all"); onResetPage(); }} className={selectClassName} aria-label="Filtrer par industrie">
          {industries.map((item) => <option key={item} value={item}>{item === "all" ? "Toutes industries" : item}</option>)}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value as CompanyStatus | "all"); onResetPage(); }} className={selectClassName} aria-label="Filtrer par statut">
          <option value="all">Tous statuts</option>
          <option value="lead">Prospects</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
        </select>
        <select value={country} onChange={(event) => { setCountry(event.target.value); onResetPage(); }} className={selectClassName} aria-label="Filtrer par pays">
          {countryOptions.map((item) => <option key={item} value={item}>{item === "all" ? "Tous pays" : item}</option>)}
        </select>
        <select value={owner} onChange={(event) => { setOwner(event.target.value); onResetPage(); }} className={selectClassName} aria-label="Filtrer par propriétaire">
          {ownerOptions.map((item) => <option key={item} value={item}>{item === "all" ? "Tous owners" : item}</option>)}
        </select>
        <select value={tag} onChange={(event) => { setTag(event.target.value); onResetPage(); }} className={selectClassName} aria-label="Filtrer par tag">
          {tagOptions.map((item) => <option key={item} value={item}>{item === "all" ? "Tous tags" : item}</option>)}
        </select>
      </EntityFilterPanel>
    </EntityToolbar>
  );
}

const selectClassName = "rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-hicotech-navy outline-none transition focus:border-hicotech-blue focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white";
