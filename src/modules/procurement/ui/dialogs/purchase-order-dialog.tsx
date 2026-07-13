"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
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
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open,
  products,
  suppliers
}: {
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
      description="Commande fournisseur sans reception, stock ou comptabilite automatique."
      error={error}
      eyebrow="Achats"
      footer={<FormActions onCancel={onClose} submitLabel="Créer la commande" />}
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      size="xl"
      title="Nouvelle commande fournisseur"
    >
      <div className="grid gap-4">
        <FormSection title="En-tête">
          <FormField label="Fournisseur" required>
            <select className={entityInputClassName} value={form.supplierId} onChange={(event) => update("supplierId", event.target.value)}>
              <option value="">Sélectionner...</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.companyName}</option>)}
            </select>
          </FormField>
          <FormField label="Date">
            <input type="date" className={entityInputClassName} value={form.issueDate} onChange={(event) => update("issueDate", event.target.value)} />
          </FormField>
          <FormField label="Livraison prévue">
            <input type="date" className={entityInputClassName} value={form.expectedDate} onChange={(event) => update("expectedDate", event.target.value)} />
          </FormField>
          <FormField label="Devise">
            <input className={entityInputClassName} value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} />
          </FormField>
          <FormField label="Référence fournisseur">
            <input className={entityInputClassName} value={form.reference} onChange={(event) => update("reference", event.target.value)} />
          </FormField>
          <FormField label="Remise globale (%)">
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
            {form.lines.map((line, index) => (
              <div key={line.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-hicotech-dark-border lg:grid-cols-[1.2fr_1.6fr_0.6fr_0.6fr_0.7fr_0.6fr_0.7fr_auto]">
                <select className={entityInputClassName} value={line.productId ?? ""} onChange={(event) => selectProduct(index, event.target.value)}>
                  <option value="">Produit</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}
                </select>
                <input className={entityInputClassName} value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} placeholder="Description" />
                <input type="number" min="0" className={entityInputClassName} value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
                <input className={entityInputClassName} value={line.unit} onChange={(event) => updateLine(index, { unit: event.target.value })} />
                <input type="number" min="0" className={entityInputClassName} value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })} />
                <input type="number" min="0" max="100" className={entityInputClassName} value={line.discountRate} onChange={(event) => updateLine(index, { discountRate: Number(event.target.value) })} />
                <input type="number" min="0" className={entityInputClassName} value={line.taxRate} onChange={(event) => updateLine(index, { taxRate: Number(event.target.value) })} />
                <button type="button" aria-label="Retirer la ligne" onClick={() => update("lines", form.lines.filter((_, current) => current !== index))} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <FormSection title="Notes">
          <FormField label="Notes">
            <textarea className={entityInputClassName} value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} />
          </FormField>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 dark:text-white">
            Total: {formatProcurementMoney(totals.total, form.currency)}
          </div>
        </FormSection>
      </div>
    </EntityDialog>
  );
}
