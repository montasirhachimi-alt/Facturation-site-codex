import type { PermissionDecision } from "@/runtime/permissions";

export type ProductId = string & { readonly __brand: "ProductId" };
export type ProductCategoryId = string & { readonly __brand: "ProductCategoryId" };
export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type UserId = string & { readonly __brand: "UserId" };

export type ProductStatus = "active" | "archived";
export type ProductUnit = "piece" | "kg" | "meter" | "liter" | "box" | "pack";

export type ProductCatalogFlags = Readonly<{
  trackInventory: boolean;
  allowNegativeStock: boolean;
  hasVariants: boolean;
  serialTracked: boolean;
  batchTracked: boolean;
}>;

export type Product = Readonly<{
  id: ProductId;
  workspaceId: WorkspaceId;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId?: ProductCategoryId;
  categoryName?: string;
  brand?: string;
  unit: ProductUnit;
  purchasePrice: number;
  sellingPrice: number;
  vatRate: number;
  currency: string;
  active: boolean;
  image?: string;
  notes?: string;
  status: ProductStatus;
  flags: ProductCatalogFlags;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserId;
  updatedBy?: UserId;
}>;

export type ProductCategory = Readonly<{
  id: ProductCategoryId;
  workspaceId: WorkspaceId;
  name: string;
  parentId?: ProductCategoryId;
  description?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateProductInput = Readonly<{
  workspaceId: WorkspaceId;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId?: ProductCategoryId;
  categoryName?: string;
  brand?: string;
  unit?: ProductUnit;
  purchasePrice?: number;
  sellingPrice: number;
  vatRate?: number;
  currency?: string;
  image?: string;
  notes?: string;
  flags?: Partial<ProductCatalogFlags>;
  createdBy?: UserId;
  permission?: PermissionDecision;
}>;

export type UpdateProductInput = Partial<Omit<CreateProductInput, "workspaceId" | "createdBy">> & Readonly<{
  id: ProductId;
  workspaceId: WorkspaceId;
  active?: boolean;
  status?: ProductStatus;
  updatedBy?: UserId;
  permission?: PermissionDecision;
}>;

export type CreateProductCategoryInput = Readonly<{
  workspaceId: WorkspaceId;
  name: string;
  parentId?: ProductCategoryId;
  description?: string;
  order?: number;
  active?: boolean;
  permission?: PermissionDecision;
}>;

export type UpdateProductCategoryInput = Partial<Omit<CreateProductCategoryInput, "workspaceId">> & Readonly<{
  id: ProductCategoryId;
  workspaceId: WorkspaceId;
  permission?: PermissionDecision;
}>;

export type ProductFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: ProductStatus | "all";
  categoryId?: ProductCategoryId | "all";
  unit?: ProductUnit | "all";
  includeArchived?: boolean;
  permission?: PermissionDecision;
}>;

export type ProductSortField = "sku" | "name" | "sellingPrice" | "vatRate" | "status" | "updatedAt";
export type ProductSortDirection = "asc" | "desc";

export type ProductSort = Readonly<{
  field: ProductSortField;
  direction: ProductSortDirection;
}>;

export type ProductListResult = Readonly<{
  products: readonly Product[];
  total: number;
  filtered: number;
  workspaceId: WorkspaceId;
}>;

export type ProductCategoryListResult = Readonly<{
  categories: readonly ProductCategory[];
  total: number;
  workspaceId: WorkspaceId;
}>;
