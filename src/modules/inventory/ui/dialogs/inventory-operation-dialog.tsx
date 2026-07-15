"use client";

import { useEffect, useMemo, useState } from "react";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import { persistInventoryOperation } from "@/platform/persistence/inventory-persistence.client";
import type { EntityPickerItem } from "@/ui/forms/entity-picker.types";
import type { ProductId } from "@/modules/products";
import { adjustInventoryQuantityInput, formatInventoryQuantityInput, parseInventoryQuantityInput } from "../../inventory.utils";
import type { InventoryMovementType, InventoryWarehouseId, Warehouse } from "../../inventory.types";
import { INVENTORY_COMPANY_ID, type InventoryOperationMode } from "../hooks/use-inventory-workspace";

type OperationForm = {
  productId: string;
  productLabel: string;
  quantity: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  adjustmentDirection: "in" | "out";
  reference: string;
  reason: string;
};

const emptyForm: OperationForm = {
  productId: "",
  productLabel: "",
  quantity: "1",
  fromWarehouseId: "",
  toWarehouseId: "",
  adjustmentDirection: "in",
  reference: "",
  reason: ""
};

const modeCopy: Record<InventoryOperationMode, { title: string; description: string; submit: string }> = {
  adjustment: {
    title: "Ajustement de stock",
    description: "Corrigez un écart constaté avec une raison claire.",
    submit: "Poster l'ajustement"
  },
  issue: {
    title: "Sortie manuelle",
    description: "Sortez une quantité d'un entrepôt via le moteur d'inventaire.",
    submit: "Poster la sortie"
  },
  receipt: {
    title: "Réception manuelle",
    description: "Ajoutez du stock reçu dans un entrepôt actif.",
    submit: "Poster la réception"
  },
  transfer: {
    title: "Transfert interne",
    description: "Déplacez du stock d'un entrepôt actif vers un autre.",
    submit: "Poster le transfert"
  }
};

export function InventoryOperationDialog({
  mode,
  onClose,
  onSaved,
  open,
  productItems,
  warehouses
}: {
  mode: InventoryOperationMode | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  open: boolean;
  productItems: readonly EntityPickerItem[];
  warehouses: readonly Warehouse[];
}) {
  const [form, setForm] = useState<OperationForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const copy = mode ? modeCopy[mode] : modeCopy.receipt;
  const activeWarehouses = useMemo(() => warehouses.filter((warehouse) => warehouse.active), [warehouses]);

  useEffect(() => {
    if (!open) return;
    const defaultWarehouse = activeWarehouses.find((warehouse) => warehouse.isDefault) ?? activeWarehouses[0];
    const alternateWarehouse = activeWarehouses.find((warehouse) => warehouse.id !== defaultWarehouse?.id);
    setForm({
      ...emptyForm,
      fromWarehouseId: defaultWarehouse?.id ?? "",
      toWarehouseId: mode === "transfer" ? alternateWarehouse?.id ?? "" : defaultWarehouse?.id ?? ""
    });
    setError(null);
    setSaving(false);
  }, [activeWarehouses, mode, open]);

  async function submit() {
    if (!mode || saving) return false;
    const quantity = parseInventoryQuantityInput(form.quantity);
    const type = getMovementType(mode, form.adjustmentDirection);
    const validationError = validateOperation(form, type, quantity);
    if (validationError) {
      setError(validationError);
      return false;
    }

    setSaving(true);
    setError(null);
    try {
      await persistInventoryOperation("postMovement", {
        companyId: INVENTORY_COMPANY_ID,
        productId: form.productId as ProductId,
        type,
        quantity,
        fromWarehouseId: needsSource(type) ? form.fromWarehouseId as InventoryWarehouseId : undefined,
        toWarehouseId: needsDestination(type) ? form.toWarehouseId as InventoryWarehouseId : undefined,
        reference: form.reference,
        reason: form.reason
      });
      onSaved(successMessage(type));
      onClose();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le mouvement n'a pas pu être posté.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityDialog
      open={open && Boolean(mode)}
      onClose={saving ? () => undefined : onClose}
      onSubmit={submit}
      size="lg"
      eyebrow="Mouvement de stock"
      title={copy.title}
      description={copy.description}
      error={error}
      footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel={copy.submit} />}
    >
      <div className="grid gap-4">
        <FormSection title="Produit et quantité" description="Le mouvement est validé par le moteur d'inventaire avant d'être enregistré.">
          <div className="md:col-span-2">
            <SmartEntityPicker
              label="Produit"
              value={form.productLabel}
              items={productItems}
              placeholder="Rechercher un produit ou un SKU..."
              emptyTitle="Aucun produit"
              emptyDescription="Ajoutez d'abord le produit dans le catalogue."
              helper="La sélection utilise le catalogue produit canonique."
              onChange={({ value, item }) => setForm((current) => ({ ...current, productLabel: value, productId: item?.id ?? "" }))}
            />
          </div>
          <FormField label="Quantité" required>
            <input
              type="text"
              inputMode="decimal"
              value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
              onBlur={() => setForm((current) => {
                const quantity = parseInventoryQuantityInput(current.quantity);
                return Number.isFinite(quantity) ? { ...current, quantity: formatInventoryQuantityInput(quantity) } : current;
              })}
              onKeyDown={(event) => {
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                event.preventDefault();
                setForm((current) => ({ ...current, quantity: adjustInventoryQuantityInput(current.quantity, event.key === "ArrowUp" ? 1 : -1) }));
              }}
              className={entityInputClassName}
              placeholder="20 ou 2,5"
            />
          </FormField>
          {mode === "adjustment" && (
            <FormField label="Sens" required>
              <select value={form.adjustmentDirection} onChange={(event) => setForm((current) => ({ ...current, adjustmentDirection: event.target.value as OperationForm["adjustmentDirection"] }))} className={entityInputClassName}>
                <option value="in">Augmenter le stock</option>
                <option value="out">Diminuer le stock</option>
              </select>
            </FormField>
          )}
        </FormSection>

        <FormSection title="Entrepôts" description="Les entrepôts archivés sont exclus des opérations.">
          {(mode === "issue" || mode === "transfer" || (mode === "adjustment" && form.adjustmentDirection === "out")) && (
            <WarehouseSelect label="Entrepôt source" value={form.fromWarehouseId} warehouses={activeWarehouses} onChange={(value) => setForm((current) => ({ ...current, fromWarehouseId: value }))} />
          )}
          {(mode === "receipt" || mode === "transfer" || (mode === "adjustment" && form.adjustmentDirection === "in")) && (
            <WarehouseSelect label="Entrepôt destination" value={form.toWarehouseId} warehouses={activeWarehouses} onChange={(value) => setForm((current) => ({ ...current, toWarehouseId: value }))} />
          )}
        </FormSection>

        <FormSection title="Traçabilité" description="Gardez une trace simple de l'origine du mouvement.">
          <FormField label="Référence">
            <input value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} className={entityInputClassName} placeholder="BL, correction, inventaire..." />
          </FormField>
          <FormField label="Raison">
            <textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className={`${entityInputClassName} min-h-24`} placeholder="Contexte du mouvement" />
          </FormField>
        </FormSection>
      </div>
    </EntityDialog>
  );
}

