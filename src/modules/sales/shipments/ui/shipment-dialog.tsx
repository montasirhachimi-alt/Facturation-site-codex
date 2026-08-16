"use client";

import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import type { DeliveryNote } from "@/modules/sales/delivery-notes";

export type ShipmentFormState = {
  deliveryNoteId: string;
  carrier: string;
  trackingNumber: string;
  shipmentDate: string;
  expectedDelivery: string;
  notes: string;
};

export function ShipmentDialog({
  error,
  form,
  onChange,
  onClose,
  onDeliveryNoteChange,
  onSubmit,
  open,
  postedDeliveryNotes
}: {
  error?: string | null;
  form: ShipmentFormState;
  onChange: (form: ShipmentFormState) => void;
  onClose: () => void;
  onDeliveryNoteChange: (deliveryNoteId: string) => void;
  onSubmit: () => void | boolean | Promise<void | boolean>;
  open: boolean;
  postedDeliveryNotes: readonly DeliveryNote[];
}) {
  const selectedNote = postedDeliveryNotes.find((note) => note.id === form.deliveryNoteId);

  return (
    <EntityDialog
      description="Organisez le transport après le bon de livraison. Cette étape ne modifie pas le stock."
      error={error}
      eyebrow="Ventes · Logistique"
      footer={<FormActions onCancel={onClose} submitLabel="Créer l'expédition" />}
      onClose={onClose}
      onSubmit={onSubmit}
      open={open}
      size="lg"
      title="Nouvelle expédition"
    >
      <div className="grid gap-4">
        <FormSection title="Document source" description="L'expédition reprend les produits et quantités du bon de livraison posté.">
          <FormField label="Bon de livraison" required help="Sélectionnez le BL déjà posté à organiser côté transport.">
            <select className={entityInputClassName} value={form.deliveryNoteId} onChange={(event) => onDeliveryNoteChange(event.target.value)}>
              <option value="">Sélectionner un bon de livraison...</option>
              {postedDeliveryNotes.map((note) => (
                <option key={note.id} value={note.id}>{note.number} · {note.companyName}</option>
              ))}
            </select>
          </FormField>
          <ReadOnlyField label="Société" value={selectedNote?.companyName ?? "Sélectionnez un BL"} />
          <ReadOnlyField label="Commande client" value={selectedNote?.salesOrderNumber ?? "-"} />
          <ReadOnlyField label="Adresse de livraison" value={selectedNote?.customerReference ?? selectedNote?.companyName ?? "-"} />
        </FormSection>

        <FormSection title="Transport" description="Informations visibles pour suivre l'expédition après préparation du BL.">
          <FormField label="Transporteur" required help="Nom du transporteur ou du livreur interne.">
            <input className={entityInputClassName} value={form.carrier} onChange={(event) => onChange({ ...form, carrier: event.target.value })} placeholder="Ex. Amana, DHL, livreur interne" />
          </FormField>
          <FormField label="Numéro de suivi" help="Référence de tracking communiquée par le transporteur, si disponible.">
            <input className={entityInputClassName} value={form.trackingNumber} onChange={(event) => onChange({ ...form, trackingNumber: event.target.value })} placeholder="Ex. TRK-2026-001" />
          </FormField>
          <FormField label="Date d'expédition" help="Date prévue ou réelle de remise au transporteur.">
            <input type="date" className={entityInputClassName} value={form.shipmentDate} onChange={(event) => onChange({ ...form, shipmentDate: event.target.value })} />
          </FormField>
          <FormField label="Livraison prévue" help="Date estimée de livraison chez le client.">
            <input type="date" className={entityInputClassName} value={form.expectedDelivery} onChange={(event) => onChange({ ...form, expectedDelivery: event.target.value })} />
          </FormField>
        </FormSection>

        <FormSection title="Notes">
          <FormField label="Notes logistiques" help="Instructions de transport, accès au site ou remarque client.">
            <textarea className={entityInputClassName} rows={3} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
          </FormField>
        </FormSection>
      </div>
    </EntityDialog>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}
