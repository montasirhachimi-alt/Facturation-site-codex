"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { hydrateProductCatalogPersistence } from "@/platform/persistence";
import { PRODUCTS_WORKSPACE_ID, type Product, type ProductId } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import { entityInputClassName } from "@/ui/forms/form-field";
import {
  createEmptySalesLineItem,
  getSalesLineSubtotal,
  getSalesLineTax,
  getSalesLineTotal,
  productToSalesPickerItem
} from "./sales-line-item.utils";
import type { SalesLineItemDraft } from "./sales-line-item.types";

export function SalesLineItemsEditor({
  currency,
  lines,
  onChange
}: {
  currency: string;
  lines: readonly SalesLineItemDraft[];
  onChange: (lines: readonly SalesLineItemDraft[]) => void;
}) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    void hydrateProductCatalogPersistence();
    return subscribeToProductStore(() => setVersion((value) => value + 1));
  }, []);

  const products = useMemo(() => {
    void version;
    return productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
  }, [version]);
  const productItems = useMemo(() => products.map(productToSalesPickerItem), [products]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  function updateLine(lineId: string, patch: Partial<SalesLineItemDraft>) {
    onChange(lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }

  function addLine() {
    onChange([...lines, createEmptySalesLineItem("sales-line")]);
  }

  function selectProduct(lineId: string, product?: Product) {
    if (!product) {
      updateLine(lineId, {
        productId: undefined,
        productSku: undefined,
        productName: undefined
      });
      return;
    }

    updateLine(lineId, {
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      description: product.name,
      unit: product.unit,
      unitPrice: product.sellingPrice,
      taxRate: product.vatRate
    });
  }

  function removeLine(lineId: string) {
    const next = lines.filter((line) => line.id !== lineId);
    onChange(next.length > 0 ? next : [createEmptySalesLineItem("sales-line")]);
  }

  return (
    <section className="md:col-span-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Lignes commerciales</h4>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              Sélectionnez un produit existant ou renseignez une ligne manuelle.
            </p>
          </div>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-hicotech-blue/20 bg-hicotech-blue/10 px-3 py-2 text-sm font-bold text-hicotech-blue transition hover:bg-hicotech-blue/15 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10"
          >
            <Plus size={16} />
            Ajouter une ligne
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {lines.map((line, index) => (
            <article key={line.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/35">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Ligne {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 dark:border-red-400/30 dark:bg-hicotech-dark-card dark:text-red-200"
                  aria-label={`Supprimer la ligne ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(180px,1.1fr)_minmax(220px,1.4fr)_86px_110px_80px_80px_120px]">
                <SmartEntityPicker
                  label="Produit"
                  items={productItems}
                  value={line.productId ?? ""}
                  onChange={({ item }) => {
                    selectProduct(line.id, item ? productById.get(item.id as ProductId) : undefined);
                  }}
                  placeholder="Rechercher un produit..."
                  helper={line.productSku ? `${line.productSku} · identité produit conservée` : "Optionnel"}
                />
                <label className="block">
                  <span className="text-sm font-bold text-hicotech-navy dark:text-white">Description</span>
                  <input
                    value={line.description}
                    onChange={(event) => updateLine(line.id, { description: event.target.value })}
                    className={entityInputClassName}
                    placeholder="Description de la ligne"
                    aria-label={`Description ligne ${index + 1}`}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-hicotech-navy dark:text-white">Quantité</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={line.quantity}
                    onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })}
                    className={entityInputClassName}
                    aria-label={`Quantité ligne ${index + 1}`}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-hicotech-navy dark:text-white">Prix HT</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(event) => updateLine(line.id, { unitPrice: Number(event.target.value) })}
                    className={entityInputClassName}
                    aria-label={`Prix unitaire ligne ${index + 1}`}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-hicotech-navy dark:text-white">Unité</span>
                  <input
                    value={line.unit ?? "piece"}
                    onChange={(event) => updateLine(line.id, { unit: event.target.value })}
                    className={entityInputClassName}
                    aria-label={`Unité ligne ${index + 1}`}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-hicotech-navy dark:text-white">TVA %</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={line.taxRate}
                    onChange={(event) => updateLine(line.id, { taxRate: Number(event.target.value) })}
                    className={entityInputClassName}
                    aria-label={`TVA ligne ${index + 1}`}
                  />
                </label>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Total</p>
                  <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{formatLineMoney(getSalesLineTotal(line), currency)}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    HT {formatLineMoney(getSalesLineSubtotal(line), currency)} · TVA {formatLineMoney(getSalesLineTax(line), currency)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatLineMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}
