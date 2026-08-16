import type { InventoryBalance, StockMovement } from "@/modules/inventory";
import { calculateQuantityAvailable, roundQuantity } from "@/modules/inventory";
import type { Product } from "./product.types";

export type ProductStockStatus = "inStock" | "lowStock" | "outOfStock" | "reserved" | "inactive";

export type ProductStockSummary = Readonly<{
  productId: Product["id"];
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  status: ProductStockStatus;
  recentMovements: readonly StockMovement[];
}>;

export function summarizeProductStock(
  product: Product,
  balances: readonly InventoryBalance[],
  movements: readonly StockMovement[] = []
): ProductStockSummary {
  const productBalances = balances.filter((balance) => balance.productId === product.id);
  const quantityOnHand = roundQuantity(sum(productBalances, (balance) => balance.quantityOnHand));
  const quantityReserved = roundQuantity(sum(productBalances, (balance) => balance.quantityReserved));
  const quantityAvailable = calculateQuantityAvailable(quantityOnHand, quantityReserved);
  const balanceReorderPoint = Math.max(0, ...productBalances.map((balance) => balance.reorderPoint));
  const reorderPoint = roundQuantity(Math.max(product.reorderPoint, balanceReorderPoint));
  const recentMovements = movements
    .filter((movement) => movement.productId === product.id)
    .sort((first, second) => getMovementTime(second) - getMovementTime(first))
    .slice(0, 8);

  return Object.freeze({
    productId: product.id,
    quantityOnHand,
    quantityReserved,
    quantityAvailable,
    reorderPoint,
    status: getProductStockStatus(product, quantityAvailable, quantityReserved, reorderPoint),
    recentMovements: Object.freeze(recentMovements)
  });
}

export function getProductStockStatus(
  product: Product,
  quantityAvailable: number,
  quantityReserved: number,
  reorderPoint: number
): ProductStockStatus {
  if (!product.active || product.status === "archived") return "inactive";
  if (!product.flags.trackInventory) return "inStock";
  if (quantityAvailable <= 0) return "outOfStock";
  if (reorderPoint > 0 && quantityAvailable <= reorderPoint) return "lowStock";
  if (quantityReserved > 0) return "reserved";
  return "inStock";
}

export function productStockStatusLabel(status: ProductStockStatus) {
  const labels: Record<ProductStockStatus, string> = {
    inactive: "Inactif",
    inStock: "En stock",
    lowStock: "Stock faible",
    outOfStock: "Rupture",
    reserved: "Réservé"
  };
  return labels[status];
}

function sum<T>(items: readonly T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function getMovementTime(movement: StockMovement) {
  return new Date(movement.postedAt ?? movement.createdAt).getTime();
}