function WarehouseSelect({ label, onChange, value, warehouses }: { label: string; onChange: (value: string) => void; value: string; warehouses: readonly Warehouse[] }) {
  return (
    <FormField label={label} required>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={entityInputClassName}>
        <option value="">Sélectionner un entrepôt</option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.code} · {warehouse.name}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function getMovementType(mode: InventoryOperationMode, adjustmentDirection: OperationForm["adjustmentDirection"]): InventoryMovementType {
  if (mode === "receipt") return "RECEIPT";
  if (mode === "issue") return "ISSUE";
  if (mode === "transfer") return "TRANSFER";
  return adjustmentDirection === "in" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
}

function needsSource(type: InventoryMovementType) {
  return type === "ISSUE" || type === "TRANSFER" || type === "ADJUSTMENT_OUT" || type === "RELEASE";
}

function needsDestination(type: InventoryMovementType) {
  return type === "RECEIPT" || type === "TRANSFER" || type === "ADJUSTMENT_IN" || type === "RESERVATION";
}

function validateOperation(form: OperationForm, type: InventoryMovementType, quantity: number) {
  if (!form.productId) return "Sélectionnez un produit.";
  if (!Number.isFinite(quantity) || quantity <= 0) return "La quantité doit être supérieure à zéro.";
  if (needsSource(type) && !form.fromWarehouseId) return "Sélectionnez un entrepôt source.";
  if (needsDestination(type) && !form.toWarehouseId) return "Sélectionnez un entrepôt destination.";
  if (type === "TRANSFER" && form.fromWarehouseId === form.toWarehouseId) return "Un transfert exige deux entrepôts différents.";
  return null;
}

function successMessage(type: InventoryMovementType) {
  if (type === "RECEIPT") return "Réception postée.";
  if (type === "ISSUE") return "Sortie postée.";
  if (type === "TRANSFER") return "Transfert posté.";
  return "Ajustement posté.";
}
