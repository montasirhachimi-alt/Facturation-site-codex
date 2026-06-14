"use client";

import { ArrowDownUp, Download, Eye, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";

type DataTableProps = {
  columns: string[];
  rows: string[][];
  loading?: boolean;
  error?: string | null;
  pageSize?: number;
};

export function DataTable({ columns, rows, loading = false, error = null, pageSize = 6 }: DataTableProps) {
  const [query, setQuery] = useState("");
  const filteredRows = useMemo(
    () => rows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase())),
    [query, rows]
  );
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="w-full min-w-56 bg-transparent text-sm outline-none dark:text-white dark:placeholder:text-slate-400"
            placeholder="Rechercher..."
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-hicotech-navy dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            <ArrowDownUp size={16} />
            Trier
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-hicotech-navy px-3 py-2 text-sm font-semibold text-white">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
              {[...columns, "Actions"].map((column) => (
                <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.join("-")} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">
                    {cell}
                  </td>
                ))}
                <td className="px-4 py-4">
                  <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold text-hicotech-navy transition hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20">
                    <Eye size={16} />
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <p className="p-5 text-sm font-semibold text-slate-500 dark:text-slate-300">Chargement des données...</p>}
      {error && <p className="p-5 text-sm font-semibold text-hicotech-red">{error}</p>}
      {!loading && !error && filteredRows.length === 0 && (
        <div className="p-5">
          <EmptyState icon={Search} title="Aucune donnée" description="Aucun résultat ne correspond aux critères sélectionnés." />
        </div>
      )}
      <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm dark:border-hicotech-dark-border md:flex-row md:items-center md:justify-between">
        <p className="text-slate-500 dark:text-slate-300">{filteredRows.length} résultat(s)</p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border">Précédent</button>
          <span className="font-bold text-hicotech-navy dark:text-white">{page} / {totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border">Suivant</button>
        </div>
      </div>
    </section>
  );
}
