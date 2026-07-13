import type { ProductId } from "@/modules/products";

export type InventoryWarehouseId = string & { readonly __brand: "InventoryWarehouseId" };
export type InventoryMovementId = string & { readonly __brand: "InventoryMovementId" };
export type InventoryCompanyId = string & { readonly __brand: "InventoryCompanyId" };
export type InventoryUserId = string & { readonly __brand: "InventoryUserId" };

export type InventoryMovementType =
  | "RECEIPT"
  | "ISSUE"
  | "TRANSFER"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "RESERVATION"
  | "RELEASE";

export type InventoryMovementStatus = "DRAFT" | "POSTED" | "CANCELLED";
export type InventoryMovementReferenceType =
  | "MANUAL"
  | "QUOTE"
  | "SALES_ORDER"
  | "DELIVERY"
  | "ADJUSTMENT"
  | "PURCHASE_ORDER"
  | "GOODS_RECEIPT"
  | "SUPPLIER";

export type InventoryPolicy = Readonly<{
  allowNegativeStock: boolean;
}>;

export type InventoryAvailability = Readonly<{
  companyId: InventoryCompanyId;
  productId: ProductId;
  warehouseId: InventoryWarehouseId;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityIncoming: number;
  quantityOutgoing: number;
  quantityProjected: number;
}>;

export type Warehouse = Readonly<{
  id: InventoryWarehouseId;
  companyId: InventoryCompanyId;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type InventoryBalance = Readonly<{
  id: string;
  companyId: InventoryCompanyId;
  productId: ProductId;
  warehouseId: InventoryWarehouseId;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  lastMovementDate?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type StockMovement = Readonly<{
  id: InventoryMovementId;
  companyId: InventoryCompanyId;
  productId: ProductId;
  fromWarehouseId?: InventoryWarehouseId;
  toWarehouseId?: InventoryWarehouseId;
  type: InventoryMovementType;
  status: InventoryMovementStatus;
  quantity: number;
  reference?: string;
  referenceType?: InventoryMovementReferenceType;
  referenceId?: string;
  reason?: string;
  postedAt?: string;
  cancelledAt?: string;
  createdBy?: InventoryUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateWarehouseInput = Readonly<{
  companyId: InventoryCompanyId;
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}>;

export type UpdateWarehouseInput = Readonly<{
  companyId: InventoryCompanyId;
  warehouseId: InventoryWarehouseId;
  code?: string;
  name?: string;
  description?: string;
  active?: boolean;
  isDefault?: boolean;
}>;

export type ArchiveWarehouseInput = Readonly<{
  companyId: InventoryCompanyId;
  warehouseId: InventoryWarehouseId;
}>;

export type PostMovementInput = Readonly<{
  id?: InventoryMovementId;
  companyId: InventoryCompanyId;
  productId: ProductId;
  fromWarehouseId?: InventoryWarehouseId;
  toWarehouseId?: InventoryWarehouseId;
  type: InventoryMovementType;
  quantity: number;
  reference?: string;
  referenceType?: InventoryMovementReferenceType;
  referenceId?: string;
  reason?: string;
  createdBy?: InventoryUserId;
  policy?: Partial<InventoryPolicy>;
}>;

export type InventorySnapshot = Readonly<{
  warehouses: readonly Warehouse[];
  balances: readonly InventoryBalance[];
  movements: readonly StockMovement[];
}>;

export type InventoryValidationIssue = Readonly<{
  code:
    | "missing_company"
    | "missing_warehouse"
    | "missing_product"
    | "missing_code"
    | "missing_name"
    | "duplicate_warehouse_code"
    | "duplicate_default_warehouse"
    | "inactive_warehouse"
    | "invalid_quantity"
    | "insufficient_stock"
    | "insufficient_reserved"
    | "duplicate_posting"
    | "invalid_movement";
  field?: string;
  message: string;
}>;

export type InventoryValidationResult = Readonly<{
  valid: boolean;
  issues: readonly InventoryValidationIssue[];
}>;

export type InventoryOperationResult<T> = Readonly<{
  data?: T;
  validation: InventoryValidationResult;
}>;

export type ReservationRequest = Readonly<{
  companyId: InventoryCompanyId;
  productId: ProductId;
  warehouseId: InventoryWarehouseId;
  quantity: number;
  reference?: string;
  referenceType?: InventoryMovementReferenceType;
  referenceId?: string;
  reason?: string;
  createdBy?: InventoryUserId;
}>;
