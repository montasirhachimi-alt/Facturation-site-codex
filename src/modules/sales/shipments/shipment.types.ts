import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import type { DeliveryNoteId, DeliveryNoteLine } from "@/modules/sales/delivery-notes";
import type { SalesOrderId } from "@/modules/sales/orders";
import type { UserId, WorkspaceId } from "@/modules/sales/quotes";

export type ShipmentId = string & { readonly __brand: "ShipmentId" };

export type ShipmentStatus = "draft" | "ready" | "shipped" | "in_transit" | "delivered" | "cancelled";

export type ShipmentLine = Readonly<{
  id: string;
  deliveryNoteLineId: string;
  productId: string;
  productSku?: string;
  productName?: string;
  description: string;
  unit: string;
  quantity: number;
}>;

export type Shipment = Readonly<{
  id: ShipmentId;
  workspaceId: WorkspaceId;
  number: string;
  deliveryNoteId: DeliveryNoteId;
  deliveryNoteNumber: string;
  salesOrderId: SalesOrderId;
  salesOrderNumber: string;
  companyId: CompanyId;
  companyName: string;
  contactId?: ContactId;
  contactName?: string;
  deliveryAddress?: string;
  carrier: string;
  trackingNumber?: string;
  shipmentDate: string;
  expectedDelivery?: string;
  deliveredAt?: string;
  status: ShipmentStatus;
  notes?: string;
  lines: readonly ShipmentLine[];
  createdAt: string;
  updatedAt: string;
  ownerId?: UserId;
}>;

export type CreateShipmentInput = Readonly<Omit<Shipment, "id" | "number" | "status" | "createdAt" | "updatedAt"> & {
  status?: ShipmentStatus;
}>;

export type UpdateShipmentInput = Readonly<Partial<Omit<CreateShipmentInput, "workspaceId" | "deliveryNoteId" | "salesOrderId" | "companyId" | "lines">> & {
  id: ShipmentId;
  workspaceId: WorkspaceId;
  status?: ShipmentStatus;
}>;

export type ShipmentFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: ShipmentStatus | "all";
  carrier?: string;
  companyId?: CompanyId | "all";
  date?: string;
}>;

export type ShipmentListResult = Readonly<{
  shipments: readonly Shipment[];
  total: number;
}>;

export type ShipmentTimelineStep = Readonly<{
  status: ShipmentStatus;
  label: string;
  description: string;
}>;

export type ShipmentSourceLine = Pick<DeliveryNoteLine, "id" | "productId" | "productSku" | "productName" | "description" | "unit" | "quantityPosted" | "quantityToDeliver">;
