import type { ImportIssue } from "./importer.types";
import { downloadCsvFile } from "./importer.csv";

export function buildImportErrorReportRows<TField extends string>(issues: readonly ImportIssue<TField>[]) {
  return issues.map((issue) => ({
    Ligne: issue.rowNumber,
    Colonne: issue.column,
    Valeur: issue.value,
    Erreur: issue.message,
    Suggestion: issue.suggestion ?? ""
  }));
}

export function downloadImportErrorReport<TField extends string>(fileName: string, issues: readonly ImportIssue<TField>[]) {
  downloadCsvFile(fileName, buildImportErrorReportRows(issues));
}
