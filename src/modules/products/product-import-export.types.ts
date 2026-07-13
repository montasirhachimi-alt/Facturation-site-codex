import type { Product, ProductCategory, ProductUnit } from "./product.types";
import type { ImportMapping, ImportRawRow, ImportIssue, ImportAction, ParsedImportRow, ImportRequest } from "@/platform/import-export";

export type ProductImportColumnKey =
  | "sku"
  | "barcode"
  | "name"
  | "shortDescription"
  | "description"
  | "category"
  | "brand"
  | "unit"
  | "purchasePrice"
  | "sellingPrice"
  | "vatRate"
  | "currency"
  | "active"
  | "notes";

export type ProductImportDuplicatePolicy = "ignore" | "update" | "stop";

export type ProductImportMapping = ImportMapping<ProductImportColumnKey>;

export type ProductImportRawRow = ImportRawRow;

export type ProductImportIssue = ImportIssue<ProductImportColumnKey>;

export type ProductImportAction = ImportAction;

export type ProductImportParsedRow = ParsedImportRow<ProductImportColumnKey, ProductImportValues> & Readonly<{
  existingProductId?: string;
}>;

export type ProductImportValues = Readonly<{
  sku: string;
  barcode?: string;
  name: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
  unit: ProductUnit;
  purchasePrice: number;
  sellingPrice: number;
  vatRate: number;
  currency: string;
  active: boolean;
  notes?: string;
}>;

export type ProductImportPreview = Readonly<{
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newProducts: number;
  productsToUpdate: number;
  ignoredRows: number;
  rows: readonly ProductImportParsedRow[];
  issues: readonly ProductImportIssue[];
}>;

export type ProductImportRequest = ImportRequest<ProductImportColumnKey>;

export type ProductImportResult = Readonly<{
  importedCount: number;
  updatedCount: number;
  ignoredCount: number;
  failedCount: number;
  preview: ProductImportPreview;
  products: readonly Product[];
}>;

export type ProductExportScope = "all" | "filtered" | "selected";

export type ProductImportValidationContext = Readonly<{
  existingProducts: readonly Product[];
  categories: readonly ProductCategory[];
  duplicatePolicy: ProductImportDuplicatePolicy;
}>;
