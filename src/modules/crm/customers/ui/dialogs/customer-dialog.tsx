import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { createCompanyPickerItem, getCompanyPickerItems, subscribeToCrmPickerSources } from "@/ui/forms/entity-picker.crm-data";
import { SmartEntityPicker } from "@/ui/forms/smart-entity-picker";
import type { CustomerStatus, CustomerType } from "../../customer.types";
import type { CustomerFormState } from "../hooks/use-customers-page";
import { useEffect, useState } from "react";

export function CustomerDialog({
  editing = false,
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open
}: {
  editing?: boolean;
  error: string | null;
  form: CustomerFormState;
  onChange: (form: CustomerFormState) => void;
  onClose: () => void;
  onSubmit: () => boolean | Promise<boolean>;
  open: boolean;
}) {
  const [companyPickerItems, setCompanyPickerItems] = useState(() => getCompanyPickerItems());

  useEffect(() => subscribeToCrmPickerSources(() => setCompanyPickerItems(getCompanyPickerItems())), []);

  return (
    <EntityDialog
      open={open}
      size="lg"
      eyebrow="CRM"
      title={editing ? "Modifier client" : "Ajouter client"}
      description={editing ? "Mettez à jour la fiche client via CustomerService." : "Création en mémoire via CustomerService."}
      error={error}
      onClose={onClose}
      onSubmit={async () => {
        await onSubmit();
      }}
      footer={
        <FormActions onCancel={onClose} submitLabel={editing ? "Enregistrer les modifications" : "Enregistrer"} />
      }
    >
      <div className="mt-5 space-y-3">
        <FormSection title="Identité client" description="Informations principales visibles dans le CRM.">
          <FormField label="Nom client" required>
            <input value={form.displayName} onChange={(event) => onChange({ ...form, displayName: event.target.value })} required className={entityInputClassName} placeholder="Ex. Amina El Mansouri" />
          </FormField>
          <SmartEntityPicker
            label="Société"
            items={companyPickerItems}
            value={form.companyName}
            onChange={({ value, item }) => onChange({ ...form, companyName: value, companyId: item?.relations?.companyId ?? "" })}
            placeholder="Rechercher une société..."
            helper="Le champ reste compatible avec le nom de société attendu par le formulaire."
            allowCreate
            createLabel="Créer la société"
            entityType="société"
            onCreate={(name) => createCompanyPickerItem(name)}
          />
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
        </FormSection>

        <FormSection title="Coordonnées et qualification" description="Contact direct et notes internes pour qualifier la relation.">
          <FormField label="Email">
            <input value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} className={entityInputClassName} placeholder="contact@entreprise.ma" type="email" />
          </FormField>
          <FormField label="Téléphone">
            <input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} className={entityInputClassName} placeholder="0661 22 33 44" />
          </FormField>
          <FormField label="Tags">
            <input value={form.tags} onChange={(event) => onChange({ ...form, tags: event.target.value })} className={entityInputClassName} placeholder="vip, education" />
          </FormField>
          <FormField label="Notes">
            <input value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className={entityInputClassName} placeholder="Notes internes" />
          </FormField>
        </FormSection>
      </div>
    </EntityDialog>
  );
}
