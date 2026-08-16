import type { CreateShipmentInput, Shipment, ShipmentFilters, ShipmentId, ShipmentListResult, ShipmentStatus, UpdateShipmentInput } from "./shipment.types";
import { formatShipmentNumber, matchesShipmentSearch, normalizeShipmentText, validateShipmentStatusTransition } from "./shipment.utils";

export class ShipmentService {
  private readonly shipments = new Map<ShipmentId, Shipment>();
  private readonly now: () => string;

  constructor(options: { seed?: readonly Shipment[]; now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    options.seed?.forEach((shipment) => this.shipments.set(shipment.id, freezeShipment(shipment)));
  }

  listShipments(filters: ShipmentFilters): ShipmentListResult {
    const shipments = [...this.shipments.values()]
      .filter((shipment) => shipment.workspaceId === filters.workspaceId)
      .filter((shipment) => !filters.status || filters.status === "all" || shipment.status === filters.status)
      .filter((shipment) => !filters.carrier || shipment.carrier === filters.carrier)
      .filter((shipment) => !filters.companyId || filters.companyId === "all" || shipment.companyId === filters.companyId)
      .filter((shipment) => !filters.date || shipment.shipmentDate.slice(0, 10) === filters.date)
      .filter((shipment) => !filters.query || matchesShipmentSearch(shipment, filters.query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return Object.freeze({ shipments: Object.freeze(shipments), total: shipments.length });
  }

  getShipment(id: ShipmentId, workspaceId: ShipmentFilters["workspaceId"]) {
    const shipment = this.shipments.get(id);
    return shipment?.workspaceId === workspaceId ? shipment : undefined;
  }

  createShipment(input: CreateShipmentInput) {
    const existing = [...this.shipments.values()].find((shipment) => shipment.deliveryNoteId === input.deliveryNoteId && shipment.status !== "cancelled");
    if (existing) return Object.freeze({ shipment: undefined, error: "Une expédition existe déjà pour ce bon de livraison." });

    return this.createShipmentUnchecked(input);
  }

  createShipmentUnchecked(input: CreateShipmentInput) {
    const carrier = normalizeShipmentText(input.carrier);
    if (!input.deliveryNoteId || !input.deliveryNoteNumber.trim()) return Object.freeze({ shipment: undefined, error: "Sélectionnez un bon de livraison." });
    if (!input.companyId || !input.companyName.trim()) return Object.freeze({ shipment: undefined, error: "La société est obligatoire." });
    if (!carrier) return Object.freeze({ shipment: undefined, error: "Renseignez le transporteur." });
    if (input.lines.length === 0) return Object.freeze({ shipment: undefined, error: "Le bon de livraison ne contient aucune ligne à expédier." });

    const timestamp = this.now();
    const shipment = freezeShipment({
      ...input,
      id: `shipment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as ShipmentId,
      number: formatShipmentNumber(this.shipments.size + 1),
      carrier,
      trackingNumber: normalizeShipmentText(input.trackingNumber) || undefined,
      expectedDelivery: input.expectedDelivery || undefined,
      notes: normalizeShipmentText(input.notes) || undefined,
      status: input.status ?? "draft",
      createdAt: timestamp,
      updatedAt: timestamp
    });
    this.shipments.set(shipment.id, shipment);
    return Object.freeze({ shipment });
  }

  updateShipment(input: UpdateShipmentInput) {
    const existing = this.shipments.get(input.id);
    if (!existing || existing.workspaceId !== input.workspaceId) return Object.freeze({ shipment: undefined, error: "Expédition introuvable." });
    if (input.status && input.status !== existing.status) {
      try {
        validateShipmentStatusTransition(existing.status, input.status);
      } catch (error) {
        return Object.freeze({ shipment: undefined, error: error instanceof Error ? error.message : "Transition d'expédition non autorisée." });
      }
    }
    const updated = freezeShipment({
      ...existing,
      carrier: input.carrier !== undefined ? normalizeShipmentText(input.carrier) : existing.carrier,
      trackingNumber: input.trackingNumber !== undefined ? normalizeShipmentText(input.trackingNumber) || undefined : existing.trackingNumber,
      shipmentDate: input.shipmentDate ?? existing.shipmentDate,
      expectedDelivery: input.expectedDelivery !== undefined ? input.expectedDelivery || undefined : existing.expectedDelivery,
      status: input.status ?? existing.status,
      deliveredAt: input.status === "delivered" && !existing.deliveredAt ? this.now() : existing.deliveredAt,
      notes: input.notes !== undefined ? normalizeShipmentText(input.notes) || undefined : existing.notes,
      updatedAt: this.now()
    });
    if (!updated.carrier) return Object.freeze({ shipment: undefined, error: "Renseignez le transporteur." });
    this.shipments.set(updated.id, updated);
    return Object.freeze({ shipment: updated });
  }

  updateShipmentStatus(id: ShipmentId, workspaceId: ShipmentFilters["workspaceId"], status: ShipmentStatus) {
    return this.updateShipment({ id, workspaceId, status });
  }

  replaceShipments(shipments: readonly Shipment[]) {
    this.shipments.clear();
    shipments.forEach((shipment) => this.shipments.set(shipment.id, freezeShipment(shipment)));
  }
}

export function freezeShipment(shipment: Shipment): Shipment {
  return Object.freeze({ ...shipment, lines: Object.freeze(shipment.lines.map((line) => Object.freeze({ ...line }))) });
}
