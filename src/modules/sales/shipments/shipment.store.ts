import { ShipmentService } from "./shipment.service";

export const shipmentService = new ShipmentService();

const listeners = new Set<() => void>();

export function subscribeToShipmentStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyShipmentStoreUpdated() {
  listeners.forEach((listener) => listener());
}
