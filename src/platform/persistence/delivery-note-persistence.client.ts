"use client";

import type { DeliveryNote } from "@/modules/sales/delivery-notes";
import { deliveryNoteService, notifyDeliveryNoteStoreUpdated } from "@/modules/sales/delivery-notes";
import { applyInventorySnapshot, type InventorySnapshot } from "./inventory-persistence.client";
import { hydrateCrmSalesPersistence } from "./crm-sales-persistence.client";

export type DeliveryNoteSnapshot = Readonly<{ deliveryNotes: DeliveryNote[] }>;

let hydrationPromise: Promise<void> | null = null;

export function hydrateDeliveryNotePersistence() {
  hydrationPromise ??= fetch("/api/persistence/delivery-notes", { method: "GET", headers: { Accept: "application/json" } })
    .then(async (response) => {
      if (!response.ok) return;
      applyDeliveryNoteSnapshot(await response.json() as DeliveryNoteSnapshot);
    })
    .catch(() => { hydrationPromise = null; });
  return hydrationPromise;
}

export function persistDeliveryNoteDraft(note: DeliveryNote) {
  return requestDeliveryNote({ operation: "saveDraft", payload: note }).then((body) => {
    if (body.snapshot) applyDeliveryNoteSnapshot(body.snapshot);
    return body.record as DeliveryNote;
  });
}

export function postPersistedDeliveryNote(deliveryNoteId: string) {
  return requestDeliveryNote({ operation: "post", payload: { deliveryNoteId } }).then(async (body) => {
    if (body.snapshot) applyDeliveryNoteSnapshot(body.snapshot);
    if (body.inventorySnapshot) applyInventorySnapshot(body.inventorySnapshot);
    await hydrateCrmSalesPersistence({ force: true });
    return body;
  });
}

export function archivePersistedDeliveryNote(deliveryNoteId: string) {
  return requestDeliveryNote({ operation: "archive", payload: { deliveryNoteId } }).then((body) => {
    if (body.snapshot) applyDeliveryNoteSnapshot(body.snapshot);
    return body;
  });
}

export function applyDeliveryNoteSnapshot(snapshot: DeliveryNoteSnapshot) {
  deliveryNoteService.replaceDeliveryNotes(snapshot.deliveryNotes ?? []);
  notifyDeliveryNoteStoreUpdated();
}

function requestDeliveryNote(payload: unknown) {
  return fetch("/api/persistence/delivery-notes", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(async (response) => {
    const body = await response.json().catch(() => undefined) as {
      error?: string;
      record?: DeliveryNote;
      snapshot?: DeliveryNoteSnapshot;
      inventorySnapshot?: InventorySnapshot;
    } | undefined;
    if (!response.ok) throw new Error(body?.error ?? "Impossible d'enregistrer le bon de livraison.");
    return body ?? {};
  });
}
