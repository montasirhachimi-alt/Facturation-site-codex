import { DeliveryNoteService } from "./delivery-note.service";

export const deliveryNoteService = new DeliveryNoteService();

const listeners = new Set<() => void>();

export function subscribeToDeliveryNoteStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyDeliveryNoteStoreUpdated() {
  listeners.forEach((listener) => listener());
}
