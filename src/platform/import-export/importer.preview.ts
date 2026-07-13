import type { ImportDuplicatePolicy } from "./duplicate-policy";
import type { ImporterDefinition, ImportIssue, ImportMapping, ImportPreview, ParsedImportRow, ImportRawRow } from "./importer.types";
import { createImportIssue, validateImportMapping } from "./importer.validation";

export function buildImportPreview<TField extends string, TValue, TContext, TExisting>(
  definition: ImporterDefinition<TField, TValue, TContext, TExisting>,
  rows: readonly ImportRawRow[],
  mapping: ImportMapping<TField>,
  context: TContext,
  duplicatePolicy: Exclude<ImportDuplicatePolicy, "merge">
): ImportPreview<TField, TValue> {
  const fileIssues = validateImportMapping(definition, mapping);
  const parsedRows: ParsedImportRow<TField, TValue>[] = [];
  const seenByField = new Map<string, Map<string, number>>();

  rows.slice(0, definition.maxRows).forEach((row, index) => {
    const rowNumber = index + 2;
    const values = definition.parseRow(row, mapping, context);
    const issues: ImportIssue<TField>[] = [...definition.validateRow(values, rowNumber, context)];
    const existing = definition.resolveExisting(values, context);
    const existingId = existing ? definition.getExistingId(existing) : undefined;

    for (const check of definition.duplicateChecks ?? []) {
      const value = check.getValue(values);
      if (!value) continue;
      const fieldSeen = seenByField.get(check.field) ?? new Map<string, number>();
      const firstRow = fieldSeen.get(value);
      if (firstRow) {
        issues.push(createImportIssue(rowNumber, check.field, value, check.withinFileMessage(firstRow), check.suggestion));
      } else {
        fieldSeen.set(value, rowNumber);
        seenByField.set(check.field, fieldSeen);
      }

      const owner = check.findExisting?.(value, context);
      if (owner && definition.getExistingId(owner) !== existingId && check.existingConflictMessage) {
        issues.push(createImportIssue(rowNumber, check.field, value, check.existingConflictMessage, check.suggestion));
      }
    }

    let action: ParsedImportRow<TField, TValue>["action"] = existing ? "update" : "create";
    if (existing) {
      if (duplicatePolicy === "ignore") action = "ignore";
      if (duplicatePolicy === "stop") {
        const identityField = definition.identityField ?? definition.columns.find((column) => column.required)?.field ?? definition.columns[0]?.field ?? "file";
        issues.push(createImportIssue(
          rowNumber,
          identityField,
          "",
          definition.duplicatePolicyMessage ?? `${definition.entityLabel} existe déjà.`,
          definition.duplicatePolicySuggestion ?? "Choisissez Ignorer les doublons ou Mettre à jour."
        ));
      }
    }

    if (issues.length > 0 || fileIssues.length > 0) action = "invalid";

    parsedRows.push(Object.freeze({
      rowNumber,
      action,
      values,
      existingRecordId: existingId,
      issues: Object.freeze(issues)
    }));
  });

  const tooManyRowsIssue = rows.length > definition.maxRows
    ? [createImportIssue<TField>(1, "file", String(rows.length), `Le fichier dépasse ${definition.maxRows} lignes.`, "Réduisez le fichier ou importez-le en lots.")]
    : [];
  const allIssues = [...fileIssues, ...tooManyRowsIssue, ...parsedRows.flatMap((row) => row.issues)];

  return Object.freeze({
    totalRows: rows.length,
    validRows: parsedRows.filter((row) => row.action === "create" || row.action === "update").length,
    invalidRows: parsedRows.filter((row) => row.action === "invalid").length + tooManyRowsIssue.length,
    newRecords: parsedRows.filter((row) => row.action === "create").length,
    recordsToUpdate: parsedRows.filter((row) => row.action === "update").length,
    ignoredRows: parsedRows.filter((row) => row.action === "ignore").length,
    rows: Object.freeze(parsedRows),
    issues: Object.freeze(allIssues)
  });
}
