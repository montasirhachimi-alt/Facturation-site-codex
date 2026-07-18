import { inventoryLocalService } from "@/modules/inventory/inventory-local-store";
import type { StockMovement } from "@/modules/inventory/inventory.types";
import { deliveryNoteService, DELIVERY_NOTES_WORKSPACE_ID } from "@/modules/sales/delivery-notes";
import type { DeliveryNote } from "@/modules/sales/delivery-notes/delivery-note.types";
import { salesOrderService, SALES_ORDERS_WORKSPACE_ID } from "@/modules/sales/orders";
import type { SalesOrder } from "@/modules/sales/orders/order.types";
import type { InventoryTimelineDataSource } from "./inventory-timeline.types";

export function createDefaultInventoryTimelineDataSource(): InventoryTimelineDataSource {
  return Object.freeze({
    getSalesOrder: (id: string) => salesOrderService.getOrder(id as never, SALES_ORDERS_WORKSPACE_ID),
    listSalesOrders: () => salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: true }).orders,
    getDeliveryNote: (id: string) => deliveryNoteService.getDeliveryNote(id as never, DELIVERY_NOTES_WORKSPACE_ID),
    listDeliveryNotes: () => deliveryNoteService.listDeliveryNotes({ workspaceId: DELIVERY_NOTES_WORKSPACE_ID, includeArchived: true }).deliveryNotes,
    getMovement: (id: string) => inventoryLocalService.getSnapshot().movements.find((movement) => movement.id === id) as StockMovement | undefined,
    listMovements: () => inventoryLocalService.getSnapshot().movements
  });
}

export function createInventoryTimelineDataSourceFromRecords(input: {
  salesOrders?: readonly SalesOrder[];
  deliveryNotes?: readonly DeliveryNote[];
  movements?: readonly StockMovement[];
}): InventoryTimelineDataSource {
  const salesOrders = Object.freeze([...(input.salesOrders ?? [])]);
  const deliveryNotes = Object.freeze([...(input.deliveryNotes ?? [])]);
  const movements = Object.freeze([...(input.movements ?? [])]);

  return Object.freeze({
    getSalesOrder: (id: string) => salesOrders.find((order) => order.id === id),
    listSalesOrders: () => salesOrders,
    getDeliveryNote: (id: string) => deliveryNotes.find((note) => note.id === id),
    listDeliveryNotes: () => deliveryNotes,
    getMovement: (id: string) => movements.find((movement) => movement.id === id),
    listMovements: () => movements
  });
}
