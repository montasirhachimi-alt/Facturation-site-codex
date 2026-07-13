import {
  buildExportRows,
  buildImportPreview,
  createDefaultImportMapping,
  createImportIssue,
  createTemplateRows,
  optionalTextValue,
  parseBooleanValue,
  textValue,
  type ExporterDefinition,
  type ImportColumnDefinition,
  type ImporterDefinition
} from "@/platform/import-export";
import { DEFAULT_PROCUREMENT_CURRENCY, DEFAULT_SUPPLIER_COUNTRY } from "./procurement.constants";
import type { ProcurementSupplier } from "./procurement.types";
import type {
  SupplierImportColumnKey,
  SupplierImportMapping,
  SupplierImportPreview,
  SupplierImportRawRow,
  SupplierImportValidationContext,
  SupplierImportValues
} from "./supplier-import-export.types";

export const SUPPLIER_IMPORT_COLUMNS = Object.freeze([
  { key: "companyName", label: "Raison sociale", required: true, aliases: ["raison sociale", "fournisseur", "supplier", "company name", "nom"] },
  { key: "tradeName", label: "Nom commercial", aliases: ["nom commercial", "trade name"] },
  { key: "ice", label: "ICE", aliases: ["ice"] },
  { key: "taxId", label: "IF", aliases: ["if", "tax id", "identifiant fiscal"] },
  { key: "rc", label: "RC", aliases: ["rc", "registre commerce"] },
  { key: "vat", label: "TVA", aliases: ["tva", "vat"] },
  { key: "phone", label: "Téléphone", aliases: ["telephone", "téléphone", "phone"] },
  { key: "email", label: "Email", aliases: ["email", "mail"] },
  { key: "address", label: "Adresse", aliases: ["adresse", "address"] },
  { key: "country", label: "Pays", aliases: ["pays", "country"] },
  { key: "currency", label: "Devise", aliases: ["devise", "currency"] },
  { key: "paymentTerms", label: "Conditions paiement", aliases: ["conditions paiement", "payment terms"] },
  { key: "active", label: "Actif", aliases: ["actif", "active", "statut"] },
  { key: "notes", label: "Notes", aliases: ["notes", "commentaires"] }
] satisfies readonly { key: SupplierImportColumnKey; label: string; required?: boolean; aliases: readonly string[] }[]);

const supplierImportColumns = SUPPLIER_IMPORT_COLUMNS.map((column) => ({
  field: column.key,
  label: column.label,
  aliases: column.aliases,
  required: column.required
})) satisfies readonly ImportColumnDefinition<SupplierImportColumnKey>[];

export const SUPPLIER_IMPORTER_DEFINITION = Object.freeze({
  identifier: "procurement.suppliers.import",
  entityLabel: "Fournisseur",
  supportedFormats: ["xlsx", "csv"],
  columns: supplierImportColumns,
  duplicatePolicySupport: ["stop", "ignore", "update"],
  identityField: "companyName",
  maxRows: 1000,
  maxFileSize: 5 * 1024 * 1024,
  sampleRow: {
    "Raison sociale": "Atlas Distribution",
    "Nom commercial": "Atlas",
    ICE: "001122334455667",
    IF: "12345678",
    RC: "12345",
    TVA: "TVA-001",
    "Téléphone": "+212 522 00 00 00",
    Email: "achats@atlas.example",
    Adresse: "Casablanca",
    Pays: "Maroc",
    Devise: "MAD",
    "Conditions paiement": "30 jours",
    Actif: "Oui",
    Notes: "Fournisseur exemple"
  },
  parseRow: parseSupplierImportRow,
  validateRow: validateSupplierImportValues,
  resolveExisting: (values, context) => context.existingSuppliers.find((supplier) => supplier.companyName.toLowerCase() === String(values.companyName).toLowerCase()),
  getExistingId: (supplier) => supplier.id
} satisfies ImporterDefinition<SupplierImportColumnKey, SupplierImportValues, SupplierImportValidationContext, ProcurementSupplier>);

