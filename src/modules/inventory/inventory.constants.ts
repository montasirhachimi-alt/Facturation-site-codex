import type { InventoryPolicy } from "./inventory.types";

export const DEFAULT_INVENTORY_POLICY: InventoryPolicy = Object.freeze({
  allowNegativeStock: false
});
