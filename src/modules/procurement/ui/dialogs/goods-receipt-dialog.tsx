"use client";

import { useEffect, useMemo } from "react";
import type { Warehouse } from "@/modules/inventory";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import type { GoodsReceiptLine, PurchaseOrder } from "../../procurement.types";
import { getPurchaseOrderReceiptState } from "../../procurement.utils";

export type GoodsReceiptFormState = {
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate: string;
  reference: string;
  notes: string;
  lines: GoodsReceiptLine[];
};

export function GoodsReceiptDialog({
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open,
  purchaseOrders,
  postedReceipts,
  warehouses
}: {
  error?: string | null;
  form: GoodsReceiptFormState;
  onChange: (form: GoodsReceiptFormState) => void;
  onClose: () => void;
  onSubmit: () => void | boolean | Promise<void | boolean>;
  open: boolean;
  purchaseOrders: readonly PurchaseOrder[];
  postedReceipts: Parameters<typeof getPurchaseOrderReceiptState>[1];
  warehouses: readonly Warehouse[];
}) {
  const selectedOrder = useMemo(() => purchaseOrders.find((order) => order.id === form.purchaseOrderId), [form.purchaseOrderId, purchaseOrders]);
  const receiptState = useMemo(() => selectedOrder ? getPurchaseOrderReceiptState(selectedOrder, postedReceipts) : undefined, [postedReceipts, selectedOrder]);

  useEffect(() => {
    if (!selectedOrder || form.lines.length > 0) return;
    const state = getPurchaseOrderReceiptState(selectedOrder, postedReceipts);
    onChange({
      ...form,
      lines: state.lines
        .filter(({ line, remainingQuantity }) => line.productId && remainingQuantity > 0)
        .map(({ line, receivedQuantity, remainingQuantity }) => ({
          id: `gr-line-${line.id}` as GoodsReceiptLine["id"],
          purchaseOrderLineId: line.id,
          productId: line.productId!,
          productSku: line.productSku,
          productName: line.productName,
          description: line.description,
          orderedQuantity: line.quantity,
          previouslyReceivedQuantity: receivedQuantity,
          receivedQuantity: remainingQuantity,
          unit: line.unit
        }))
    });
  }, [form, onChange, postedReceipts, selectedOrder]);

  function selectOrder(purchaseOrderId: string) {
    const order = purchaseOrders.find((item) => item.id === purchaseOrderId);
    if (!order) {
      onChange({ ...form, purchaseOrderId, lines: [] });
      return;
    }
    const state = getPurchaseOrderReceiptState(order, postedReceipts);
    onChange({
      ...form,
      purchaseOrderId,
      lines: state.lines
        .filter(({ line, remainingQuantity }) => line.productId && remainingQuantity > 0)
        .map(({ line, receivedQuantity, remainingQuantity }) => ({
          id: `gr-line-${line.id}` as GoodsReceiptLine["id"],
          purchaseOrderLineId: line.id,
          productId: line.productId!,
          productSku: line.productSku,
          productName: line.productName,
          description: line.description,
          orderedQuantity: line.quantity,
          previouslyReceivedQuantity: receivedQuantity,
          receivedQuantity: remainingQuantity,
          unit: line.unit
        }))
    });
  }

  function updateLine(index: number, receivedQuantity: number) {
    onChange({ ...form, lines: form.lines.map((line, current) => current === index ? { ...line, receivedQuantity } : line) });
  }

  return (
    <EntityDialog
      description="Les quantités postées créent des mouvements de stock et mettent à jour la commande fournisseur."
      error={error}
      eyebrow="Achats"
      footer={<FormActions onCancel={onClose} submitLabel="Poster la réception" />}
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      size="xl"
      title="Nouvelle réception fournisseur"
    >
      <div className="grid gap-4">
        <FormSection title="Réception">
          <FormField label="Commande fournisseur" required>
            <select className={entityInputClassName} value={form.purchaseOrderId} onChange={(event) => selectOrder(event.target.value)}>
              <option value="">Sélectionner...</option>
              {purchaseOrders.map((order) => <option key={order.id} value={order.id}>{order.number} · {order.supplierName}</option>)}
            </select>
          </FormField>
          <FormField label="Entrepôt" required>
            <select className={entityInputClassName} value={form.warehouseId} onChange={(event) => onChange({ ...form, warehouseId: event.target.value })}>
              <option value="">Sélectionner...</option>
              {warehouses.filter((warehouse) => warehouse.active).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}
            </select>
          </FormField>
          <FormField label="Date de réception">
            <input type="date" className={entityInputClassName} value={form.receiptDate} onChange={(event) => onChange({ ...form, receiptDate: event.target.value })} />
          </FormField>
          <FormField label="Référence">
            <input className={entityInputClassName} value={form.reference} onChange={(event) => onChange({ ...form, reference: event.target.value })} />
          </FormField>
        </FormSection>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">Quantités reçues</h3>
            {receiptState && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-hicotech-dark-page/50 dark:text-slate-300">Reliquat {receiptState.remainingQuantity}</span>}
          </div>
          <div className="grid gap-3">
            {form.lines.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border">Aucune ligne recevable. Vérifiez que la commande contient des produits et un reliquat.</p>
            ) : form.lines.map((line, index) => {
              const max = Math.max(0, line.orderedQuantity - line.previouslyReceivedQuantity);
              return (
                <div key={line.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-hicotech-dark-border lg:grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_0.7fr]">
                  <div>
                    <p className="text-sm font-bold text-hicotech-navy dark:text-white">{line.productSku ? `${line.productSku} · ` : ""}{line.description}</p>
                    <p className="text-xs font-semibold text-slate-500">{line.productName ?? "Produit catalogue"}</p>
                  </div>
                  <ReadOnlyValue label="Commandé" value={`${line.orderedQuantity} ${line.unit}`} />
                  <ReadOnlyValue label="Déjà reçu" value={`${line.previouslyReceivedQuantity} ${line.unit}`} />
                  <ReadOnlyValue label="Reliquat" value={`${max} ${line.unit}`} />
                  <FormField label="Reçu">
                    <input type="number" min="0" max={max} className={entityInputClassName} value={line.receivedQuantity} onChange={(event) => updateLine(index, Number(event.target.value))} />
                  </FormField>
                </div>
              );
            })}
          </div>
        </section>

        <FormSection title="Notes">
          <FormField label="Notes">
            <textarea className={entityInputClassName} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} rows={3} />
          </FormField>
        </FormSection>
      </div>
    </EntityDialog>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-hicotech-dark-page/50">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}
