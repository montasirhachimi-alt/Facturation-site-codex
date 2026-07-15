"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Company } from "@/modules/crm/companies";
import type { Contact } from "@/modules/crm/contacts";
import type { Product } from "@/modules/products";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import type { QuoteCurrency } from "@/modules/sales/quotes";
import type { SalesOrderLine } from "../order.types";
import { calculateSalesOrderTotals } from "../order.utils";

export type SalesOrderFormState = {
  companyId: string;
  contactId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  currency: QuoteCurrency;
  customerReference: string;
  internalReference: string;
  notes: string;
  discountRate: number;
  lines: SalesOrderLine[];
};

export function createEmptySalesOrderLine(prefix = "so-line"): SalesOrderLine {
  return {
    id: `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: "",
    quantityOrdered: 1,
    quantityReserved: 0,
    quantityDelivered: 0,
    unit: "piece",
    unitPrice: 0,
    discountRate: 0,
    taxRate: 20
  };
}

export function SalesOrderDialog({
  companies,
  contacts,
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open,
  products,
  submitLabel = "Créer la commande",
  title = "Nouvelle commande client"
}: {
  companies: readonly Company[];
  contacts: readonly Contact[];
  error?: string | null;
  form: SalesOrderFormState;
  onChange: (form: SalesOrderFormState) => void;
  onClose: () => void;
  onSubmit: () => void | boolean | Promise<void | boolean>;
  open: boolean;
  products: readonly Product[];
  submitLabel?: string;
  title?: string;
}) {
  const totals = calculateSalesOrderTotals({ lines: form.lines, currency: form.currency, discountRate: form.discountRate });
  const selectedCompanyContacts = contacts.filter((contact) => !form.companyId || contact.companyId === form.companyId);

  function update(key: keyof SalesOrderFormState, value: SalesOrderFormState[keyof SalesOrderFormState]) {
    onChange({ ...form, [key]: value });
  }

  function updateLine(index: number, patch: Partial<SalesOrderLine>) {
    onChange({ ...form, lines: form.lines.map((line, current) => current === index ? { ...line, ...patch } : line) });
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    const currentLine = form.lines[index];
    if (currentLine?.productId && currentLine.productId === productId) {
      updateLine(index, {
        productId: currentLine.productId,
        productSku: currentLine.productSku,
        productName: currentLine.productName
      });
      return;
    }
    updateLine(index, {
      productId: product?.id,
      productSku: product?.sku,
      productName: product?.name,
      description: product?.name ?? "",
      unit: product?.unit ?? "piece",
      unitPrice: product?.sellingPrice ?? 0,
      taxRate: product?.vatRate ?? 20
    });
  }

  return (
    <EntityDialog
      description="Créer une commande client sans sortie physique de stock. La réservation est réalisée lors de la confirmation."
      error={error}
      eyebrow="Ventes"
      footer={<FormActions onCancel={onClose} submitLabel={submitLabel} />}
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      size="xl"
      title={title}
    >
      <div className="grid gap-4">
        <FormSection title="Client">
          <FormField label="Société" required>
            <select className={entityInputClassName} value={form.companyId} onChange={(event) => onChange({ ...form, companyId: event.target.value, contactId: "" })}>
              <option value="">Sélectionner...</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.displayName}</option>)}
            </select>
          </FormField>
          <FormField label="Contact">
            <select className={entityInputClassName} value={form.contactId} onChange={(event) => update("contactId", event.target.value)}>
              <option value="">Aucun contact</option>
              {selectedCompanyContacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}</option>)}
            </select>
          </FormField>
          <FormField label="Date de commande">
            <input type="date" className={entityInputClassName} value={form.orderDate} onChange={(event) => update("orderDate", event.target.value)} />
          </FormField>
          <FormField label="Livraison prévue">
            <input type="date" className={entityInputClassName} value={form.expectedDeliveryDate} onChange={(event) => update("expectedDeliveryDate", event.target.value)} />
          </FormField>
          <FormField label="Référence client">
            <input className={entityInputClassName} value={form.customerReference} onChange={(event) => update("customerReference", event.target.value)} />
          </FormField>
          <FormField label="Devise">
            <input className={entityInputClassName} value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase() as QuoteCurrency)} />
          </FormField>
        </FormSection>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Lignes commandées</h3>
            <button type="button" onClick={() => update("lines", [...form.lines, createEmptySalesOrderLine("so-line")])} className="inline-flex items-center gap-2 rounded-xl bg-hicotech-blue px-3 py-2 text-sm font-bold text-white">
              <Plus size={16} /> Ajouter
            </button>
          </div>
          <div className="mt-3 grid gap-3">
            {form.lines.map((line, index) => (
              <div key={line.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-hicotech-dark-border lg:grid-cols-[1.1fr_1.5fr_0.6fr_0.6fr_0.7fr_0.6fr_auto]">
                <select className={entityInputClassName} value={line.productId ?? ""} onChange={(event) => selectProduct(index, event.target.value)}>
                  <option value="">Produit</option>
                  {line.productId && !products.some((product) => product.id === line.productId) && (
                    <option value={line.productId}>{line.productSku ?? "Produit"} · {line.productName ?? line.description}</option>
                  )}
                  {products.filter((product) => product.active).map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}
                </select>
                <input className={entityInputClassName} value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} placeholder="Description" />
                <input type="number" min="0" className={entityInputClassName} value={line.quantityOrdered} onChange={(event) => updateLine(index, { quantityOrdered: Number(event.target.value) })} />
                <input className={entityInputClassName} value={line.unit} onChange={(event) => updateLine(index, { unit: event.target.value })} />
                <input type="number" min="0" className={entityInputClassName} value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })} />
                <input type="number" min="0" className={entityInputClassName} value={line.taxRate} onChange={(event) => updateLine(index, { taxRate: Number(event.target.value) })} />
                <button type="button" aria-label="Retirer la ligne" onClick={() => update("lines", form.lines.filter((_, current) => current !== index))} className="grid size-10 place-items-center rounded-xl border border-slate-200 text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <FormSection title="Notes et totaux">
          <FormField label="Remise globale (%)">
            <input type="number" min="0" max="100" className={entityInputClassName} value={form.discountRate} onChange={(event) => update("discountRate", Number(event.target.value))} />
          </FormField>
          <FormField label="Notes">
            <textarea className={entityInputClassName} value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} />
          </FormField>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 dark:text-white">
            Total: {new Intl.NumberFormat("fr-MA", { style: "currency", currency: form.currency, maximumFractionDigits: 0 }).format(totals.total)}
          </div>
        </FormSection>
      </div>
    </EntityDialog>
  );
}
