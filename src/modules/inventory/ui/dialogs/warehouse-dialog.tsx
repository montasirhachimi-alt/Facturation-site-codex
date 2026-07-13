"use client";

import { useEffect, useState } from "react";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormBooleanField, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { persistInventoryOperation } from "@/platform/persistence/inventory-persistence.client";
import type { Warehouse } from "../../inventory.types";

type WarehouseFormState = {
  code: string;
  name: string;
  description: string;
  active: boolean;
  isDefault: boolean;
};

const emptyForm: WarehouseFormState = {
  code: "",
  name: "",
  description: "",
  active: true,
  isDefault: false
};

export function WarehouseDialog({
  onClose,
  onSaved,
  open,
  warehouse
}: {
  onClose: () => void;
  onSaved: (message: string) => void;
  open: boolean;
  warehouse?: Warehouse | null;
}) {
  const [form, setForm] = useState<WarehouseFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(warehouse);

  useEffect(() => {
    if (!open) return;
    setForm(warehouse ? {
      code: warehouse.code,
      name: warehouse.name,
      description: warehouse.description ?? "",
      active: warehouse.active,
      isDefault: warehouse.isDefault
    } : emptyForm);
    setError(null);
    setSaving(false);
  }, [open, warehouse]);

  async function submit() {
    if (saving) return;
    if (!form.code.trim() || !form.name.trim()) {
      setError("Le code et le nom de l'entrepôt sont obligatoires.");
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      if (warehouse) {
        await persistInventoryOperation("updateWarehouse", {
          warehouseId: warehouse.id,
          code: form.code,
          name: form.name,
          description: form.description,
          active: form.active,
          isDefault: form.isDefault
        });
        onSaved("Entrepôt enregistré.");
      } else {
        await persistInventoryOperation("createWarehouse", {
          code: form.code,
          name: form.name,
          description: form.description,
          isDefault: form.isDefault
        });
        onSaved("Entrepôt créé.");
      }
      onClose();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La sauvegarde de l'entrepôt a échoué.");
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
      eyebrow="Inventaire"
      title={editing ? "Modifier l'entrepôt" : "Nouvel entrepôt"}
      description="Gérez un emplacement de stock sans modifier les règles de mouvement."
      error={error}
      footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel={editing ? "Enregistrer" : "Créer l'entrepôt"} />}
    >
      <FormSection title="Entrepôt" description="Un code court, un nom clair et un statut suffisent pour le poste de travail stock.">
        <FormField label="Code" required>
          <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} className={entityInputClassName} placeholder="CASA-01" />
        </FormField>
        <FormField label="Nom" required>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={entityInputClassName} placeholder="Entrepôt Casablanca" />
        </FormField>
        <FormField label="Description">
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={`${entityInputClassName} min-h-24`} placeholder="Usage, zone ou commentaire interne" />
        </FormField>
        <div className="grid gap-3">
          <FormBooleanField checked={form.isDefault} onChange={(checked) => setForm((current) => ({ ...current, isDefault: checked }))} label="Entrepôt par défaut" description="Utilisé comme emplacement proposé dans les opérations." />
          {editing && <FormBooleanField checked={form.active} onChange={(checked) => setForm((current) => ({ ...current, active: checked, isDefault: checked ? current.isDefault : false }))} label="Entrepôt actif" description="Un entrepôt archivé ne peut plus recevoir de mouvements." />}
        </div>
      </FormSection>
    </EntityDialog>
  );
}
