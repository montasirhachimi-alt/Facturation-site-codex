"use client";

import { ArrowDownUp, Download, Search } from "lucide-react";
import { useMemo, useState } from "react";

type DataTableProps = {
  columns: string[];
  rows: string[][];
};

export function DataTable({ columns, rows }: DataTableProps) {
  const [query, setQuery] = useState("");
  const filteredRows = useMemo(
    () => rows.filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase())),
    [query, rows]
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full min-w-56 bg-transparent text-sm outline-none"
            placeholder="Rechercher..."
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-hicotech-navy dark:border-white/10 dark:text-white">
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
            <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-white/10 dark:text-white">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.join("-")} className="border-t border-slate-100 dark:border-white/10">
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
