"use client";

import { Filter, Plus, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { EntityFilterPanel, EntitySearchBar, EntityToolbar } from "@/ui";
import type { CustomerStatus, CustomerType } from "../../customer.types";

export function CustomersToolbar({
  canCreate,
  onCreate,
  onRefresh,
  onResetPage,
  query,
  setQuery,
  setStatus,
  setTag,
  setType,
  status,
  tag,
  tagOptions,
  type
}: {
  canCreate: boolean;
  onCreate: () => void;
  onRefresh: () => void;
  onResetPage: () => void;
  query: string;
  setQuery: (value: string) => void;
  setStatus: (value: CustomerStatus | "all") => void;
  setTag: (value: string) => void;
  setType: (value: CustomerType | "all") => void;
  status: CustomerStatus | "all";
  tag: string;
  tagOptions: readonly string[];
  type: CustomerType | "all";
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [query.trim(), status !== "all", type !== "all", tag !== "all"].filter(Boolean).length;

  return (
    <EntityToolbar
      actions={
        <>
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white ${
              activeFilterCount > 0 || filtersOpen
                ? "border-hicotech-blue/30 bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15"
                : "border-slate-200 text-hicotech-navy hover:bg-hicotech-cloud dark:hover:bg-hicotech-dark-page"
            }`}
          >
            <Filter size={16} />
            Filtres
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-hicotech-blue px-1.5 py-0.5 text-[10px] font-black text-white">{activeFilterCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page"
          >
            <RefreshCcw size={16} />
            Actualiser
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20"
            >
              <Plus size={18} />
              Ajouter client
            </button>
          )}
        </>
      }
    >
      {filtersOpen ? (
        <EntityFilterPanel>
          <EntitySearchBar
            value={query}
            onChange={(value) => {
              setQuery(value);
              onResetPage();
            }}
            placeholder="Rechercher client, société, email, téléphone..."
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as CustomerStatus | "all");
              onResetPage();
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-hicotech-navy outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            <option value="lead">Prospects</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as CustomerType | "all");
              onResetPage();
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-hicotech-navy outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            aria-label="Filtrer par type"
          >
            <option value="all">Tous les types</option>
            <option value="company">Sociétés</option>
            <option value="individual">Particuliers</option>
          </select>
          <select
            value={tag}
            onChange={(event) => {
              setTag(event.target.value);
              onResetPage();
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-hicotech-navy outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            aria-label="Filtrer par tag"
          >
            {tagOptions.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Tous les tags" : item}
              </option>
            ))}
          </select>
        </EntityFilterPanel>
      ) : (
        <div className="min-w-0 flex-1">
          <EntitySearchBar
            value={query}
            onChange={(value) => {
              setQuery(value);
              onResetPage();
            }}
            placeholder="Rechercher client, société, email, téléphone..."
          />
        </div>
      )}
    </EntityToolbar>
  );
}
