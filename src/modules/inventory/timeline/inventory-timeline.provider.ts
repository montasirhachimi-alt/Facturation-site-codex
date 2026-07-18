import type { StockMovement } from "@/modules/inventory/inventory.types";
import type { DeliveryNote } from "@/modules/sales/delivery-notes/delivery-note.types";
import type { SalesOrder } from "@/modules/sales/orders/order.types";
import type { TimelineEvent, TimelineProvider, TimelineQuery } from "@/runtime/timeline";
import { createDefaultInventoryTimelineDataSource } from "./inventory-timeline.data-source";
import {
  mapDeliveryNoteTimelineEvents,
  mapInventoryIssueTimelineEvents,
  mapReservationTimelineEvents
} from "./inventory-timeline.mapper";
import type { InventoryTimelineDataSource, InventoryTimelineEntityType, InventoryTimelineJourney } from "./inventory-timeline.types";
import { isInventoryTimelineQuery, normalizeInventoryTimelineEntityType } from "./inventory-timeline.utils";

export const INVENTORY_TIMELINE_PROVIDER_ID = "inventory.timeline";

export class InventoryTimelineProvider implements TimelineProvider {
  readonly id = INVENTORY_TIMELINE_PROVIDER_ID;
  readonly label = "Inventory Timeline Provider";

  private readonly dataSource: InventoryTimelineDataSource;

  constructor(dataSource: InventoryTimelineDataSource = createDefaultInventoryTimelineDataSource()) {
    this.dataSource = dataSource;
  }

  supports(query: TimelineQuery) {
    return isInventoryTimelineQuery(query);
  }

  getEvents(query: TimelineQuery): readonly TimelineEvent[] {
    const rootType = normalizeInventoryTimelineEntityType(query.entityType);
    if (!rootType) return Object.freeze([]);

    const journey = this.resolveJourney(rootType, query.entityId);
    if (!journey) return Object.freeze([]);

    const postedNotes = journey.deliveryNotes
      .filter((note) => note.status === "posted" && note.postedAt)
      .sort((left, right) => (left.postedAt ?? left.updatedAt).localeCompare(right.postedAt ?? right.updatedAt));

    const events = [
      ...journey.movements
        .filter((movement) => movement.type === "RESERVATION" || movement.type === "RELEASE")
        .flatMap((movement) => mapReservationTimelineEvents(rootType, query, movement)),
      ...journey.deliveryNotes.flatMap((note) =>
        mapDeliveryNoteTimelineEvents(
          rootType,
          query,
          note,
          journey.salesOrder,
          postedNotes.findIndex((postedNote) => postedNote.id === note.id),
          postedNotes.length
        )
      ),
      ...journey.movements
        .filter((movement) => movement.type === "ISSUE")
        .flatMap((movement) => mapInventoryIssueTimelineEvents(rootType, query, movement))
    ];

    return Object.freeze(events);
  }

  private resolveJourney(rootType: InventoryTimelineEntityType, rootId: string): InventoryTimelineJourney | undefined {
    switch (rootType) {
      case "sales.order":
        return this.resolveFromSalesOrder(rootId);
      case "delivery.note":
        return this.resolveFromDeliveryNote(rootId);
      case "inventory.movement":
      case "inventory.reservation":
        return this.resolveFromMovement(rootType, rootId);
    }
  }

  private resolveFromSalesOrder(orderId: string): InventoryTimelineJourney | undefined {
    const order = this.dataSource.getSalesOrder(orderId);
    if (!order) return undefined;

    return this.createJourney("sales.order", order.id, order);
  }

  private resolveFromDeliveryNote(deliveryNoteId: string): InventoryTimelineJourney | undefined {
    const note = this.dataSource.getDeliveryNote(deliveryNoteId);
    if (!note) return undefined;

    const order = this.dataSource.getSalesOrder(note.salesOrderId);
    return this.createJourney("delivery.note", note.id, order, [note]);
  }

  private resolveFromMovement(rootType: InventoryTimelineEntityType, movementId: string): InventoryTimelineJourney | undefined {
    const movement = this.dataSource.getMovement(movementId);
    if (!movement) return undefined;

    const note = movement.referenceType === "DELIVERY_NOTE" && movement.referenceId
      ? this.dataSource.getDeliveryNote(movement.referenceId)
      : undefined;
    const order = note
      ? this.dataSource.getSalesOrder(note.salesOrderId)
      : movement.referenceType === "SALES_ORDER" && movement.referenceId
        ? this.dataSource.getSalesOrder(movement.referenceId)
        : undefined;

    return this.createJourney(rootType, movement.id, order, note ? [note] : [], [movement]);
  }

  private createJourney(
    rootType: InventoryTimelineEntityType,
    rootId: string,
    order: SalesOrder | undefined,
    seedDeliveryNotes: readonly DeliveryNote[] = [],
    seedMovements: readonly StockMovement[] = []
  ): InventoryTimelineJourney {
    const orderDeliveryNotes = order
      ? this.dataSource.listDeliveryNotes().filter((note) => note.salesOrderId === order.id)
      : [];
    const deliveryNotes = uniqueById([...seedDeliveryNotes, ...orderDeliveryNotes]);
    const deliveryNoteIds = new Set(deliveryNotes.map((note) => String(note.id)));
    const orderMovements = order
      ? this.dataSource.listMovements().filter((movement) => movement.referenceType === "SALES_ORDER" && movement.referenceId === order.id)
      : [];
    const deliveryMovements = this.dataSource.listMovements().filter((movement) =>
      movement.referenceType === "DELIVERY_NOTE" && Boolean(movement.referenceId) && deliveryNoteIds.has(String(movement.referenceId))
    );

    return Object.freeze({
      rootType,
      rootId,
      salesOrder: order,
      deliveryNotes,
      movements: uniqueById([...seedMovements, ...orderMovements, ...deliveryMovements])
    });
  }
}

function uniqueById<TRecord extends { readonly id: string }>(records: readonly TRecord[]): readonly TRecord[] {
  const byId = new Map<string, TRecord>();

  for (const record of records) {
    byId.set(record.id, record);
  }

  return Object.freeze([...byId.values()]);
}
