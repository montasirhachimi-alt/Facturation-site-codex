import type { ImportIssue, ImportMapping, ImportPreview, ImportRawRow, ParsedImportRow } from "@/platform/import-export";
import type { ProcurementSupplier } from "./procurement.types";

export type SupplierImportColumnKey =
  | "companyName"
  | "tradeName"
  | "ice"
  | "taxId"
  | "rc"
  | "vat"
  | "phone"
  | "email"
  | "address"
  | "country"
  | "currency"
  | "paymentTerms"
  | "active"
  | "notes";

export type SupplierImportRawRow = ImportRawRow;
export type SupplierImportMapping = ImportMapping<SupplierImportColumnKey>;
export type SupplierImportIssue = ImportIssue<SupplierImportColumnKey>;

export type SupplierImportValues = Readonly<Record<SupplierImportColumnKey, string | boolean>>;

export type SupplierImportValidationContext = Readonly<{
  existingSuppliers: readonly ProcurementSupplier[];
  duplicatePolicy: "stop" | "ignore" | "update";
}>;

export type SupplierImportParsedRow = ParsedImportRow<SupplierImportColumnKey, SupplierImportValues>;
export type SupplierImportPreview = ImportPreview<SupplierImportColumnKey, SupplierImportValues>;

export type SupplierImportRequest = Readonly<{
  rows: readonly SupplierImportRawRow[];
  mapping: SupplierImportMapping;
  duplicatePolicy: "stop" | "ignore" | "update";
}>;

export type SupplierImportResult = Readonly<{
  importedCount: number;
  updatedCount: number;
  ignoredCount: number;
  failedCount: number;
  preview: SupplierImportPreview;
  suppliers: readonly ProcurementSupplier[];
}>;
