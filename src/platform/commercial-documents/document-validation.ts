import type {
  CommercialDocument,
  CommercialDocumentLine,
  CommercialDocumentValidationIssue,
  CommercialDocumentValidationResult
} from "./document.types";

export function validateDocumentLine(line: CommercialDocumentLine, index: number): readonly CommercialDocumentValidationIssue[] {
  const path = `lines.${index}`;
  const issues: CommercialDocumentValidationIssue[] = [];

  if (!line.description.trim()) {
    issues.push({ code: "line.description.required", message: "La description est obligatoire.", path: `${path}.description` });
  }

  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
    issues.push({ code: "line.quantity.invalid", message: "La quantite doit etre superieure a zero.", path: `${path}.quantity` });
  }

  if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
    issues.push({ code: "line.unitPrice.invalid", message: "Le prix unitaire ne peut pas etre negatif.", path: `${path}.unitPrice` });
  }

  if ((line.tax?.rate ?? 0) < 0) {
    issues.push({ code: "line.tax.invalid", message: "Le taux de taxe ne peut pas etre negatif.", path: `${path}.tax.rate` });
  }

  return issues;
}

export function validateCommercialDocument(document: CommercialDocument): CommercialDocumentValidationResult {
  const issues: CommercialDocumentValidationIssue[] = [];

  if (!document.header.number.trim()) {
    issues.push({ code: "header.number.required", message: "Le numero du document est obligatoire.", path: "header.number" });
  }

  if (!document.header.issueDate.trim()) {
    issues.push({ code: "header.issueDate.required", message: "La date du document est obligatoire.", path: "header.issueDate" });
  }

  if (!document.header.currency.trim()) {
    issues.push({ code: "header.currency.required", message: "La devise est obligatoire.", path: "header.currency" });
  }

  if (!document.header.primaryParty.name.trim()) {
    issues.push({ code: "header.primaryParty.required", message: "Le tiers commercial est obligatoire.", path: "header.primaryParty.name" });
  }

  if (document.lines.length === 0) {
    issues.push({ code: "lines.required", message: "Ajoutez au moins une ligne.", path: "lines" });
  }

  document.lines.forEach((line, index) => {
    issues.push(...validateDocumentLine(line, index));
  });

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze(issues)
  });
}
