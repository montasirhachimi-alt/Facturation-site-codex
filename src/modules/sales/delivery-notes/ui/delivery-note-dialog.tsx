"use client";

import type { InventorySnapshot, Warehouse } from "@/modules/inventory";
import { adjustInventoryQuantityInput, formatInventoryQuantityInput, parseInventoryQuantityInput } from "@/modules/inventory/inventory.utils";
import type { Product } from "@/modules/products";
import type { SalesOrder } from "@/modules/sales/orders";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import type { DeliveryNoteLine } from "../delivery-note.types";
import { getRemainingToDeliver } from "../delivery-note.utils";

export type DeliveryNoteFormLine = Omit<DeliveryNoteLine, "quantityToDeliver"> & { quantityToDeliver: string };

export type DeliveryNoteFormState = {
  salesOrderId: string;
  warehouseId: string;
  deliveryDate: string;
  notes: string;
  lines: DeliveryNoteFormLine[];
};

export function parseDeliveryNoteFormLines(lines: readonly DeliveryNoteFormLine[]): DeliveryNoteLine[] {
  return lines.map((line) => ({
    ...line,
    quantityToDeliver: parseInventoryQuantityInput(line.quantityToDeliver)
  }));
}

export function createDeliveryNoteFormLines(lines: readonly DeliveryNoteLine[]): DeliveryNoteFormLine[] {
  return lines.map((line) => ({
    ...line,
    quantityToDeliver: formatInventoryQuantityInput(line.quantityToDeliver)
  }));
}

export function createDeliveryNoteForm(order: SalesOrder | undefined, warehouse: Warehouse | undefined, products: readonly Product[]): DeliveryNoteFormState {
  const productById = new Map(products.map((product) => [product.id, product]));
  return {
    salesOrderId: order?.id ?? "",
    warehouseId: order?.lines.find((line) => line.warehouseId)?.warehouseId ?? warehouse?.id ?? "",
    deliveryDate: new Date().toISOString().slice(0, 10),
    notes: order?.notes ?? "",
    lines: order?.lines.flatMap((line) => {
      const product = line.productId ? productById.get(line.productId) : undefined;
      const remaining = getRemainingToDeliver(line);
      if (!product?.flags.trackInventory || !product.active || remaining <= 0) return [];
      return [{
        id: `delivery-line-${line.id}-${Date.now()}`,
        salesOrderLineId: line.id,
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        description: line.description,
        unit: String(line.unit),
        quantityToDeliver: formatInventoryQuantityInput(remaining),
        quantityPosted: 0
      } satisfies DeliveryNoteFormLine];
    }) ?? []
  };
}

export function DeliveryNoteDialog({
  error,
  form,
  inventory,
  onChange,
  onClose,
  onOrderChange,
  onSubmit,
  open,
  orders,
  products,
  warehouses
}: {
  error?: string | null;
  form: DeliveryNoteFormState;
  inventory: InventorySnapshot;
  onChange: (form: DeliveryNoteFormState) => void;
  onClose: () => void;
  onOrderChange: (orderId: string) => void;
  onSubmit: () => void | boolean | Promise<void | boolean>;
  open: boolean;
  orders: readonly SalesOrder[];
  products: readonly Product[];
  warehouses: readonly Warehouse[];
}) {
  const order = orders.find((item) => item.id === form.salesOrderId);
  const productById = new Map(products.map((product) => [product.id, product]));
  const orderLineById = new Map(order?.lines.map((line) => [line.id, line]) ?? []);

  function updateLine(index: number, quantityToDeliver: string) {
    onChange({ ...form, lines: form.lines.map((line, current) => current === index ? { ...line, quantityToDeliver } : line) });
  }

  return (
    <EntityDialog
      description="Préparez les quantités physiques à sortir. Le stock ne changera qu'après le posting."
      error={error}
      eyebrow="Ventes · Livraison"
      footer={<FormActions onCancel={onClose} submitLabel="Enregistrer le brouillon" />}
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      size="xl"
      title="Nouveau bon de livraison"
    >
      <div className="space-y-4">
        <FormSection title="Document" description="Une seule commande et un seul entrepôt par bon de livraison.">
          <FormField label="Commande client" required>
            <select className={entityInputClassName} value={form.salesOrderId} onChange={(event) => onOrderChange(event.target.value)} required>
              <option value="">Sélectionner une commande</option>
              {orders.map((item) => <option key={item.id} value={item.id}>{item.number} · {item.companyName}</option>)}
            </select>
          </FormField>
          <FormField label="Entrepôt" required>
            <select className={entityInputClassName} value={form.warehouseId} onChange={(event) => onChange({ ...form, warehouseId: event.target.value })} required>
              <option value="">Sélectionner un entrepôt</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}
            </select>
          </FormField>
          <FormField label="Date de livraison" required>
            <input type="date" className={entityInputClassName} value={form.deliveryDate} onChange={(event) => onChange({ ...form, deliveryDate: event.target.value })} required />
          </FormField>
          <FormField label="Notes">
            <textarea className={`${entityInputClassName} min-h-20`} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
          </FormField>
        </FormSection>

        <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-hicotech-dark-border">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/35">
            <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Quantités à livrer</h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">Seuls les produits actifs suivis en stock sont inclus dans le BL V1.</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-hicotech-dark-border">
            {form.lines.map((line, index) => {
              const orderLine = orderLineById.get(line.salesOrderLineId);
              const remaining = orderLine ? getRemainingToDeliver(orderLine) : 0;
              const product = productById.get(line.productId);
              const balance = inventory.balances.find((item) => item.productId === line.productId && item.warehouseId === form.warehouseId);
              return (
                <div key={line.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_120px_120px_150px] md:items-end">
                  <div>
                    <p className="font-bold text-hicotech-navy dark:text-white">{line.productSku ? `${line.productSku} · ` : ""}{line.description}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{product?.name ?? line.productName}</p>
                  </div>
                  <Stat label="Reliquat" value={`${remaining} ${line.unit}`} />
                  <Stat label="Disponible" value={`${balance?.quantityAvailable ?? 0} ${line.unit}`} />
                  <FormField label="À livrer" required>
                    <input
                      aria-label={`Quantité à livrer pour ${line.description}`}
                      type="text"
                      inputMode="decimal"
                      className={entityInputClassName}
                      value={line.quantityToDeliver}
                      onChange={(event) => updateLine(index, event.target.value)}
                      onBlur={() => {
                        const quantity = parseInventoryQuantityInput(line.quantityToDeliver);
                        if (Number.isFinite(quantity)) updateLine(index, formatInventoryQuantityInput(quantity));
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                        event.preventDefault();
                        updateLine(index, adjustInventoryQuantityInput(line.quantityToDeliver, event.key === "ArrowUp" ? 1 : -1));
                      }}
                      placeholder="3 ou 2,5"
                      required
                    />
                  </FormField>
                </div>
              );
            })}
            {form.lines.length === 0 ? <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Cette commande ne contient aucun produit stockable restant à livrer.</p> : null}
          </div>
        </section>
      </div>
    </EntityDialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p></div>;
}
