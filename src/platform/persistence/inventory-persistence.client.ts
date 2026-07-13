"use client";

import type { InventorySnapshot, PostMovementInput, ReservationRequest } from "@/modules/inventory";
import { applyInventorySnapshot } from "@/modules/inventory/inventory-local-store";

export type { InventorySnapshot };
export { applyInventorySnapshot };

let hydrationPromise: Promise<void> | null = null;

export function hydrateInventoryPersistence() {
  hydrationPromise ??= fetch("/api/persistence/inventory", {
    method: "GET",
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      if (!response.ok) return;
      const snapshot = await response.json() as InventorySnapshot;
      applyInventorySnapshot(snapshot);
    })
    .catch(() => {
      hydrationPromise = null;
    });

  return hydrationPromise;
}

export function refreshInventoryPersistence() {
  hydrationPromise = null;
  return hydrateInventoryPersistence();
}

export function persistInventoryOperation(operation: "createWarehouse", payload: { code: string; name: string; description?: string; isDefault?: boolean }): Promise<unknown>;
export function persistInventoryOperation(operation: "updateWarehouse", payload: { warehouseId: string; code?: string; name?: string; description?: string; active?: boolean; isDefault?: boolean }): Promise<unknown>;
export function persistInventoryOperation(operation: "archiveWarehouse", payload: { warehouseId: string }): Promise<unknown>;
export function persistInventoryOperation(operation: "postMovement", payload: PostMovementInput): Promise<unknown>;
export function persistInventoryOperation(operation: "reserve" | "release", payload: ReservationRequest): Promise<unknown>;
export function persistInventoryOperation(operation: string, payload: unknown) {
  return fetch("/api/persistence/inventory", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation, payload })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "La sauvegarde inventaire a échoué.");
    }
    const body = await response.json() as { snapshot?: InventorySnapshot };
    if (body.snapshot) applyInventorySnapshot(body.snapshot);
    return body;
  });
}
