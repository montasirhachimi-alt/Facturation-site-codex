import {
  buildExportRows,
  buildImportPreview,
  createDefaultImportMapping,
  createImportIssue,
  createTemplateRows,
  normalizeImportText,
  optionalTextValue,
  parseBooleanValue,
  parseNumberValue,
  textValue,
  type ExporterDefinition,
  type ImportColumnDefinition,
  type ImporterDefinition
} from "@/platform/import-export";

import { DEFAULT_PRODUCT_CURRENCY, DEFAULT_PRODUCT_UNIT, DEFAULT_PRODUCT_VAT_RATE, PRODUCT_UNITS } from "./product.constants";
import type { Product, ProductUnit } from "./product.types";
import { normalizeBarcode, normalizeSearchText, normalizeSku } from "./product.utils";
import type {
  ProductImportColumnKey,
  ProductImportIssue,
  ProductImportMapping,
  ProductImportParsedRow,
  ProductImportPreview,
  ProductImportRawRow,
  ProductImportValidationContext,
  ProductImportValues
} from "./product-import-export.types";

export const PRODUCT_IMPORT_MAX_ROWS = 1000;
export const PRODUCT_IMPORT_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const PRODUCT_IMPORT_COLUMNS = Object.freeze([
  { key: "sku", label: "SKU", required: true, aliases: ["sku", "reference", "référence", "ref", "code produit"] },
  { key: "barcode", label: "Code-barres", aliases: ["barcode", "code-barres", "code barres", "ean", "upc"] },
  { key: "name", label: "Nom", required: true, aliases: ["name", "nom", "produit", "designation", "désignation"] },
  { key: "shortDescription", label: "Description courte", aliases: ["short description", "description courte", "résumé", "resume"] },
  { key: "description", label: "Description", aliases: ["description", "details", "détails"] },
  { key: "category", label: "Catégorie", aliases: ["category", "catégorie", "categorie", "famille"] },
  { key: "brand", label: "Marque", aliases: ["brand", "marque"] },
  { key: "unit", label: "Unité", aliases: ["unit", "unité", "unite", "uom"] },
  { key: "purchasePrice", label: "Prix d'achat", aliases: ["purchase price", "prix d'achat", "prix achat", "cost", "coût", "cout"] },
  { key: "sellingPrice", label: "Prix de vente", aliases: ["selling price", "prix de vente", "prix vente", "sale price", "prix ht"] },
  { key: "vatRate", label: "TVA", aliases: ["vat", "tva", "vat rate", "taux tva"] },
  { key: "currency", label: "Devise", aliases: ["currency", "devise", "monnaie"] },
  { key: "active", label: "Actif", aliases: ["active", "actif", "status", "statut"] },
  { key: "notes", label: "Notes", aliases: ["notes", "note", "commentaire", "commentaires"] }
] satisfies readonly { key: ProductImportColumnKey; label: string; required?: boolean; aliases: readonly string[] }[]);

export const PRODUCT_EXPORT_HEADERS: Record<ProductImportColumnKey, string> = {
  active: "Actif",
  barcode: "Code-barres",
  brand: "Marque",
  category: "Catégorie",
  currency: "Devise",
  description: "Description",
  name: "Nom",
  notes: "Notes",
  purchasePrice: "Prix d'achat",
  sellingPrice: "Prix de vente",
  shortDescription: "Description courte",
  sku: "SKU",
  unit: "Unité",
  vatRate: "TVA"
};

const unitSet = new Set<string>(PRODUCT_UNITS.map((unit) => unit.id));

const productImportColumns = PRODUCT_IMPORT_COLUMNS.map((column) => ({
  aliases: column.aliases,
  field: column.key,
  label: column.label,
  required: column.required
})) satisfies readonly ImportColumnDefinition<ProductImportColumnKey>[];

