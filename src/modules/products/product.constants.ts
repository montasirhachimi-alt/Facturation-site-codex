import type { ProductCatalogFlags, ProductSort, ProductUnit, UserId, WorkspaceId } from "./product.types";

export const PRODUCTS_WORKSPACE_ID = "products-catalog" as WorkspaceId;
export const PRODUCTS_USER_ID = "user-products-system" as UserId;

export const PRODUCT_UNITS = Object.freeze([
  { id: "piece", label: "Pièce" },
  { id: "kg", label: "Kilogramme" },
  { id: "meter", label: "Mètre" },
  { id: "liter", label: "Litre" },
  { id: "box", label: "Boîte" },
  { id: "pack", label: "Pack" }
] satisfies readonly { id: ProductUnit; label: string }[]);

export const DEFAULT_PRODUCT_UNIT: ProductUnit = "piece";
export const DEFAULT_PRODUCT_CURRENCY = "MAD";
export const DEFAULT_PRODUCT_VAT_RATE = 20;

export const DEFAULT_PRODUCT_FLAGS: ProductCatalogFlags = Object.freeze({
  trackInventory: false,
  allowNegativeStock: false,
  hasVariants: false,
  serialTracked: false,
  batchTracked: false
});

export const DEFAULT_PRODUCT_SORT: ProductSort = Object.freeze({
  field: "updatedAt",
  direction: "desc"
});
