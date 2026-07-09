import { EntityDialog, FormActions, FormField, FormSection, entityInputClassName } from "@/ui";
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
      description="Création en mémoire via le service Sociétés."
      error={error}
      onClose={onClose}
      onSubmit={() => {
        onSubmit();
      }}
      footer={
        <FormActions onCancel={onClose} submitLabel="Enregistrer" />
      }
    >
      <div className="mt-5 space-y-3">
        <FormSection title="Informations générales" description="Identité principale utilisée dans le CRM et les ventes.">
        <FormField label="Raison sociale" required>
          <input value={form.legalName} onChange={(event) => onChange({ ...form, legalName: event.target.value })} required className={entityInputClassName} placeholder="Ex. Entreprise Atlas" />
        </FormField>
        <FormField label="Nom affiché" help="Nom court visible dans les listes.">
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
        </FormSection>

        <FormSection title="Coordonnées" description="Informations utilisées pour contacter et situer la société.">
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
        </FormSection>

        <FormSection title="Qualification commerciale" description="Statut et repères internes pour segmenter la relation.">
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
        </FormSection>
      </div>
    </EntityDialog>
  );
}