export const PRODUCT_IMPORTER_DEFINITION = Object.freeze({
  identifier: "products.import",
  entityLabel: "Produit",
  supportedFormats: ["xlsx", "csv"],
  columns: productImportColumns,
  duplicatePolicySupport: ["stop", "ignore", "update"],
  identityField: "sku",
  duplicatePolicyMessage: "Ce SKU existe déjà dans le catalogue.",
  duplicatePolicySuggestion: "Choisissez Ignorer les doublons ou Mettre à jour par SKU.",
  maxRows: PRODUCT_IMPORT_MAX_ROWS,
  maxFileSize: PRODUCT_IMPORT_MAX_FILE_SIZE,
  sampleRow: {
    [PRODUCT_EXPORT_HEADERS.sku]: "PROD-001",
    [PRODUCT_EXPORT_HEADERS.barcode]: "6111234567890",
    [PRODUCT_EXPORT_HEADERS.name]: "Produit exemple",
    [PRODUCT_EXPORT_HEADERS.shortDescription]: "Description courte",
    [PRODUCT_EXPORT_HEADERS.description]: "Description détaillée du produit",
    [PRODUCT_EXPORT_HEADERS.category]: "Non classé",
    [PRODUCT_EXPORT_HEADERS.brand]: "Marque",
    [PRODUCT_EXPORT_HEADERS.unit]: "piece",
    [PRODUCT_EXPORT_HEADERS.purchasePrice]: 100,
    [PRODUCT_EXPORT_HEADERS.sellingPrice]: 150,
    [PRODUCT_EXPORT_HEADERS.vatRate]: 20,
    [PRODUCT_EXPORT_HEADERS.currency]: "MAD",
    [PRODUCT_EXPORT_HEADERS.active]: "Oui",
    [PRODUCT_EXPORT_HEADERS.notes]: "Ligne d'exemple à remplacer"
  },
  instructions: [
    ["Instructions"],
    ["Champs obligatoires", "SKU, Nom"],
    ["Unités acceptées", "piece, kg, meter, liter, box, pack"],
    ["TVA", "Nombre entre 0 et 100. Exemple: 20"],
    ["Doublons", "Choisir la politique avant confirmation: ignorer, mettre à jour par SKU ou arrêter l'import."],
    ["Stock", "Ne renseignez aucune quantité de stock dans ce modèle."]
  ],
  parseRow: parseProductImportRow,
  validateRow: validateProductImportValues,
  resolveExisting: (values, context) => values.sku ? context.existingProducts.find((product) => product.sku === values.sku) : undefined,
  getExistingId: (product) => product.id,
  duplicateChecks: [
    {
      field: "sku",
      getValue: (values) => values.sku,
      withinFileMessage: (firstRowNumber) => `SKU déjà présent à la ligne ${firstRowNumber}.`,
      suggestion: "Conservez une seule ligne par SKU."
    },
    {
      field: "barcode",
      getValue: (values) => values.barcode,
      findExisting: (barcode, context) => context.existingProducts.find((product) => product.barcode === barcode),
      withinFileMessage: (firstRowNumber) => `Code-barres déjà présent à la ligne ${firstRowNumber}.`,
      existingConflictMessage: "Ce code-barres existe déjà sur un autre produit.",
      suggestion: "Utilisez un code-barres unique ou laissez le champ vide."
    }
  ]
} satisfies ImporterDefinition<ProductImportColumnKey, ProductImportValues, ProductImportValidationContext, Product>);

export const PRODUCT_EXPORTER_DEFINITION = Object.freeze({
  identifier: "products.export",
  entityLabel: "Produit",
  supportedFormats: ["xlsx", "csv"],
  filename: (scope, format) => `products-${scope}.${format}`,
  columns: PRODUCT_IMPORT_COLUMNS.map((column) => ({
    field: column.key,
    label: PRODUCT_EXPORT_HEADERS[column.key],
    formatter: (product: Product) => productToExportRowValues(product)[column.key]
  }))
} satisfies ExporterDefinition<Product>);

export function createDefaultProductImportMapping(headers: readonly string[]): ProductImportMapping {
  return createDefaultImportMapping(productImportColumns, headers);
}

export function validateProductImportRows(
  rows: readonly ProductImportRawRow[],
  mapping: ProductImportMapping,
  context: ProductImportValidationContext
): ProductImportPreview {
  const preview = buildImportPreview(PRODUCT_IMPORTER_DEFINITION, rows, mapping, context, context.duplicatePolicy);
  const productRows: ProductImportParsedRow[] = preview.rows.map((row) => Object.freeze({
    ...row,
    existingProductId: row.existingRecordId
  }));

  return Object.freeze({
    totalRows: preview.totalRows,
    validRows: preview.validRows,
    invalidRows: preview.invalidRows,
    newProducts: preview.newRecords,
    productsToUpdate: preview.recordsToUpdate,
    ignoredRows: preview.ignoredRows,
    rows: Object.freeze(productRows),
    issues: preview.issues
  });
}

export function productToExportRow(product: Product): Record<string, string | number | boolean> {
  return buildExportRows(PRODUCT_EXPORTER_DEFINITION, [product])[0] ?? {};
}

export function createProductImportTemplateRows() {
  return createTemplateRows(PRODUCT_IMPORTER_DEFINITION);
}

