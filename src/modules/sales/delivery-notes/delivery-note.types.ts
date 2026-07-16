import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import type { InventoryWarehouseId } from "@/modules/inventory";
import type { ProductId } from "@/modules/products";
import type { SalesOrderId } from "@/modules/sales/orders";
import type { UserId, WorkspaceId } from "@/modules/sales/quotes";

export type DeliveryNoteId = string & { readonly __brand: "DeliveryNoteId" };
export type DeliveryNoteStatus = "draft" | "posted" | "archived";

export type DeliveryNoteLine = Readonly<{
  id: string;
  salesOrderLineId: string;
  productId: ProductId;
  productSku?: string;
  productName?: string;
  description: string;
  unit: string;
  quantityToDeliver: number;
  quantityPosted: number;
}>;

export type DeliveryNote = Readonly<{
  id: DeliveryNoteId;
  workspaceId: WorkspaceId;
  number: string;
  companyId: CompanyId;
  companyName: string;
  contactId?: ContactId;
  contactName?: string;
  salesOrderId: SalesOrderId;
  salesOrderNumber: string;
  warehouseId: InventoryWarehouseId;
  warehouseName: string;
  deliveryDate: string;
  status: DeliveryNoteStatus;
  notes?: string;
  customerReference?: string;
  postedAt?: string;
  postedBy?: UserId;
  archivedAt?: string;
  lines: readonly DeliveryNoteLine[];
  createdAt: string;
  updatedAt: string;
}>;

export type CreateDeliveryNoteInput = Readonly<Omit<DeliveryNote, "id" | "number" | "status" | "postedAt" | "postedBy" | "archivedAt" | "createdAt" | "updatedAt">>;

export type DeliveryNoteFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: DeliveryNoteStatus | "all";
  salesOrderId?: SalesOrderId;
  companyId?: CompanyId | "all";
  includeArchived?: boolean;
}>;

export type DeliveryNoteListResult = Readonly<{
  deliveryNotes: readonly DeliveryNote[];
  total: number;
}>;
