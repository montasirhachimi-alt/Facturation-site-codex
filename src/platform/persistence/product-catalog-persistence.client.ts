"use client";

import type { Product, ProductCategory } from "@/modules/products";
import { productLocalService, notifyProductStoreUpdated } from "@/modules/products/ui/product-local-store";

export type ProductCatalogSnapshot = Readonly<{
  products: Product[];
  categories: ProductCategory[];
}>;

export type ProductCatalogPersistenceResource = "product" | "category";

let hydrationPromise: Promise<void> | null = null;

export function hydrateProductCatalogPersistence() {
  hydrationPromise ??= fetch("/api/persistence/product-catalog", {
    method: "GET",
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      if (!response.ok) return;
      const snapshot = await response.json() as ProductCatalogSnapshot;
      applyProductCatalogSnapshot(snapshot);
    })
    .catch(() => {
      hydrationPromise = null;
    });

  return hydrationPromise;
}

export function persistProductCatalogRecord(resource: ProductCatalogPersistenceResource, record: unknown) {
  return fetch("/api/persistence/product-catalog", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ resource, record })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "La sauvegarde du catalogue a échoué.");
    }
    return response.json();
  });
}

export function applyProductCatalogSnapshot(snapshot: ProductCatalogSnapshot) {
  productLocalService.replaceCategories(snapshot.categories ?? []);
  productLocalService.replaceProducts(snapshot.products ?? []);
  notifyProductStoreUpdated();
}
