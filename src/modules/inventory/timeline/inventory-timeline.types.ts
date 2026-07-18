import type { StockMovement } from "@/modules/inventory/inventory.types";
import type { DeliveryNote } from "@/modules/sales/delivery-notes/delivery-note.types";
import type { SalesOrder } from "@/modules/sales/orders/order.types";

export type InventoryTimelineEntityType =
  | "sales.order"
  | "delivery.note"
  | "inventory.movement"
  | "inventory.reservation";

export type InventoryTimelineSourceType = "sales.order" | "delivery.note" | "inventory.movement" | "inventory.reservation";

export type InventoryTimelineDataSource = Readonly<{
  getSalesOrder(id: string): SalesOrder | undefined;
  listSalesOrders(): readonly SalesOrder[];
  getDeliveryNote(id: string): DeliveryNote | undefined;
  listDeliveryNotes(): readonly DeliveryNote[];
  getMovement(id: string): StockMovement | undefined;
  listMovements(): readonly StockMovement[];
}>;

export type InventoryTimelineJourney = Readonly<{
  rootType: InventoryTimelineEntityType;
  rootId: string;
  salesOrder?: SalesOrder;
  deliveryNotes: readonly DeliveryNote[];
  movements: readonly StockMovement[];
}>;
