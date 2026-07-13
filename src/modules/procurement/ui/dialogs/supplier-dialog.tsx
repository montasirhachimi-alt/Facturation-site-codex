"use client";

import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { DEFAULT_PROCUREMENT_CURRENCY, DEFAULT_SUPPLIER_COUNTRY } from "../../procurement.constants";
import type { ProcurementSupplier } from "../../procurement.types";

export type SupplierFormState = {
  companyName: string;
  tradeName: string;
  ice: string;
  taxId: string;
  rc: string;
  vat: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  currency: string;
  paymentTerms: string;
  notes: string;
};

export const emptySupplierForm: SupplierFormState = {
  companyName: "",
  tradeName: "",
  ice: "",
  taxId: "",
  rc: "",
  vat: "",
  phone: "",
  email: "",
  address: "",
  country: DEFAULT_SUPPLIER_COUNTRY,
  currency: DEFAULT_PROCUREMENT_CURRENCY,
  paymentTerms: "",
  notes: ""
};

export function supplierToForm(supplier: ProcurementSupplier): SupplierFormState {
  return {
    companyName: supplier.companyName,
    tradeName: supplier.tradeName ?? "",
    ice: supplier.ice ?? "",
    taxId: supplier.taxId ?? "",
    rc: supplier.rc ?? "",
    vat: supplier.vat ?? "",
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    country: supplier.country,
    currency: supplier.currency,
    paymentTerms: supplier.paymentTerms ?? "",
    notes: supplier.notes ?? ""
  };
}

export function SupplierDialog({
  editing,
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open
}: {
  editing: boolean;
  error?: string | null;
  form: SupplierFormState;
  onChange: (form: SupplierFormState) => void;
  onClose: () => void;
  onSubmit: () => void | boolean | Promise<void | boolean>;
  open: boolean;
}) {
  const update = (key: keyof SupplierFormState, value: string) => onChange({ ...form, [key]: value });

  return (
    <EntityDialog
      description="Un fournisseur est une entité achats dédiée, séparée des sociétés CRM."
      error={error}
      eyebrow="Achats"
      footer={<FormActions onCancel={onClose} submitLabel={editing ? "Enregistrer" : "Créer le fournisseur"} />}
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      size="lg"
      title={editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
    >
      <div className="grid gap-4">
        <FormSection title="Identité fournisseur">
          <FormField label="Raison sociale" required>
            <input className={entityInputClassName} value={form.companyName} onChange={(event) => update("companyName", event.target.value)} />
          </FormField>
          <FormField label="Nom commercial">
            <input className={entityInputClassName} value={form.tradeName} onChange={(event) => update("tradeName", event.target.value)} />
          </FormField>
          <FormField label="ICE">
            <input className={entityInputClassName} value={form.ice} onChange={(event) => update("ice", event.target.value)} />
          </FormField>
          <FormField label="IF">
            <input className={entityInputClassName} value={form.taxId} onChange={(event) => update("taxId", event.target.value)} />
          </FormField>
          <FormField label="RC">
            <input className={entityInputClassName} value={form.rc} onChange={(event) => update("rc", event.target.value)} />
          </FormField>
          <FormField label="TVA">
            <input className={entityInputClassName} value={form.vat} onChange={(event) => update("vat", event.target.value)} />
          </FormField>
        </FormSection>
        <FormSection title="Coordonnées et conditions">
          <FormField label="Téléphone">
            <input className={entityInputClassName} value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          </FormField>
          <FormField label="Email">
            <input className={entityInputClassName} value={form.email} onChange={(event) => update("email", event.target.value)} />
          </FormField>
          <FormField label="Adresse">
            <input className={entityInputClassName} value={form.address} onChange={(event) => update("address", event.target.value)} />
          </FormField>
          <FormField label="Pays">
            <input className={entityInputClassName} value={form.country} onChange={(event) => update("country", event.target.value)} />
          </FormField>
          <FormField label="Devise">
            <input className={entityInputClassName} value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} />
          </FormField>
          <FormField label="Conditions de paiement">
            <input className={entityInputClassName} value={form.paymentTerms} onChange={(event) => update("paymentTerms", event.target.value)} />
          </FormField>
        </FormSection>
        <FormSection title="Notes">
          <FormField label="Notes">
            <textarea className={entityInputClassName} value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} />
          </FormField>
        </FormSection>
      </div>
    </EntityDialog>
  );
}
