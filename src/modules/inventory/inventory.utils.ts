import type { InventoryBalance, InventoryCompanyId, InventoryWarehouseId, StockMovement } from "./inventory.types";
import type { ProductId } from "@/modules/products";

export function normalizeWarehouseCode(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

export function calculateQuantityAvailable(quantityOnHand: number, quantityReserved: number) {
  return roundQuantity(quantityOnHand - quantityReserved);
}

export function roundQuantity(value: number) {
  return Math.round(value * 1000000) / 1000000;
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
