import type { CreateProductCategoryInput, CreateProductInput, UpdateProductCategoryInput, UpdateProductInput } from "./product.types";

export type ProductValidationIssueCode =
  | "missing_workspace"
  | "missing_product_id"
  | "missing_category_id"
  | "missing_sku"
  | "missing_name"
  | "missing_category_name"
  | "duplicate_sku"
  | "duplicate_barcode"
  | "duplicate_category"
  | "invalid_barcode"
  | "invalid_purchase_price"
  | "invalid_selling_price"
  | "invalid_vat_rate"
  | "invalid_currency"
  | "permission_denied";

export type ProductValidationIssue = Readonly<{
  code: ProductValidationIssueCode;
  field?: string;
  message: string;
}>;

export type ProductValidationResult = Readonly<{
  valid: boolean;
  issues: readonly ProductValidationIssue[];
}>;

const BARCODE_PATTERN = /^[0-9A-Za-z -]{4,64}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export function validateCreateProductInput(input: CreateProductInput): ProductValidationResult {
  const issues: ProductValidationIssue[] = [];
  addWorkspaceIssue(input.workspaceId, issues);
  addSkuIssue(input.sku, issues);
  addNameIssue(input.name, issues);
  addBarcodeIssue(input.barcode, issues);
  addMoneyIssue(input.purchasePrice ?? 0, "purchasePrice", "invalid_purchase_price", "Prix d'achat invalide.", issues);
  addMoneyIssue(input.sellingPrice, "sellingPrice", "invalid_selling_price", "Prix de vente invalide.", issues);
  addVatIssue(input.vatRate, issues);
  addCurrencyIssue(input.currency, issues);
  addPermissionIssue(input.permission, issues);
  return createValidationResult(issues);
}

export function validateUpdateProductInput(input: UpdateProductInput): ProductValidationResult {
  const issues: ProductValidationIssue[] = [];
  if (!input.id?.trim()) issues.push({ code: "missing_product_id", field: "id", message: "Product id is required." });
  addWorkspaceIssue(input.workspaceId, issues);
  if (input.sku !== undefined) addSkuIssue(input.sku, issues);
  if (input.name !== undefined) addNameIssue(input.name, issues);
  addBarcodeIssue(input.barcode, issues);
  if (input.purchasePrice !== undefined) addMoneyIssue(input.purchasePrice, "purchasePrice", "invalid_purchase_price", "Prix d'achat invalide.", issues);
  if (input.sellingPrice !== undefined) addMoneyIssue(input.sellingPrice, "sellingPrice", "invalid_selling_price", "Prix de vente invalide.", issues);
  addVatIssue(input.vatRate, issues);
  addCurrencyIssue(input.currency, issues);
  addPermissionIssue(input.permission, issues);
  return createValidationResult(issues);
}

export function validateCreateProductCategoryInput(input: CreateProductCategoryInput): ProductValidationResult {
  const issues: ProductValidationIssue[] = [];
  addWorkspaceIssue(input.workspaceId, issues);
  addCategoryNameIssue(input.name, issues);
  addPermissionIssue(input.permission, issues);
  return createValidationResult(issues);
}

export function validateUpdateProductCategoryInput(input: UpdateProductCategoryInput): ProductValidationResult {
  const issues: ProductValidationIssue[] = [];
  if (!input.id?.trim()) issues.push({ code: "missing_category_id", field: "id", message: "Category id is required." });
  addWorkspaceIssue(input.workspaceId, issues);
  if (input.name !== undefined) addCategoryNameIssue(input.name, issues);
  addPermissionIssue(input.permission, issues);
  return createValidationResult(issues);
}

function addWorkspaceIssue(workspaceId: string | undefined, issues: ProductValidationIssue[]) {
  if (!workspaceId?.trim()) issues.push({ code: "missing_workspace", field: "workspaceId", message: "Workspace scope is required." });
}

function addSkuIssue(sku: string | undefined, issues: ProductValidationIssue[]) {
  if (!sku?.trim()) issues.push({ code: "missing_sku", field: "sku", message: "SKU is required." });
}

function addNameIssue(name: string | undefined, issues: ProductValidationIssue[]) {
  if (!name?.trim()) issues.push({ code: "missing_name", field: "name", message: "Product name is required." });
}

function addCategoryNameIssue(name: string | undefined, issues: ProductValidationIssue[]) {
  if (!name?.trim()) issues.push({ code: "missing_category_name", field: "name", message: "Category name is required." });
}

function addBarcodeIssue(barcode: string | undefined, issues: ProductValidationIssue[]) {
  if (barcode && !BARCODE_PATTERN.test(barcode.trim())) {
    issues.push({ code: "invalid_barcode", field: "barcode", message: "Barcode format is invalid." });
  }
}

function addMoneyIssue(value: number, field: string, code: ProductValidationIssueCode, message: string, issues: ProductValidationIssue[]) {
  if (!Number.isFinite(value) || value < 0) issues.push({ code, field, message });
}

function addVatIssue(value: number | undefined, issues: ProductValidationIssue[]) {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    issues.push({ code: "invalid_vat_rate", field: "vatRate", message: "VAT rate is invalid." });
  }
}

function addCurrencyIssue(value: string | undefined, issues: ProductValidationIssue[]) {
  if (value && !CURRENCY_PATTERN.test(value.trim().toUpperCase())) {
    issues.push({ code: "invalid_currency", field: "currency", message: "Currency must be an ISO code." });
  }
}

function addPermissionIssue(permission: CreateProductInput["permission"], issues: ProductValidationIssue[]) {
  if (permission && !permission.allowed) {
    issues.push({ code: "permission_denied", field: "permission", message: "Product operation is not permitted." });
  }
}

function createValidationResult(issues: readonly ProductValidationIssue[]): ProductValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}
