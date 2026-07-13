import type { CommercialDocumentLine } from "./document.types";

export function freezeDocumentLines(lines: readonly CommercialDocumentLine[]) {
  return Object.freeze(lines.map((line) => Object.freeze({ ...line, metadata: line.metadata ? Object.freeze({ ...line.metadata }) : undefined })));
}

export function normalizeDocumentLine(line: CommercialDocumentLine): CommercialDocumentLine {
  return Object.freeze({
    ...line,
    description: line.description.trim(),
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    unit: line.unit?.trim() || undefined
  });
}
