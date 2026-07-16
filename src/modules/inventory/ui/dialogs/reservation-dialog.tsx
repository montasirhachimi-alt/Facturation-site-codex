"use client";

import { useEffect, useMemo, useState } from "react";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import { persistInventoryOperation } from "@/platform/persistence/inventory-persistence.client";
import type { EntityPickerItem } from "@/ui/forms/entity-picker.types";
import type { ProductId } from "@/modules/products";
import { adjustInventoryQuantityInput, formatInventoryQuantityInput, parseInventoryQuantityInput } from "../../inventory.utils";
import type { InventoryBalance, InventoryMovementReferenceType, InventoryWarehouseId, ReservationRequest, Warehouse } from "../../inventory.types";
import { INVENTORY_COMPANY_ID, formatInventoryQuantity } from "../hooks/use-inventory-workspace";

type ReservationDialogMode = "reserve" | "release";

type ReservationForm = {
  productId: string;
  productLabel: string;
  warehouseId: string;
  quantity: string;
  referenceType: InventoryMovementReferenceType;
  reference: string;
  referenceId: string;
  reason: string;
};

const emptyForm: ReservationForm = {
  productId: "",
  productLabel: "",
  warehouseId: "",
  quantity: "1",
  referenceType: "MANUAL",
  reference: "",
  referenceId: "",
  reason: ""
};

const referenceTypeLabels: Record<InventoryMovementReferenceType, string> = {
  ADJUSTMENT: "Ajustement",
  DELIVERY: "Livraison",
  DELIVERY_NOTE: "Bon de livraison",
  GOODS_RECEIPT: "Réception fournisseur",
  MANUAL: "Manuelle",
  PURCHASE_ORDER: "Commande fournisseur",
  QUOTE: "Devis",
  SALES_ORDER: "Commande client",
  SUPPLIER: "Fournisseur"
};

