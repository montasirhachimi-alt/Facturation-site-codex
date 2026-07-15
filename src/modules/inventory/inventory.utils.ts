import type { InventoryAvailability, InventoryBalance, InventoryCompanyId, InventoryWarehouseId, StockMovement } from "./inventory.types";
import type { ProductId } from "@/modules/products";

export const INVENTORY_QUANTITY_PRECISION = 6;
export const INVENTORY_QUANTITY_STEP = 1;

export function normalizeWarehouseCode(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

export function calculateQuantityAvailable(quantityOnHand: number, quantityReserved: number) {
  return roundQuantity(quantityOnHand - quantityReserved);
}

export function roundQuantity(value: number) {
  const factor = 10 ** INVENTORY_QUANTITY_PRECISION;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function normalizeInventoryQuantity(value: number) {
  if (!Number.isFinite(value)) return Number.NaN;
  return roundQuantity(value);
}

export function parseInventoryQuantityInput(value: string) {
  const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
  if (!normalized) return Number.NaN;
  return normalizeInventoryQuantity(Number(normalized));
}

export function formatInventoryQuantityInput(value: number) {
  const normalized = normalizeInventoryQuantity(value);
  if (!Number.isFinite(normalized)) return "";
  return String(normalized);
}

export function adjustInventoryQuantityInput(value: string, direction: 1 | -1, step = INVENTORY_QUANTITY_STEP) {
  const current = parseInventoryQuantityInput(value);
  const base = Number.isFinite(current) ? current : 0;
  return formatInventoryQuantityInput(Math.max(0, normalizeInventoryQuantity(base + direction * step)));
}

export function balanceKey(companyId: InventoryCompanyId, productId: ProductId, warehouseId: InventoryWarehouseId) {
  return `${companyId}:${productId}:${warehouseId}`;
}

export function createEmptyBalance({
  companyId,
  productId,
  warehouseId,
  now
}: {
  companyId: InventoryCompanyId;
  productId: ProductId;
  warehouseId: InventoryWarehouseId;
  now: string;
}): InventoryBalance {
  return Object.freeze({
    id: `balance_${companyId}_${productId}_${warehouseId}`,
    companyId,
    productId,
    warehouseId,
    quantityOnHand: 0,
    quantityReserved: 0,
    quantityAvailable: 0,
    reorderPoint: 0,
    createdAt: now,
    updatedAt: now
  });
}

export function createAvailabilityFromBalance(balance: InventoryBalance): InventoryAvailability {
  return Object.freeze({
    companyId: balance.companyId,
    productId: balance.productId,
    warehouseId: balance.warehouseId,
    quantityOnHand: roundQuantity(balance.quantityOnHand),
    quantityReserved: roundQuantity(balance.quantityReserved),
    quantityAvailable: calculateQuantityAvailable(balance.quantityOnHand, balance.quantityReserved),
    quantityIncoming: 0,
    quantityOutgoing: 0,
    quantityProjected: calculateQuantityAvailable(balance.quantityOnHand, balance.quantityReserved)
  });
}

export function freezeBalance(balance: InventoryBalance): InventoryBalance {
  return Object.freeze({
    ...balance,
    quantityOnHand: roundQuantity(balance.quantityOnHand),
    quantityReserved: roundQuantity(balance.quantityReserved),
    quantityAvailable: calculateQuantityAvailable(balance.quantityOnHand, balance.quantityReserved),
    reorderPoint: roundQuantity(balance.reorderPoint)
  });
}

export function freezeMovement(movement: StockMovement): StockMovement {
  return Object.freeze({ ...movement });
}