function parseProductImportRow(
  row: ProductImportRawRow,
  mapping: ProductImportMapping,
  context: ProductImportValidationContext
): ProductImportValues {
  const category = textValue(row, mapping.category);
  const categoryByName = new Map(context.categories.map((entry) => [normalizeImportText(entry.name), entry]));
  const matchedCategory = category ? categoryByName.get(normalizeImportText(category)) : undefined;

  return Object.freeze({
    sku: normalizeSku(textValue(row, mapping.sku)),
    barcode: normalizeBarcode(textValue(row, mapping.barcode)),
    name: textValue(row, mapping.name),
    shortDescription: optionalTextValue(row, mapping.shortDescription),
    description: optionalTextValue(row, mapping.description),
    category: optionalTextValue(row, mapping.category),
    categoryId: matchedCategory?.id,
    brand: optionalTextValue(row, mapping.brand),
    unit: parseUnit(textValue(row, mapping.unit)),
    purchasePrice: parseNumberValue(row, mapping.purchasePrice, 0),
    sellingPrice: parseNumberValue(row, mapping.sellingPrice, Number.NaN),
    vatRate: parseNumberValue(row, mapping.vatRate, DEFAULT_PRODUCT_VAT_RATE),
    currency: (textValue(row, mapping.currency) || DEFAULT_PRODUCT_CURRENCY).toUpperCase(),
    active: parseBooleanValue(textValue(row, mapping.active), true),
    notes: optionalTextValue(row, mapping.notes)
  });
}

function validateProductImportValues(values: ProductImportValues, rowNumber: number): readonly ProductImportIssue[] {
  const issues: ProductImportIssue[] = [];
  if (!values.sku) issues.push(issue(rowNumber, "sku", "", "SKU obligatoire.", "Renseignez une référence unique."));
  if (!values.name) issues.push(issue(rowNumber, "name", "", "Nom obligatoire.", "Renseignez le nom du produit."));
  if (values.barcode && !/^[0-9A-Za-z -]{4,64}$/.test(values.barcode)) issues.push(issue(rowNumber, "barcode", values.barcode, "Code-barres invalide.", "Utilisez 4 à 64 caractères alphanumériques."));
  if (!unitSet.has(values.unit)) issues.push(issue(rowNumber, "unit", values.unit, "Unité non supportée.", `Valeurs acceptées: ${PRODUCT_UNITS.map((unit) => unit.id).join(", ")}.`));
  if (!Number.isFinite(values.purchasePrice) || values.purchasePrice < 0) issues.push(issue(rowNumber, "purchasePrice", String(values.purchasePrice), "Prix d'achat invalide.", "Utilisez un nombre positif."));
  if (!Number.isFinite(values.sellingPrice) || values.sellingPrice < 0) issues.push(issue(rowNumber, "sellingPrice", String(values.sellingPrice), "Prix de vente invalide.", "Utilisez un nombre positif."));
  if (!Number.isFinite(values.vatRate) || values.vatRate < 0 || values.vatRate > 100) issues.push(issue(rowNumber, "vatRate", String(values.vatRate), "TVA invalide.", "Utilisez un taux entre 0 et 100."));
  if (!/^[A-Z]{3}$/.test(values.currency)) issues.push(issue(rowNumber, "currency", values.currency, "Devise invalide.", "Utilisez un code ISO comme MAD, EUR ou USD."));
  if (values.sku.length > 64) issues.push(issue(rowNumber, "sku", values.sku, "SKU trop long.", "Limitez le SKU à 64 caractères."));
  if (values.name.length > 180) issues.push(issue(rowNumber, "name", values.name, "Nom trop long.", "Limitez le nom à 180 caractères."));
  return Object.freeze(issues);
}

function productToExportRowValues(product: Product): Record<ProductImportColumnKey, string | number | boolean> {
  return {
    active: product.active ? "Oui" : "Non",
    barcode: product.barcode ?? "",
    brand: product.brand ?? "",
    category: product.categoryName ?? "",
    currency: product.currency,
    description: product.description ?? "",
    name: product.name,
    notes: product.notes ?? "",
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    shortDescription: product.shortDescription ?? "",
    sku: product.sku,
    unit: product.unit,
    vatRate: product.vatRate
  };
}

function parseUnit(value: string): ProductUnit {
  const normalized = normalizeSearchText(value || DEFAULT_PRODUCT_UNIT);
  const labelMatch = PRODUCT_UNITS.find((unit) => normalizeSearchText(unit.label) === normalized || unit.id === normalized);
  return (labelMatch?.id ?? (value.trim() || DEFAULT_PRODUCT_UNIT)) as ProductUnit;
}

function issue(rowNumber: number, column: ProductImportIssue["column"], value: string, message: string, suggestion?: string): ProductImportIssue {
  return createImportIssue(rowNumber, column, value, message, suggestion);
}
