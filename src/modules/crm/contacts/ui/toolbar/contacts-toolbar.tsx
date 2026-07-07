import { Plus, RefreshCw } from "lucide-react";
import { EntityFilterPanel, EntitySearchBar, EntityToolbar, entityInputClassName } from "@/ui";
import type { BooleanFilter } from "../hooks/use-company-contacts-workspace";
import type { ContactStatus } from "../../contact.types";

export function ContactsToolbar({
  canCreate,
  decisionMaker,
  department,
  departmentOptions,
  onCreate,
  onRefresh,
  onResetPage,
  primary,
  query,
  setDecisionMaker,
  setDepartment,
  setPrimary,
  setQuery,
  setStatus,
  status
}: {
  canCreate: boolean;
  decisionMaker: BooleanFilter;
  department: string;
  departmentOptions: readonly string[];
  onCreate: () => void;
  onRefresh: () => void;
  onResetPage: () => void;
  primary: BooleanFilter;
  query: string;
  setDecisionMaker: (value: BooleanFilter) => void;
  setDepartment: (value: string) => void;
  setPrimary: (value: BooleanFilter) => void;
  setQuery: (value: string) => void;
  setStatus: (value: ContactStatus | "all") => void;
  status: ContactStatus | "all";
}) {
  return (
    <EntityToolbar
      actions={
        <>
          <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-white">
            <RefreshCw size={16} />
            Actualiser
          </button>
          {canCreate && (
            <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200/60 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/70">
              <Plus size={16} />
              Ajouter contact
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
          placeholder="Rechercher un contact, email, département..."
        />
        <select value={status} onChange={(event) => { setStatus(event.target.value as ContactStatus | "all"); onResetPage(); }} className={entityInputClassName} aria-label="Filtrer par statut">
          <option value="all">Tous statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="archived">Archivé</option>
        </select>
        <select value={department} onChange={(event) => { setDepartment(event.target.value); onResetPage(); }} className={entityInputClassName} aria-label="Filtrer par département">
          {departmentOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Tous départements" : option}
            </option>
          ))}
        </select>
        <select value={primary} onChange={(event) => { setPrimary(event.target.value as BooleanFilter); onResetPage(); }} className={entityInputClassName} aria-label="Filtrer les contacts principaux">
          <option value="all">Tous contacts</option>
          <option value="yes">Contacts principaux</option>
          <option value="no">Non principaux</option>
        </select>
        <select value={decisionMaker} onChange={(event) => { setDecisionMaker(event.target.value as BooleanFilter); onResetPage(); }} className={entityInputClassName} aria-label="Filtrer les décideurs">
          <option value="all">Tous décideurs</option>
          <option value="yes">Décideurs</option>
          <option value="no">Non décideurs</option>
        </select>
      </EntityFilterPanel>
    </EntityToolbar>
  );
}