export function ReservationDialog({
  balances,
  initialValues,
  mode,
  onClose,
  onSaved,
  open,
  productItems,
  warehouses
}: {
  balances: readonly InventoryBalance[];
  initialValues?: Partial<ReservationForm>;
  mode: ReservationDialogMode;
  onClose: () => void;
  onSaved: (message: string) => void;
  open: boolean;
  productItems: readonly EntityPickerItem[];
  warehouses: readonly Warehouse[];
}) {
  const [form, setForm] = useState<ReservationForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const activeWarehouses = useMemo(() => warehouses.filter((warehouse) => warehouse.active), [warehouses]);
  const selectedBalance = useMemo(() => balances.find((balance) => balance.productId === form.productId && balance.warehouseId === form.warehouseId), [balances, form.productId, form.warehouseId]);
  const quantity = parseInventoryQuantityInput(form.quantity);
  const currentOnHand = selectedBalance?.quantityOnHand ?? 0;
  const currentReserved = selectedBalance?.quantityReserved ?? 0;
  const currentAvailable = selectedBalance?.quantityAvailable ?? 0;
  const afterReserved = mode === "reserve" ? currentReserved + safeQuantity(quantity) : currentReserved - safeQuantity(quantity);
  const afterAvailable = mode === "reserve" ? currentAvailable - safeQuantity(quantity) : currentAvailable + safeQuantity(quantity);

  useEffect(() => {
    if (!open) return;
    const defaultWarehouse = activeWarehouses.find((warehouse) => warehouse.id === initialValues?.warehouseId) ?? activeWarehouses.find((warehouse) => warehouse.isDefault) ?? activeWarehouses[0];
    setForm({
      ...emptyForm,
      ...initialValues,
      warehouseId: initialValues?.warehouseId ?? defaultWarehouse?.id ?? "",
      quantity: initialValues?.quantity ?? "1",
      referenceType: initialValues?.referenceType ?? "MANUAL"
    });
    setError(null);
    setSaving(false);
  }, [activeWarehouses, initialValues, open]);

  async function submit() {
    if (saving) return false;
    const validationError = validateReservationForm(form, quantity, mode, currentAvailable, currentReserved);
    if (validationError) {
      setError(validationError);
      return false;
    }

    const payload: ReservationRequest = {
      companyId: INVENTORY_COMPANY_ID,
      productId: form.productId as ProductId,
      warehouseId: form.warehouseId as InventoryWarehouseId,
      quantity,
      reference: form.reference,
      referenceType: form.referenceType,
      referenceId: form.referenceId,
      reason: form.reason
    };

    setSaving(true);
    setError(null);
    try {
      await persistInventoryOperation(mode === "reserve" ? "reserve" : "release", payload);
      onSaved(mode === "reserve" ? "Réservation enregistrée." : "Réservation libérée.");
      onClose();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : mode === "reserve" ? "Réservation impossible." : "Libération impossible.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityDialog
      open={open}
      onClose={saving ? () => undefined : onClose}
      onSubmit={submit}
      size="lg"
      eyebrow="Réservations"
      title={mode === "reserve" ? "Nouvelle réservation manuelle" : "Libérer une réservation"}
      description={mode === "reserve" ? "Réservez une quantité disponible via le moteur d'inventaire." : "Libérez une quantité réservée sans modifier le stock en main."}
      error={error}
      footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel={mode === "reserve" ? "Enregistrer la réservation" : "Libérer la réservation"} />}
    >
      <div className="grid gap-4">
        <FormSection title="Produit et entrepôt" description="La disponibilité reste validée côté serveur avant enregistrement.">
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
          <WarehouseSelect value={form.warehouseId} warehouses={activeWarehouses} onChange={(value) => setForm((current) => ({ ...current, warehouseId: value }))} />
          <FormField label={mode === "reserve" ? "Quantité à réserver" : "Quantité à libérer"} required>
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
        </FormSection>

        <BalancePreview
          mode={mode}
          currentAvailable={currentAvailable}
          currentOnHand={currentOnHand}
          currentReserved={currentReserved}
          quantity={safeQuantity(quantity)}
          afterAvailable={afterAvailable}
          afterReserved={afterReserved}
          reorderPoint={selectedBalance?.reorderPoint ?? 0}
        />

        <FormSection title="Référence QA" description="Optionnel. Prépare le lien futur avec devis, commandes ou livraisons sans dépendance métier.">
          <FormField label="Type de référence">
            <select value={form.referenceType} onChange={(event) => setForm((current) => ({ ...current, referenceType: event.target.value as InventoryMovementReferenceType }))} className={entityInputClassName}>
              {Object.entries(referenceTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </FormField>
          <FormField label="Référence">
            <input value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} className={entityInputClassName} placeholder="DEV-001, QA, manuel..." />
          </FormField>
          <FormField label="Identifiant lié">
            <input value={form.referenceId} onChange={(event) => setForm((current) => ({ ...current, referenceId: event.target.value }))} className={entityInputClassName} placeholder="Optionnel" />
          </FormField>
          <FormField label="Motif">
            <textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className={`${entityInputClassName} min-h-24`} placeholder="Contexte de la réservation" />
          </FormField>
        </FormSection>
      </div>
    </EntityDialog>
  );
}

function WarehouseSelect({ onChange, value, warehouses }: { onChange: (value: string) => void; value: string; warehouses: readonly Warehouse[] }) {
  return (
    <FormField label="Entrepôt" required>
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

function BalancePreview({
  afterAvailable,
  afterReserved,
  currentAvailable,
  currentOnHand,
  currentReserved,
  mode,
  quantity,
  reorderPoint
}: {
  afterAvailable: number;
  afterReserved: number;
  currentAvailable: number;
  currentOnHand: number;
  currentReserved: number;
  mode: ReservationDialogMode;
  quantity: number;
  reorderPoint: number;
}) {
  const rows = [
    ["En main", currentOnHand],
    ["Déjà réservé", currentReserved],
    ["Disponible actuel", currentAvailable],
    [mode === "reserve" ? "À réserver" : "À libérer", quantity],
    [mode === "reserve" ? "Disponible après" : "Réservé après", mode === "reserve" ? afterAvailable : afterReserved],
    ["Seuil", reorderPoint]
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
      <h3 className="font-display text-sm font-black text-hicotech-navy dark:text-white">Aperçu de disponibilité</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="mt-1 font-display text-lg font-black text-hicotech-navy dark:text-white">{formatInventoryQuantity(value)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-300">Disponible = En main - Réservé. Le serveur reste l&apos;autorité finale.</p>
    </section>
  );
}

function validateReservationForm(form: ReservationForm, quantity: number, mode: ReservationDialogMode, currentAvailable: number, currentReserved: number) {
  if (!form.productId) return "Sélectionnez un produit.";
  if (!form.warehouseId) return "Sélectionnez un entrepôt.";
  if (!Number.isFinite(quantity) || quantity <= 0) return "La quantité doit être supérieure à zéro.";
  if (mode === "reserve" && quantity > currentAvailable) return "Stock disponible insuffisant.";
  if (mode === "release" && quantity > currentReserved) return "Stock réservé insuffisant.";
  return null;
}

function safeQuantity(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
