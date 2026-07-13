import type { CreateWarehouseInput, InventoryValidationIssue, InventoryValidationResult, PostMovementInput, UpdateWarehouseInput } from "./inventory.types";

export function validateCreateWarehouseInput(input: CreateWarehouseInput): InventoryValidationResult {
  const issues: InventoryValidationIssue[] = [];
  if (!input.companyId?.trim()) issues.push({ code: "missing_company", field: "companyId", message: "Company scope is required." });
  if (!input.code?.trim()) issues.push({ code: "missing_code", field: "code", message: "Warehouse code is required." });
  if (!input.name?.trim()) issues.push({ code: "missing_name", field: "name", message: "Warehouse name is required." });
  return validationResult(issues);
}

export function validateUpdateWarehouseInput(input: UpdateWarehouseInput): InventoryValidationResult {
  const issues: InventoryValidationIssue[] = [];
  if (!input.companyId?.trim()) issues.push({ code: "missing_company", field: "companyId", message: "Company scope is required." });
  if (!input.warehouseId?.trim()) issues.push({ code: "missing_warehouse", field: "warehouseId", message: "Warehouse is required." });
  if (input.code !== undefined && !input.code.trim()) issues.push({ code: "missing_code", field: "code", message: "Warehouse code is required." });
  if (input.name !== undefined && !input.name.trim()) issues.push({ code: "missing_name", field: "name", message: "Warehouse name is required." });
  return validationResult(issues);
}

export function validatePostMovementInput(input: PostMovementInput): InventoryValidationResult {
  const issues: InventoryValidationIssue[] = [];
  if (!input.companyId?.trim()) issues.push({ code: "missing_company", field: "companyId", message: "Company scope is required." });
  if (!input.productId?.trim()) issues.push({ code: "missing_product", field: "productId", message: "Product is required." });
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) issues.push({ code: "invalid_quantity", field: "quantity", message: "Quantity must be greater than zero." });

  if ((input.type === "RECEIPT" || input.type === "ADJUSTMENT_IN" || input.type === "RESERVATION") && !input.toWarehouseId) {
    issues.push({ code: "missing_warehouse", field: "toWarehouseId", message: "Destination warehouse is required." });
  }

  if ((input.type === "ISSUE" || input.type === "ADJUSTMENT_OUT" || input.type === "RELEASE") && !input.fromWarehouseId) {
    issues.push({ code: "missing_warehouse", field: "fromWarehouseId", message: "Source warehouse is required." });
  }

  if (input.type === "TRANSFER" && (!input.fromWarehouseId || !input.toWarehouseId || input.fromWarehouseId === input.toWarehouseId)) {
    issues.push({ code: "invalid_movement", field: "warehouseId", message: "Transfer requires two different warehouses." });
  }

  return validationResult(issues);
}

export function validationResult(issues: readonly InventoryValidationIssue[]): InventoryValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze([...issues]) });
}

export function singleIssue(issue: InventoryValidationIssue): InventoryValidationResult {
  return validationResult([issue]);
}
