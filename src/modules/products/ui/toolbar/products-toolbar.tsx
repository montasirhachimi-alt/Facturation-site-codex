"use client";

import { Archive, Plus, Search } from "lucide-react";
import { EntityToolbar, entityInputClassName } from "@/ui";
import { PRODUCT_UNITS } from "../../product.constants";
import type { ProductCategory, ProductCategoryId, ProductStatus, ProductUnit } from "../../product.types";

export function ProductsToolbar({
  categories,
  categoryId,
  onCreate,
  query,
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
  query: string;
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
        <button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-200/60 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/15">
          <Plus size={16} />
          Nouveau produit
        </button>
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
