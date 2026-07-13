import type { CommercialDocumentDefinition } from "./document-definition";
import { createCommercialDocumentRegistry } from "./document-registry";

export const COMMERCIAL_DOCUMENT_DEFINITIONS: readonly CommercialDocumentDefinition[] = Object.freeze([
  {
    type: "quote",
    label: "Devis",
    pluralLabel: "Devis",
    prefix: "DEV",
    alphaReady: true,
    defaultStatus: "draft",
    status: "alpha"
  },
  {
    type: "invoice",
    label: "Facture",
    pluralLabel: "Factures",
    prefix: "FAC",
    alphaReady: true,
    defaultStatus: "draft",
    status: "alpha"
  },
  {
    type: "sales-order",
    label: "Commande client",
    pluralLabel: "Commandes client",
    prefix: "BC",
    alphaReady: false,
    defaultStatus: "draft",
    status: "planned"
  },
  {
    type: "delivery-note",
    label: "Bon de livraison",
    pluralLabel: "Bons de livraison",
    prefix: "BL",
    alphaReady: false,
    defaultStatus: "draft",
    status: "planned"
  },
  {
    type: "purchase-order",
    label: "Commande fournisseur",
    pluralLabel: "Commandes fournisseur",
    prefix: "PO",
    alphaReady: false,
    defaultStatus: "draft",
    status: "planned"
  },
  {
    type: "goods-receipt",
    label: "Reception fournisseur",
    pluralLabel: "Receptions fournisseur",
    prefix: "BR",
    alphaReady: false,
    defaultStatus: "draft",
    status: "planned"
  },
  {
    type: "supplier-invoice",
    label: "Facture fournisseur",
    pluralLabel: "Factures fournisseur",
    prefix: "FA",
    alphaReady: false,
    defaultStatus: "draft",
    status: "planned"
  }
]);

export const commercialDocumentRegistry = createCommercialDocumentRegistry(COMMERCIAL_DOCUMENT_DEFINITIONS);
