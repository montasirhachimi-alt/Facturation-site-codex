"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/modules/products";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import type { ProcurementSupplier, PurchaseOrderLine } from "../../procurement.types";
import { calculatePurchaseOrderTotals, createEmptyPurchaseOrderLine, formatProcurementMoney } from "../../procurement.utils";

export type PurchaseOrderFormState = {
  supplierId: string;
  issueDate: string;
  expectedDate: string;
  currency: string;
  reference: string;
  notes: string;
  discountRate: number;
  lines: PurchaseOrderLine[];
};

export function PurchaseOrderDialog({
  editing,
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open,
  products,
  suppliers
}: {
  editing?: boolean;
  error?: string | null;
  form: PurchaseOrderFormState;
  onChange: (form: PurchaseOrderFormState) => void;
  onClose: () => void;
  onSubmit: () => void | boolean | Promise<void | boolean>;
  open: boolean;
  products: readonly Product[];
  suppliers: readonly ProcurementSupplier[];
}) {
  const totals = useMemo(() => calculatePurchaseOrderTotals({ lines: form.lines, currency: form.currency, discountRate: form.discountRate }), [form]);
  const update = (key: keyof PurchaseOrderFormState, value: PurchaseOrderFormState[keyof PurchaseOrderFormState]) => onChange({ ...form, [key]: value });

  function updateLine(index: number, patch: Partial<PurchaseOrderLine>) {
    onChange({ ...form, lines: form.lines.map((line, current) => current === index ? { ...line, ...patch } : line) });
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateLine(index, {
      productId: product?.id,
      productSku: product?.sku,
      productName: product?.name,
      description: product?.name ?? "",
      unit: product?.unit ?? "piece",
      unitPrice: product?.purchasePrice ?? 0,
      taxRate: product?.vatRate ?? 20
    });
  }

  return (
    <EntityDialog
      description="Préparez une commande fournisseur avec lignes produits, coûts et conditions d'achat."
      error={error}
      eyebrow="Achats"
      footer={<FormActions onCancel={onClose} submitLabel={editing ? "Enregistrer" : "Créer la commande"} />}
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      size="xl"
      title={editing ? "Modifier la commande fournisseur" : "Nouvelle commande fournisseur"}
    >
      <div className="grid gap-4">
        <FormSection title="En-tête" description="Informations utilisées pour identifier le fournisseur, la livraison attendue et les conditions d'achat.">
          <FormField label="Fournisseur" required>
            <select className={entityInputClassName} value={form.supplierId} onChange={(event) => update("supplierId", event.target.value)}>
              <option value="">Sélectionner...</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.companyName}</option>)}
            </select>
          </FormField>
          <FormField label="Date">
            <input type="date" className={entityInputClassName} value={form.issueDate} onChange={(event) => update("issueDate", event.target.value)} />
          </FormField>
          <FormField label="Livraison prévue" help="Date attendue pour la réception fournisseur.">
            <input type="date" className={entityInputClassName} value={form.expectedDate} onChange={(event) => update("expectedDate", event.target.value)} />
          </FormField>
          <FormField label="Devise">
            <input className={entityInputClassName} value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} />
          </FormField>
          <FormField label="Référence fournisseur" help="Référence communiquée par le fournisseur, si disponible.">
            <input className={entityInputClassName} value={form.reference} onChange={(event) => update("reference", event.target.value)} />
          </FormField>
          <FormField label="Remise globale (%)" help="Remise appliquée au total HT de la commande.">
            <input type="number" min="0" max="100" className={entityInputClassName} value={form.discountRate} onChange={(event) => update("discountRate", Number(event.target.value))} />
          </FormField>
        </FormSection>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Lignes d&apos;achat</h3>
            <button type="button" onClick={() => update("lines", [...form.lines, createEmptyPurchaseOrderLine("po")])} className="inline-flex items-center gap-2 rounded-xl bg-hicotech-blue px-3 py-2 text-sm font-bold text-white">
              <Plus size={16} /> Ajouter
            </button>
          </div>
          <div className="grid gap-3">
            <div className="hidden grid-cols-[1.2fr_1.6fr_0.6fr_0.6fr_0.8fr_0.6fr_0.6fr_0.9fr_2.5rem] gap-2 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 lg:grid">
              <span>Produit</span>
              <span>Description</span>
              <span className="text-right">Qté</span>
              <span>Unité</span>
              <span className="text-right">Coût unitaire HT</span>
              <span className="text-right">Remise %</span>
              <span className="text-right">TVA %</span>
              <span className="text-right">Sous-total HT</span>
              <span className="sr-only">Action</span>
            </div>
            {form.lines.map((line, index) => (
              <div key={line.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-hicotech-dark-border lg:grid-cols-[1.2fr_1.6fr_0.6fr_0.6fr_0.8fr_0.6fr_0.6fr_0.9fr_2.5rem] lg:items-start">
                <LineField label="Produit">
                  <select className={entityInputClassName} value={line.productId ?? ""} onChange={(event) => selectProduct(index, event.target.value)}>
                    <option value="">Produit</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}
                  </select>
                </LineField>
                <LineField label="Description">
                  <input className={entityInputClassName} value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} placeholder="Description de l'achat" />
                </LineField>
                <LineField label="Qté">
                  <input type="number" min="0" className={`${entityInputClassName} lg:text-right`} value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
                </LineField>
                <LineField label="Unité">
                  <input className={entityInputClassName} value={line.unit} onChange={(event) => updateLine(index, { unit: event.target.value })} />
                </LineField>
                <LineField label="Coût unitaire HT" help="Coût d'achat hors taxe.">
                  <input type="number" min="0" className={`${entityInputClassName} lg:text-right`} value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })} />
                </LineField>
                <LineField label="Remise %">
                  <input type="number" min="0" max="100" className={`${entityInputClassName} lg:text-right`} value={line.discountRate} onChange={(event) => updateLine(index, { discountRate: Number(event.target.value) })} />
                </LineField>
                <LineField label="TVA %">
                  <input type="number" min="0" className={`${entityInputClassName} lg:text-right`} value={line.taxRate} onChange={(event) => updateLine(index, { taxRate: Number(event.target.value) })} />
                </LineField>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-right dark:bg-hicotech-dark-page/50">
                  <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 lg:hidden">Sous-total HT</span>
                  <span className="text-sm font-black text-hicotech-navy dark:text-white">{formatProcurementMoney(line.quantity * line.unitPrice, form.currency)}</span>
                </div>
                <button type="button" aria-label="Retirer la ligne" title="Retirer la ligne" onClick={() => update("lines", form.lines.filter((_, current) => current !== index))} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-500/10 dark:border-hicotech-dark-border dark:hover:bg-red-500/10">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {form.lines.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">Aucune ligne d&apos;achat. Cliquez sur &quot;Ajouter&quot; pour commencer.</p>
            )}
          </div>
        </section>

        <FormSection title="Notes">
          <FormField label="Notes">
            <textarea className={entityInputClassName} value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} />
          </FormField>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
            <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Résumé de la commande</p>
            <div className="mt-3 space-y-2 text-sm">
              <TotalRow label="Sous-total HT" value={formatProcurementMoney(totals.subtotal, form.currency)} />
              <TotalRow label="Remise" value={formatProcurementMoney(totals.discount, form.currency)} />
              <TotalRow label="TVA" value={formatProcurementMoney(totals.tax, form.currency)} />
              <TotalRow strong label="TOTAL TTC" value={formatProcurementMoney(totals.total, form.currency)} />
            </div>
          </div>
        </FormSection>
      </div>
    </EntityDialog>
  );
}

function LineField({ children, help, label }: { children: ReactNode; help?: string; label: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 lg:sr-only">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{help}</span>}
    </label>
  );
}

function TotalRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "border-t border-slate-200 pt-2 dark:border-hicotech-dark-border" : ""}`}>
      <span className={strong ? "font-black text-hicotech-navy dark:text-white" : "font-semibold text-slate-500 dark:text-slate-300"}>{label}</span>
      <span className={strong ? "font-black text-hicotech-blue" : "font-bold text-hicotech-navy dark:text-white"}>{value}</span>
    </div>
  );
}
