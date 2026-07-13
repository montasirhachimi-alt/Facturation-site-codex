import type { ProductId, ProductUnit, WorkspaceId } from "@/modules/products";

export type ProcurementSupplierId = string & { readonly __brand: "ProcurementSupplierId" };
export type PurchaseOrderId = string & { readonly __brand: "PurchaseOrderId" };
export type PurchaseOrderLineId = string & { readonly __brand: "PurchaseOrderLineId" };
export type GoodsReceiptId = string & { readonly __brand: "GoodsReceiptId" };
export type GoodsReceiptLineId = string & { readonly __brand: "GoodsReceiptLineId" };
export type ProcurementUserId = string & { readonly __brand: "ProcurementUserId" };

export type SupplierStatus = "active" | "archived";
export type PurchaseOrderStatus = "draft" | "sent" | "confirmed" | "partially_received" | "received" | "cancelled" | "archived";
export type GoodsReceiptStatus = "draft" | "posted" | "cancelled" | "archived";

export type ProcurementSupplier = Readonly<{
  id: ProcurementSupplierId;
  workspaceId: WorkspaceId;
  companyName: string;
  tradeName?: string;
  ice?: string;
  taxId?: string;
  rc?: string;
  vat?: string;
  phone?: string;
  email?: string;
  address?: string;
  country: string;
  currency: string;
  paymentTerms?: string;
  notes?: string;
  status: SupplierStatus;
  active: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: ProcurementUserId;
  updatedBy?: ProcurementUserId;
}>;

export type PurchaseOrderLine = Readonly<{
  id: PurchaseOrderLineId;
  productId?: ProductId;
  productSku?: string;
  productName?: string;
  description: string;
  quantity: number;
  unit: ProductUnit | string;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
}>;

export type PurchaseOrder = Readonly<{
  id: PurchaseOrderId;
  workspaceId: WorkspaceId;
  number: string;
  supplierId: ProcurementSupplierId;
  supplierName: string;
  status: PurchaseOrderStatus;
  issueDate: string;
  expectedDate?: string;
  currency: string;
  reference?: string;
  notes?: string;
  lines: readonly PurchaseOrderLine[];
  discountRate: number;
  ownerId?: ProcurementUserId;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type GoodsReceiptLine = Readonly<{
  id: GoodsReceiptLineId;
  purchaseOrderLineId: PurchaseOrderLineId;
  productId: ProductId;
  productSku?: string;
  productName?: string;
  description: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  receivedQuantity: number;
  unit: ProductUnit | string;
}>;

export type GoodsReceipt = Readonly<{
  id: GoodsReceiptId;
  workspaceId: WorkspaceId;
  number: string;
  supplierId: ProcurementSupplierId;
  supplierName: string;
  purchaseOrderId: PurchaseOrderId;
  purchaseOrderNumber: string;
  warehouseId: string;
  warehouseName?: string;
  receiptDate: string;
  status: GoodsReceiptStatus;
  reference?: string;
  notes?: string;
  lines: readonly GoodsReceiptLine[];
  postedAt?: string;
  archivedAt?: string;
  ownerId?: ProcurementUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateSupplierInput = Readonly<Omit<ProcurementSupplier, "id" | "status" | "active" | "archivedAt" | "createdAt" | "updatedAt">>;
export type UpdateSupplierInput = Readonly<Partial<Omit<CreateSupplierInput, "workspaceId" | "createdBy">> & {
  id: ProcurementSupplierId;
  workspaceId: WorkspaceId;
  status?: SupplierStatus;
  active?: boolean;
  updatedBy?: ProcurementUserId;
}>;

export type CreatePurchaseOrderInput = Readonly<Omit<PurchaseOrder, "id" | "number" | "status" | "createdAt" | "updatedAt" | "supplierName"> & {
  status?: PurchaseOrderStatus;
  supplierName?: string;
}>;
export type UpdatePurchaseOrderInput = Readonly<Partial<Omit<CreatePurchaseOrderInput, "workspaceId" | "ownerId">> & {
  id: PurchaseOrderId;
  workspaceId: WorkspaceId;
  status?: PurchaseOrderStatus;
}>;

export type SupplierFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: SupplierStatus | "all";
  includeArchived?: boolean;
}>;

export type PurchaseOrderFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: PurchaseOrderStatus | "all";
  supplierId?: ProcurementSupplierId | "all";
  includeArchived?: boolean;
}>;

export type CreateGoodsReceiptInput = Readonly<Omit<GoodsReceipt, "id" | "number" | "status" | "createdAt" | "updatedAt" | "postedAt" | "supplierName" | "purchaseOrderNumber"> & {
  status?: GoodsReceiptStatus;
  supplierName?: string;
  purchaseOrderNumber?: string;
}>;

export type UpdateGoodsReceiptInput = Readonly<Partial<Omit<CreateGoodsReceiptInput, "workspaceId" | "ownerId">> & {
  id: GoodsReceiptId;
  workspaceId: WorkspaceId;
  status?: GoodsReceiptStatus;
  postedAt?: string;
}>;

export type GoodsReceiptFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: GoodsReceiptStatus | "all";
  supplierId?: ProcurementSupplierId | "all";
  purchaseOrderId?: PurchaseOrderId | "all";
  includeArchived?: boolean;
}>;
