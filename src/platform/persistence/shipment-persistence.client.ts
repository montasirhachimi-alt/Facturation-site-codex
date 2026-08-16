"use client";

import type { Shipment, ShipmentStatus } from "@/modules/sales/shipments";
import { notifyShipmentStoreUpdated, shipmentService } from "@/modules/sales/shipments";

export type ShipmentSnapshot = Readonly<{ shipments: Shipment[] }>;

let hydrationPromise: Promise<void> | null = null;

export function hydrateShipmentPersistence(options: { force?: boolean } = {}) {
  if (options.force) hydrationPromise = null;
  hydrationPromise ??= fetch("/api/persistence/shipments", {
    method: "GET",
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      if (!response.ok) return;
      applyShipmentSnapshot(await response.json() as ShipmentSnapshot);
    })
    .catch(() => {
      hydrationPromise = null;
    });

  return hydrationPromise;
}

export function persistShipmentRecord(shipment: Shipment) {
  return requestShipment({ operation: "save", payload: shipment }).then((body) => {
    if (body.snapshot) applyShipmentSnapshot(body.snapshot);
    return body.record as Shipment;
  });
}

export function transitionPersistedShipmentStatus(shipmentId: string, status: ShipmentStatus) {
  return requestShipment({ operation: "status", payload: { shipmentId, status } }).then((body) => {
    if (body.snapshot) applyShipmentSnapshot(body.snapshot);
    return body.record as Shipment;
  });
}

export function applyShipmentSnapshot(snapshot: ShipmentSnapshot) {
  shipmentService.replaceShipments(snapshot.shipments ?? []);
  notifyShipmentStoreUpdated();
}

function requestShipment(payload: unknown) {
  return fetch("/api/persistence/shipments", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(async (response) => {
    const body = await response.json().catch(() => undefined) as {
      error?: string;
      record?: Shipment;
      snapshot?: ShipmentSnapshot;
    } | undefined;
    if (!response.ok) throw new Error(body?.error ?? "Impossible d'enregistrer l'expédition.");
    return body ?? {};
  });
}