export const SUPPLIER_EXPORTER_DEFINITION = Object.freeze({
  identifier: "procurement.suppliers.export",
  entityLabel: "Fournisseur",
  supportedFormats: ["xlsx", "csv"],
  filename: (scope, format) => `suppliers-${scope}.${format}`,
  columns: SUPPLIER_IMPORT_COLUMNS.map((column) => ({
    field: column.key,
    label: column.label,
    formatter: (supplier: ProcurementSupplier) => supplierToExportValues(supplier)[column.key]
  }))
} satisfies ExporterDefinition<ProcurementSupplier>);

export function createDefaultSupplierImportMapping(headers: readonly string[]): SupplierImportMapping {
  return createDefaultImportMapping(supplierImportColumns, headers);
}

export function validateSupplierImportRows(rows: readonly SupplierImportRawRow[], mapping: SupplierImportMapping, context: SupplierImportValidationContext): SupplierImportPreview {
  return buildImportPreview(SUPPLIER_IMPORTER_DEFINITION, rows, mapping, context, context.duplicatePolicy);
}

export function supplierToExportRow(supplier: ProcurementSupplier) {
  return buildExportRows(SUPPLIER_EXPORTER_DEFINITION, [supplier])[0] ?? {};
}

export function createSupplierImportTemplateRows() {
  return createTemplateRows(SUPPLIER_IMPORTER_DEFINITION);
}

function parseSupplierImportRow(row: SupplierImportRawRow, mapping: SupplierImportMapping): SupplierImportValues {
  return Object.freeze({
    companyName: textValue(row, mapping.companyName),
    tradeName: optionalTextValue(row, mapping.tradeName) ?? "",
    ice: optionalTextValue(row, mapping.ice) ?? "",
    taxId: optionalTextValue(row, mapping.taxId) ?? "",
    rc: optionalTextValue(row, mapping.rc) ?? "",
    vat: optionalTextValue(row, mapping.vat) ?? "",
    phone: optionalTextValue(row, mapping.phone) ?? "",
    email: optionalTextValue(row, mapping.email) ?? "",
    address: optionalTextValue(row, mapping.address) ?? "",
    country: optionalTextValue(row, mapping.country) ?? DEFAULT_SUPPLIER_COUNTRY,
    currency: (optionalTextValue(row, mapping.currency) ?? DEFAULT_PROCUREMENT_CURRENCY).toUpperCase(),
    paymentTerms: optionalTextValue(row, mapping.paymentTerms) ?? "",
    active: parseBooleanValue(textValue(row, mapping.active), true),
    notes: optionalTextValue(row, mapping.notes) ?? ""
  });
}

function validateSupplierImportValues(values: SupplierImportValues, rowNumber: number) {
  const issues = [];
  if (!values.companyName) issues.push(createImportIssue(rowNumber, "companyName", "", "Raison sociale obligatoire.", "Renseignez le nom du fournisseur."));
  if (String(values.companyName).length > 180) issues.push(createImportIssue(rowNumber, "companyName", String(values.companyName), "Raison sociale trop longue.", "Limitez le nom à 180 caractères."));
  if (!/^[A-Z]{3}$/.test(String(values.currency))) issues.push(createImportIssue(rowNumber, "currency", String(values.currency), "Devise invalide.", "Utilisez un code ISO comme MAD, EUR ou USD."));
  return issues;
}

function supplierToExportValues(supplier: ProcurementSupplier): Record<SupplierImportColumnKey, string | boolean> {
  return {
    companyName: supplier.companyName,
    tradeName: supplier.tradeName ?? "",
    ice: supplier.ice ?? "",
    taxId: supplier.taxId ?? "",
    rc: supplier.rc ?? "",
    vat: supplier.vat ?? "",
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    country: supplier.country,
    currency: supplier.currency,
    paymentTerms: supplier.paymentTerms ?? "",
    active: supplier.active,
    notes: supplier.notes ?? ""
  };
}
