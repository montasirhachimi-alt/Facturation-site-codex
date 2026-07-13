import type { ImportDuplicatePolicy } from "./duplicate-policy";

export type ImportExportFormat = "csv" | "xlsx";
export type ImportRawRow = Record<string, unknown>;
export type ImportMapping<TField extends string> = Partial<Record<TField, string>>;
export type ImportAction = "create" | "update" | "ignore" | "invalid";

export type ImportColumnDefinition<TField extends string> = Readonly<{
  field: TField;
  label: string;
  aliases: readonly string[];
  required?: boolean;
  width?: number;
  example?: string | number | boolean;
}>;

export type ImportIssue<TField extends string> = Readonly<{
  rowNumber: number;
  column: TField | "file";
  value: string;
  message: string;
  suggestion?: string;
}>;

export type ParsedImportRow<TField extends string, TValue> = Readonly<{
  rowNumber: number;
  action: ImportAction;
  values: TValue;
  existingRecordId?: string;
  issues: readonly ImportIssue<TField>[];
}>;

export type ImportPreview<TField extends string, TValue> = Readonly<{
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newRecords: number;
  recordsToUpdate: number;
  ignoredRows: number;
  rows: readonly ParsedImportRow<TField, TValue>[];
  issues: readonly ImportIssue<TField>[];
}>;

export type ImportDuplicateCheck<TField extends string, TValue, TContext, TExisting> = Readonly<{
  field: TField;
  getValue: (values: TValue) => string | undefined;
  findExisting?: (value: string, context: TContext) => TExisting | undefined;
  withinFileMessage: (firstRowNumber: number) => string;
  existingConflictMessage?: string;
  suggestion?: string;
}>;

export type ImporterDefinition<TField extends string, TValue, TContext, TExisting = unknown> = Readonly<{
  identifier: string;
  entityLabel: string;
  supportedFormats: readonly ImportExportFormat[];
  columns: readonly ImportColumnDefinition<TField>[];
  duplicatePolicySupport: readonly Exclude<ImportDuplicatePolicy, "merge">[];
  identityField?: TField;
  duplicatePolicyMessage?: string;
  duplicatePolicySuggestion?: string;
  maxRows: number;
  maxFileSize: number;
  sampleRow: Record<string, string | number | boolean>;
  instructions?: readonly (readonly string[])[];
  parseRow: (row: ImportRawRow, mapping: ImportMapping<TField>, context: TContext) => TValue;
  validateRow: (values: TValue, rowNumber: number, context: TContext) => readonly ImportIssue<TField>[];
  resolveExisting: (values: TValue, context: TContext) => TExisting | undefined;
  getExistingId: (existing: TExisting) => string;
  duplicateChecks?: readonly ImportDuplicateCheck<TField, TValue, TContext, TExisting>[];
}>;

export type ImportRequest<TField extends string> = Readonly<{
  rows: readonly ImportRawRow[];
  mapping: ImportMapping<TField>;
  duplicatePolicy: Exclude<ImportDuplicatePolicy, "merge">;
}>;
