import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import type { ProductId, ProductUnit } from "@/modules/products";
import type { QuoteId, QuoteCurrency, UserId, WorkspaceId } from "@/modules/sales/quotes";

export type SalesOrderId = string & { readonly __brand: "SalesOrderId" };

export type SalesOrderStatus = "draft" | "confirmed" | "partially_reserved" | "reserved" | "cancelled" | "archived" | "partially_delivered" | "delivered";
export type SalesOrderReservationStatus = "not_applicable" | "not_reserved" | "partially_reserved" | "reserved" | "released";

export type SalesOrderLine = Readonly<{
  id: string;
  productId?: ProductId;
  productSku?: string;
  productName?: string;
  description: string;
  quantityOrdered: number;
  quantityReserved: number;
  quantityDelivered: number;
  warehouseId?: string;
  warehouseName?: string;
  unit: ProductUnit | string;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
}>;

export type SalesOrder = Readonly<{
  id: SalesOrderId;
  workspaceId: WorkspaceId;
  number: string;
  companyId: CompanyId;
  companyName: string;
  contactId?: ContactId;
  contactName?: string;
  sourceQuoteId?: QuoteId;
  sourceQuoteNumber?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  currency: QuoteCurrency;
  status: SalesOrderStatus;
  reservationStatus: SalesOrderReservationStatus;
  customerReference?: string;
  internalReference?: string;
  notes?: string;
  lines: readonly SalesOrderLine[];
  discountRate: number;
  ownerId: UserId;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateSalesOrderInput = Readonly<Omit<SalesOrder, "id" | "number" | "status" | "reservationStatus" | "createdAt" | "updatedAt" | "archivedAt"> & {
  status?: SalesOrderStatus;
  reservationStatus?: SalesOrderReservationStatus;
}>;

export type SalesOrderFilters = Readonly<{
  workspaceId: WorkspaceId;
  query?: string;
  status?: SalesOrderStatus | "all";
  reservationStatus?: SalesOrderReservationStatus | "all";
  companyId?: CompanyId | "all";
  includeArchived?: boolean;
}>;

export type SalesOrderListResult = Readonly<{
  orders: readonly SalesOrder[];
  total: number;
}>;
