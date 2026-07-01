import { Check } from "lucide-react";
import { EntityDialog, FormField, entityInputClassName } from "@/ui";
import type { CustomerStatus, CustomerType } from "../../customer.types";
import type { CustomerFormState } from "../hooks/use-customers-page";

export function CustomerDialog({
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open
}: {
  error: string | null;
  form: CustomerFormState;
  onChange: (form: CustomerFormState) => void;
  onClose: () => void;
  onSubmit: () => boolean;
  open: boolean;
}) {
  return (
    <EntityDialog
      open={open}
      eyebrow="CRM"
      title="Ajouter client"
      description="Création en mémoire via CustomerService."
      error={error}
      onClose={onClose}
      onSubmit={() => {
        onSubmit();
      }}
      footer={
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            Annuler
          </button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700">
            <Check size={18} />
            Enregistrer
          </button>
        </div>
      }
    >
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField label="Nom client">
            <input value={form.displayName} onChange={(event) => onChange({ ...form, displayName: event.target.value })} required className={entityInputClassName} placeholder="Ex. Amina El Mansouri" />
          </FormField>
          <FormField label="Société">
            <input value={form.companyName} onChange={(event) => onChange({ ...form, companyName: event.target.value })} className={entityInputClassName} placeholder="Ex. Ecole Al Hikma" />
          </FormField>
          <FormField label="Email">
            <input value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} className={entityInputClassName} placeholder="contact@entreprise.ma" type="email" />
          </FormField>
          <FormField label="Téléphone">
            <input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} className={entityInputClassName} placeholder="0661 22 33 44" />
          </FormField>
          <FormField label="Statut">
            <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as CustomerStatus })} className={entityInputClassName}>
              <option value="lead">Prospect</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </FormField>
          <FormField label="Type">
            <select value={form.type} onChange={(event) => onChange({ ...form, type: event.target.value as CustomerType })} className={entityInputClassName}>
              <option value="company">Société</option>
              <option value="individual">Particulier</option>
            </select>
          </FormField>
          <FormField label="Tags">
            <input value={form.tags} onChange={(event) => onChange({ ...form, tags: event.target.value })} className={entityInputClassName} placeholder="vip, education" />
          </FormField>
          <FormField label="Notes">
            <input value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className={entityInputClassName} placeholder="Notes internes" />
          </FormField>
        </div>
    </EntityDialog>
  );
}
