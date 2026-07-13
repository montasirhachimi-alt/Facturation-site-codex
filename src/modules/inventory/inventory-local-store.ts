"use client";

import { InventoryService } from "./inventory.service";
import type { InventorySnapshot } from "./inventory.types";

export const inventoryStoreEventName = "hicopilot-inventory-updated";
export const inventoryLocalService = new InventoryService();

export function applyInventorySnapshot(snapshot: InventorySnapshot) {
  inventoryLocalService.replaceSnapshot(snapshot);
  notifyInventoryStoreUpdated();
}

export function notifyInventoryStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(inventoryStoreEventName));
}

export function subscribeToInventoryStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(inventoryStoreEventName, listener);
  return () => window.removeEventListener(inventoryStoreEventName, listener);
}
