import type { CommercialDocumentStatus, CommercialDocumentType } from "./document.types";

export type CommercialDocumentDefinition = Readonly<{
  type: CommercialDocumentType;
  label: string;
  pluralLabel: string;
  prefix: string;
  alphaReady: boolean;
  defaultStatus: CommercialDocumentStatus;
  status: "stable" | "alpha" | "planned" | "hidden";
  metadata?: Readonly<Record<string, unknown>>;
}>;
