"use client";

import type { GoodsReceipt, ProcurementSupplier, PurchaseOrder } from "@/modules/procurement";
import type { SupplierImportRequest, SupplierImportResult } from "@/modules/procurement";
import { procurementLocalService, notifyProcurementStoreUpdated } from "@/modules/procurement/procurement.store";
import { applyInventorySnapshot, type InventorySnapshot } from "./inventory-persistence.client";

export type ProcurementSnapshot = Readonly<{
  suppliers: ProcurementSupplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
}>;

export type ProcurementPersistenceResource = "supplier" | "purchaseOrder" | "goodsReceipt";

let hydrationPromise: Promise<void> | null = null;

export function hydrateProcurementPersistence() {
  hydrationPromise ??= fetch("/api/persistence/procurement", {
    method: "GET",
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      if (!response.ok) return;
      const snapshot = await response.json() as ProcurementSnapshot;
      applyProcurementSnapshot(snapshot);
    })
    .catch(() => {
      hydrationPromise = null;
    });

  return hydrationPromise;
}

export function persistProcurementRecord(resource: ProcurementPersistenceResource, record: unknown) {
  return fetch("/api/persistence/procurement", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ resource, record })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "La sauvegarde achats a échoué.");
    }
    const body = await response.json() as { snapshot?: ProcurementSnapshot };
    if (body.snapshot) applyProcurementSnapshot(body.snapshot);
    return body;
  });
}

export function importProcurementSuppliers(payload: SupplierImportRequest) {
  return fetch("/api/persistence/procurement", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "importSuppliers", payload })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "L'import fournisseurs a échoué.");
    }
    const body = await response.json() as { result: SupplierImportResult; snapshot?: ProcurementSnapshot };
    if (body.snapshot) applyProcurementSnapshot(body.snapshot);
    return body.result;
  });
}

export function postProcurementGoodsReceipt(receipt: GoodsReceipt) {
  return fetch("/api/persistence/procurement", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "postGoodsReceipt", payload: receipt })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "La réception n'a pas pu être postée.");
    }
    const body = await response.json() as { snapshot?: ProcurementSnapshot; inventorySnapshot?: InventorySnapshot };
    if (body.snapshot) applyProcurementSnapshot(body.snapshot);
    if (body.inventorySnapshot) applyInventorySnapshot(body.inventorySnapshot);
    return body;
  });
}

export function applyProcurementSnapshot(snapshot: ProcurementSnapshot) {
  procurementLocalService.replaceSuppliers(snapshot.suppliers ?? []);
  procurementLocalService.replacePurchaseOrders(snapshot.purchaseOrders ?? []);
  procurementLocalService.replaceGoodsReceipts(snapshot.goodsReceipts ?? []);
  notifyProcurementStoreUpdated();
}
