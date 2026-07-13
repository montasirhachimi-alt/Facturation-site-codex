import { calculateDocumentTotals } from "./document-calculation";
import { canTransitionDocument } from "./document.lifecycle";
import { validateCommercialDocument } from "./document-validation";
import type { CommercialDocument, CommercialDocumentStatus } from "./document.types";

export type CommercialDocumentEngineResult = Readonly<{
  document: CommercialDocument;
  totals: ReturnType<typeof calculateDocumentTotals>;
  validation: ReturnType<typeof validateCommercialDocument>;
}>;

export function buildCommercialDocument(document: CommercialDocument): CommercialDocumentEngineResult {
  return Object.freeze({
    document,
    totals: calculateDocumentTotals(document.lines, document.header.currency, document.documentDiscount),
    validation: validateCommercialDocument(document)
  });
}

export function assertDocumentTransition(document: CommercialDocument, nextStatus: CommercialDocumentStatus) {
  const allowed = canTransitionDocument(document.header.type, document.header.status, nextStatus);
  if (!allowed) {
    throw new Error(`Invalid ${document.header.type} transition: ${document.header.status} -> ${nextStatus}`);
  }
}
