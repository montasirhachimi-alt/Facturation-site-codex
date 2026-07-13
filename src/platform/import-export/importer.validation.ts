import type { ImporterDefinition, ImportIssue, ImportMapping } from "./importer.types";

export function createImportIssue<TField extends string>(
  rowNumber: number,
  column: TField | "file",
  value: string,
  message: string,
  suggestion?: string
): ImportIssue<TField> {
  return Object.freeze({ rowNumber, column, value, message, suggestion });
}

export function validateImportMapping<TField extends string, TValue, TContext, TExisting>(
  definition: Pick<ImporterDefinition<TField, TValue, TContext, TExisting>, "columns">,
  mapping: ImportMapping<TField>
) {
  const issues: ImportIssue<TField>[] = [];
  definition.columns.forEach((column) => {
    if (column.required && !mapping[column.field]) {
      issues.push(createImportIssue(1, column.field, "", `La colonne ${column.label} est obligatoire.`, `Mappez une colonne ${column.label}.`));
    }
  });
  return issues;
}

export function requiredImportValidator<TField extends string>(field: TField, label: string) {
  return (value: string, rowNumber: number): ImportIssue<TField> | undefined =>
    value.trim() ? undefined : createImportIssue(rowNumber, field, value, `${label} obligatoire.`);
}

export function numberImportValidator<TField extends string>(field: TField, label: string, options: { min?: number; max?: number } = {}) {
  return (value: number, rowNumber: number): ImportIssue<TField> | undefined => {
    if (!Number.isFinite(value)) return createImportIssue(rowNumber, field, String(value), `${label} invalide.`);
    if (options.min !== undefined && value < options.min) return createImportIssue(rowNumber, field, String(value), `${label} doit être supérieur ou égal à ${options.min}.`);
    if (options.max !== undefined && value > options.max) return createImportIssue(rowNumber, field, String(value), `${label} doit être inférieur ou égal à ${options.max}.`);
    return undefined;
  };
}

export function enumImportValidator<TField extends string>(field: TField, label: string, acceptedValues: readonly string[]) {
  const acceptedSet = new Set(acceptedValues);
  return (value: string, rowNumber: number): ImportIssue<TField> | undefined =>
    acceptedSet.has(value) ? undefined : createImportIssue(rowNumber, field, value, `${label} non supporté.`, `Valeurs acceptées: ${acceptedValues.join(", ")}.`);
}

export function maxLengthImportValidator<TField extends string>(field: TField, label: string, maxLength: number) {
  return (value: string, rowNumber: number): ImportIssue<TField> | undefined =>
    value.length <= maxLength ? undefined : createImportIssue(rowNumber, field, value, `${label} trop long.`, `Limitez à ${maxLength} caractères.`);
}
