"use client";

import { Archive, Download, FileDown, FileSpreadsheet, Plus, Search, Upload } from "lucide-react";
import { EntityToolbar, entityInputClassName } from "@/ui";
import { PRODUCT_UNITS } from "../../product.constants";
import type { ProductCategory, ProductCategoryId, ProductStatus, ProductUnit } from "../../product.types";

export function ProductsToolbar({
  categories,
  categoryId,
  onCreate,
  onExportAll,
  onExportCsv,
  onExportFiltered,
  onExportSelected,
  onImport,
  onTemplateCsv,
  onTemplateXlsx,
  query,
  selectedCount,
  setCategoryId,
  setQuery,
  setStatus,
  setUnit,
  status,
  unit
}: {
  categories: readonly ProductCategory[];
  categoryId: ProductCategoryId | "all";
  onCreate: () => void;
  onExportAll: () => void;
  onExportCsv: () => void;
  onExportFiltered: () => void;
  onExportSelected: () => void;
  onImport: () => void;
  onTemplateCsv: () => void;
  onTemplateXlsx: () => void;
  query: string;
  selectedCount: number;
  setCategoryId: (value: ProductCategoryId | "all") => void;
  setQuery: (value: string) => void;
  setStatus: (value: ProductStatus | "all") => void;
  setUnit: (value: ProductUnit | "all") => void;
  status: ProductStatus | "all";
  unit: ProductUnit | "all";
}) {
  return (
    <EntityToolbar
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onTemplateXlsx} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            <FileSpreadsheet size={16} />
            Modèle XLSX
          </button>
          <button type="button" onClick={onTemplateCsv} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            <FileDown size={16} />
            Modèle CSV
          </button>
          <button type="button" onClick={onImport} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            <Upload size={16} />
            Importer
          </button>
          <button type="button" onClick={onExportFiltered} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            <Download size={16} />
            Exporter XLSX
          </button>
          <button type="button" onClick={onExportAll} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            Tous actifs
          </button>
          <button type="button" onClick={onExportCsv} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            CSV
          </button>
          <button type="button" onClick={onExportSelected} disabled={selectedCount === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            Sélection ({selectedCount})
          </button>
          <button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-200/60 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/15">
            <Plus size={16} />
            Nouveau produit
          </button>
        </div>
      }
    >
      <div className="grid flex-1 gap-2 md:grid-cols-[minmax(220px,1fr)_160px_160px_180px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${entityInputClassName} mt-0 pl-9`} placeholder="Rechercher un produit, SKU, code-barres..." />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus | "all")} className={`${entityInputClassName} mt-0`}>
          <option value="active">Actifs</option>
          <option value="archived">Archivés</option>
          <option value="all">Tous</option>
        </select>
        <select value={unit} onChange={(event) => setUnit(event.target.value as ProductUnit | "all")} className={`${entityInputClassName} mt-0`}>
          <option value="all">Toutes unités</option>
          {PRODUCT_UNITS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value as ProductCategoryId | "all")} className={`${entityInputClassName} mt-0`}>
          <option value="all">Toutes catégories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      {status === "archived" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
          <Archive size={13} />
          Archive
        </span>
      )}
    </EntityToolbar>
  );
}
