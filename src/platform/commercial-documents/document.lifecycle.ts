import type { CommercialDocumentStatus, CommercialDocumentType } from "./document.types";

export type CommercialDocumentTransition = Readonly<{
  from: CommercialDocumentStatus;
  to: CommercialDocumentStatus;
  label: string;
}>;

const TRANSITIONS_BY_TYPE: Readonly<Record<CommercialDocumentType, readonly CommercialDocumentTransition[]>> = Object.freeze({
  quote: Object.freeze([
    { from: "draft", to: "sent", label: "Envoyer" },
    { from: "sent", to: "accepted", label: "Accepter" },
    { from: "sent", to: "refused", label: "Refuser" },
    { from: "sent", to: "expired", label: "Expirer" },
    { from: "draft", to: "cancelled", label: "Annuler" }
  ]) satisfies readonly CommercialDocumentTransition[],
  invoice: Object.freeze([
    { from: "draft", to: "issued", label: "Emettre" },
    { from: "issued", to: "partially_paid", label: "Paiement partiel" },
    { from: "issued", to: "paid", label: "Marquer payee" },
    { from: "partially_paid", to: "paid", label: "Marquer payee" },
    { from: "issued", to: "overdue", label: "Marquer en retard" },
    { from: "draft", to: "cancelled", label: "Annuler" },
    { from: "issued", to: "cancelled", label: "Annuler" }
  ]) satisfies readonly CommercialDocumentTransition[],
  "sales-order": Object.freeze([]),
  "delivery-note": Object.freeze([]),
  "purchase-order": Object.freeze([]),
  "goods-receipt": Object.freeze([]),
  "supplier-invoice": Object.freeze([])
});

export function listDocumentTransitions(type: CommercialDocumentType, from?: CommercialDocumentStatus) {
  const transitions = TRANSITIONS_BY_TYPE[type] ?? [];
  return from ? transitions.filter((transition) => transition.from === from) : transitions;
}

export function canTransitionDocument(type: CommercialDocumentType, from: CommercialDocumentStatus, to: CommercialDocumentStatus) {
  return listDocumentTransitions(type, from).some((transition) => transition.to === to);
}
