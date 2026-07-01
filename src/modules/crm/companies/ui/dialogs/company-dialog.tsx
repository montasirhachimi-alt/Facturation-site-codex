import { Check } from "lucide-react";
import { EntityDialog, FormField, entityInputClassName } from "@/ui";
import type { CompanyIndustry, CompanyStatus } from "../../company.types";
import type { CompanyFormState } from "../hooks/use-companies-page";

export function CompanyDialog({
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open
}: {
  error: string | null;
  form: CompanyFormState;
  onChange: (form: CompanyFormState) => void;
  onClose: () => void;
  onSubmit: () => boolean;
  open: boolean;
}) {
  return (
    <EntityDialog
      open={open}
      eyebrow="CRM"
      title="Ajouter société"
      description="Création en mémoire via CompanyService."
      error={error}
      onClose={onClose}
      onSubmit={() => {
        onSubmit();
      }}
      footer={
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">Annuler</button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700">
            <Check size={18} />
            Enregistrer
          </button>
        </div>
      }
    >
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <FormField label="Raison sociale">
          <input value={form.legalName} onChange={(event) => onChange({ ...form, legalName: event.target.value })} required className={entityInputClassName} placeholder="Ex. Entreprise Atlas" />
        </FormField>
        <FormField label="Nom affiché">
          <input value={form.displayName} onChange={(event) => onChange({ ...form, displayName: event.target.value })} className={entityInputClassName} placeholder="Ex. Atlas" />
        </FormField>
        <FormField label="Industrie">
          <select value={form.industry} onChange={(event) => onChange({ ...form, industry: event.target.value as CompanyIndustry })} className={entityInputClassName}>
            {["education", "healthcare", "technology", "finance", "retail", "manufacturing", "services", "government", "other", "unknown"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </FormField>
        <FormField label="Site web">
          <input value={form.website} onChange={(event) => onChange({ ...form, website: event.target.value })} className={entityInputClassName} placeholder="entreprise.ma" />
        </FormField>
        <FormField label="Email">
          <input value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} className={entityInputClassName} placeholder="contact@entreprise.ma" type="email" />
        </FormField>
        <FormField label="Téléphone">
          <input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} className={entityInputClassName} placeholder="0661 22 33 44" />
        </FormField>
        <FormField label="Ville">
          <input value={form.city} onChange={(event) => onChange({ ...form, city: event.target.value })} className={entityInputClassName} placeholder="Casablanca" />
        </FormField>
        <FormField label="Pays">
          <input value={form.country} onChange={(event) => onChange({ ...form, country: event.target.value })} className={entityInputClassName} placeholder="Maroc" />
        </FormField>
        <FormField label="Statut">
          <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as CompanyStatus })} className={entityInputClassName}>
            <option value="lead">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
        <FormField label="Tags">
          <input value={form.tags} onChange={(event) => onChange({ ...form, tags: event.target.value })} className={entityInputClassName} placeholder="vip, industrie" />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Notes">
            <input value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className={entityInputClassName} placeholder="Notes internes" />
          </FormField>
        </div>
      </div>
    </EntityDialog>
  );
}

