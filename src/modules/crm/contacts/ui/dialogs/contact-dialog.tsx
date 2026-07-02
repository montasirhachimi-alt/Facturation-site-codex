import { EntityDialog, FormField, entityInputClassName } from "@/ui";
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
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
            Annuler
          </button>
          <button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">
            {editing ? "Enregistrer" : "Ajouter contact"}
          </button>
        </div>
      }
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      title={editing ? "Modifier le contact" : "Ajouter un contact"}
    >
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <FormField label="Prénom">
          <input value={form.firstName} onChange={(event) => onChange({ ...form, firstName: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Nom">
          <input value={form.lastName} onChange={(event) => onChange({ ...form, lastName: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Poste">
          <input value={form.jobTitle} onChange={(event) => onChange({ ...form, jobTitle: event.target.value })} className={entityInputClassName} />
        </FormField>
        <FormField label="Département">
          <input value={form.department} onChange={(event) => onChange({ ...form, department: event.target.value })} className={entityInputClassName} />
        </FormField>
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
        <label className="flex items-center gap-2 text-sm font-bold text-hicotech-navy dark:text-white">
          <input type="checkbox" checked={form.isPrimaryContact} onChange={(event) => onChange({ ...form, isPrimaryContact: event.target.checked })} className="size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue" />
          Contact principal
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-hicotech-navy dark:text-white">
          <input type="checkbox" checked={form.isDecisionMaker} onChange={(event) => onChange({ ...form, isDecisionMaker: event.target.checked })} className="size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue" />
          Décideur
        </label>
        <div className="md:col-span-2">
          <FormField label="Notes">
            <textarea value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className={entityInputClassName} rows={3} />
          </FormField>
        </div>
      </div>
    </EntityDialog>
  );
}
