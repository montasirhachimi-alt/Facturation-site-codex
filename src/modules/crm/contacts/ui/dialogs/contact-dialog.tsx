import { EntityDialog, FormActions, FormBooleanField, FormField, FormSection, entityInputClassName } from "@/ui";
import type { ContactFormState } from "../hooks/use-company-contacts-workspace";

export function ContactDialog({
  editing,
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open
}: {
  editing: boolean;
  error: string | null;
  form: ContactFormState;
  onChange: (form: ContactFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  open: boolean;
}) {
  return (
    <EntityDialog
      description="Le contact sera rattaché à la société active."
      error={error}
      eyebrow="CRM Contact"
      footer={
        <FormActions onCancel={onClose} submitLabel={editing ? "Enregistrer" : "Ajouter contact"} />
      }
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      title={editing ? "Modifier le contact" : "Ajouter un contact"}
    >
      <div className="mt-5 space-y-3">
        <FormSection title="Identité" description="Les champs essentiels pour reconnaître rapidement la personne.">
        <FormField label="Prénom" required>
          <input value={form.firstName} onChange={(event) => onChange({ ...form, firstName: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Nom" required>
          <input value={form.lastName} onChange={(event) => onChange({ ...form, lastName: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Poste">
          <input value={form.jobTitle} onChange={(event) => onChange({ ...form, jobTitle: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Département">
          <input value={form.department} onChange={(event) => onChange({ ...form, department: event.target.value })} className={entityInputClassName} />
        </FormField>
        </FormSection>

        <FormSection title="Coordonnées" description="Canaux de contact utiles pour les échanges commerciaux.">
        <FormField label="Email">
          <input value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Mobile">
          <input value={form.mobilePhone} onChange={(event) => onChange({ ...form, mobilePhone: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Téléphone bureau">
          <input value={form.officePhone} onChange={(event) => onChange({ ...form, officePhone: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Statut">
          <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as ContactFormState["status"] })} className={entityInputClassName}>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="archived">Archivé</option>
          </select>
        </FormField>
        </FormSection>

        <FormSection title="Préférences et contexte" description="Informations secondaires qui enrichissent la relation.">
        <FormField label="Langue">
          <input value={form.preferredLanguage} onChange={(event) => onChange({ ...form, preferredLanguage: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Timezone">
          <input value={form.timezone} onChange={(event) => onChange({ ...form, timezone: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="LinkedIn">
          <input value={form.linkedin} onChange={(event) => onChange({ ...form, linkedin: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Tags">
          <input value={form.tags} onChange={(event) => onChange({ ...form, tags: event.target.value })} className={entityInputClassName} placeholder="vip, achats" />
        </FormField>
        <FormBooleanField checked={form.isPrimaryContact} onChange={(checked) => onChange({ ...form, isPrimaryContact: checked })} label="Contact principal" description="Mettre en avant cette personne dans la société." />
        <FormBooleanField checked={form.isDecisionMaker} onChange={(checked) => onChange({ ...form, isDecisionMaker: checked })} label="Décideur" description="Identifier les interlocuteurs qui influencent la décision." />
        <div className="md:col-span-2">
          <FormField label="Notes">
            <textarea value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className={entityInputClassName} rows={3} />
          </FormField>
        </div>
        </FormSection>
      </div>
    </EntityDialog>
  );
}
