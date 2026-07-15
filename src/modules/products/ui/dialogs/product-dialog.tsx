"use client";

import { EntityDialog, FormActions, FormField, entityInputClassName } from "@/ui";
import { PRODUCT_UNITS } from "../../product.constants";
import type { ProductCategory, ProductUnit } from "../../product.types";
import type { ProductFormState } from "../hooks/use-products-page";

export function ProductDialog({
  categories,
  editing,
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open
}: {
  categories: readonly ProductCategory[];
  editing: boolean;
  error: string | null;
  form: ProductFormState;
  onChange: (form: ProductFormState) => void;
  onClose: () => void;
  onSubmit: () => void | boolean | Promise<void | boolean>;
  open: boolean;
}) {
  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      eyebrow="Catalogue produit"
      title={editing ? "Modifier le produit" : "Créer un produit"}
      description="Gérez les informations commerciales et le comportement de stock du produit."
      error={error}
      size="lg"
      footer={<FormActions onCancel={onClose} submitLabel={editing ? "Enregistrer" : "Créer le produit"} />}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-bold text-hicotech-navy dark:text-white">Type de produit</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <ProductTypeOption
              checked={form.trackInventory}
              description="Disponible pour les réceptions, les stocks, les réservations et les futures livraisons."
              label="Produit stockable"
              onChange={() => onChange({ ...form, trackInventory: true })}
            />
            <ProductTypeOption
              checked={!form.trackInventory}
              description="Ligne commerciale valide, sans réception stock ni réservation inventaire."
              label="Service / non stocké"
              onChange={() => onChange({ ...form, trackInventory: false })}
            />
          </div>
        </fieldset>
        <FormField label="SKU" required help="Référence unique normalisée.">
          <input value={form.sku} onChange={(event) => onChange({ ...form, sku: event.target.value })} className={entityInputClassName} placeholder="SKU-001" />
        </FormField>
        <FormField label="Nom" required>
          <input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} className={entityInputClassName} placeholder="Nom du produit" />
        </FormField>
        <FormField label="Code-barres" help="Optionnel">
          <input value={form.barcode} onChange={(event) => onChange({ ...form, barcode: event.target.value })} className={entityInputClassName} placeholder="EAN, UPC..." />
        </FormField>
        <FormField label="Marque" help="Optionnel">
          <input value={form.brand} onChange={(event) => onChange({ ...form, brand: event.target.value })} className={entityInputClassName} placeholder="Marque" />
        </FormField>
        <FormField label="Catégorie">
          <select value={form.categoryId} onChange={(event) => onChange({ ...form, categoryId: event.target.value })} className={entityInputClassName}>
            <option value="">Non classé</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Unité">
          <select value={form.unit} onChange={(event) => onChange({ ...form, unit: event.target.value as ProductUnit })} className={entityInputClassName}>
            {PRODUCT_UNITS.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Prix d'achat">
          <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(event) => onChange({ ...form, purchasePrice: Number(event.target.value) })} className={entityInputClassName} />
        </FormField>
        <FormField label="Prix de vente" required>
          <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(event) => onChange({ ...form, sellingPrice: Number(event.target.value) })} className={entityInputClassName} />
        </FormField>
        <FormField label="TVA par défaut">
          <input type="number" min="0" max="100" step="0.01" value={form.vatRate} onChange={(event) => onChange({ ...form, vatRate: Number(event.target.value) })} className={entityInputClassName} />
        </FormField>
        <FormField label="Devise">
          <input value={form.currency} onChange={(event) => onChange({ ...form, currency: event.target.value })} className={entityInputClassName} placeholder="MAD" />
        </FormField>
        <FormField label="Description courte">
          <input value={form.shortDescription} onChange={(event) => onChange({ ...form, shortDescription: event.target.value })} className={entityInputClassName} placeholder="Résumé interne" />
        </FormField>
        <FormField label="Image" help="URL optionnelle">
          <input value={form.image} onChange={(event) => onChange({ ...form, image: event.target.value })} className={entityInputClassName} placeholder="https://..." />
        </FormField>
        <div className="md:col-span-2">
        <FormField label="Description">
          <textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} className={entityInputClassName} rows={3} />
        </FormField>
        </div>
        <div className="md:col-span-2">
        <FormField label="Notes">
          <textarea value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className={entityInputClassName} rows={3} />
        </FormField>
        </div>
      </div>
    </EntityDialog>
  );
}

function ProductTypeOption({
  checked,
  description,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition focus-within:ring-4 focus-within:ring-hicotech-blue/10 ${
      checked
        ? "border-hicotech-blue bg-hicotech-blue/10 text-hicotech-navy dark:text-white"
        : "border-slate-200 bg-white text-slate-600 hover:border-hicotech-blue/40 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/30 dark:text-slate-300"
    }`}>
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 accent-hicotech-blue"
        name="product-tracking-type"
      />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{description}</span>
      </span>
    </label>
  );
}
