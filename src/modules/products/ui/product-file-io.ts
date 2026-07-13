"use client";

import { createInstructionRows, downloadCsvFile, downloadImportErrorReport, downloadXlsxFile, parseSpreadsheetFile } from "@/platform/import-export";

import type { Product } from "../product.types";
import {
  PRODUCT_EXPORT_HEADERS,
  PRODUCT_IMPORTER_DEFINITION,
  PRODUCT_IMPORT_MAX_FILE_SIZE,
  PRODUCT_IMPORT_MAX_ROWS,
  createDefaultProductImportMapping,
  createProductImportTemplateRows,
  productToExportRow,
  type ProductImportIssue,
  type ProductImportMapping,
  type ProductImportRawRow
} from "..";

export type ParsedProductImportFile = Readonly<{
  fileName: string;
  headers: readonly string[];
  rows: readonly ProductImportRawRow[];
  mapping: ProductImportMapping;
}>;

export async function parseProductImportFile(file: File): Promise<ParsedProductImportFile> {
  const { headers, rows } = await parseSpreadsheetFile(file, {
    maxFileSize: PRODUCT_IMPORT_MAX_FILE_SIZE,
    maxRows: PRODUCT_IMPORT_MAX_ROWS,
    emptyMessage: "Le fichier ne contient aucune ligne produit.",
    maxSizeMessage: "Le fichier dépasse la limite de 5 Mo."
  });

  return {
    fileName: file.name,
    headers,
    rows,
    mapping: createDefaultProductImportMapping(headers)
  };
}

export async function downloadProductImportTemplate(format: "xlsx" | "csv") {
  const rows = createProductImportTemplateRows();
  if (format === "csv") {
    downloadCsvFile("product-import-template.csv", rows);
    return;
  }

  await downloadXlsxFile("product-import-template.xlsx", [
    { name: "Produits", rows, header: Object.values(PRODUCT_EXPORT_HEADERS) },
    { name: "Instructions", rows: createInstructionRows(PRODUCT_IMPORTER_DEFINITION), aoa: true }
  ]);
}

export async function downloadProductsExport(products: readonly Product[], format: "xlsx" | "csv", fileName: string) {
  const rows = products.map(productToExportRow);
  if (format === "csv") {
    downloadCsvFile(`${fileName}.csv`, rows);
    return;
  }

  await downloadXlsxFile(`${fileName}.xlsx`, [
    { name: "Produits", rows, header: Object.values(PRODUCT_EXPORT_HEADERS) }
  ]);
}

export function downloadProductImportErrorReport(issues: readonly ProductImportIssue[]) {
  downloadImportErrorReport("product-import-errors.csv", issues);
}
