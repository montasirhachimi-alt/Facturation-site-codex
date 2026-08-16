"use client";

import type { Product, ProductCategory } from "@/modules/products";
import type { ProductImportRequest, ProductImportResult } from "@/modules/products";
import { productLocalService, notifyProductStoreUpdated } from "@/modules/products/ui/product-local-store";

export type ProductCatalogSnapshot = Readonly<{
  products: Product[];
  categories: ProductCategory[];
}>;

export type ProductCatalogPersistenceResource = "product" | "category";

let hydrationPromise: Promise<void> | null = null;

export class ProductCatalogClientPersistenceError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ProductCatalogClientPersistenceError";
    this.status = status;
    this.code = code;
  }
}

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
      const body = await response.json().catch(() => undefined) as { code?: string; error?: string } | undefined;
      throw new ProductCatalogClientPersistenceError(
        body?.error ?? productCatalogFallbackError(response.status),
        response.status,
        body?.code
      );
    }
    return response.json();
  });
}

function productCatalogFallbackError(status: number) {
  if (status === 401) return "Session expirée. Reconnectez-vous puis réessayez.";
  if (status === 403) return "Vous n'avez pas accès à ce catalogue produit.";
  if (status === 409) return "Un produit avec les mêmes identifiants existe déjà.";
  if (status === 400) return "Les informations du produit sont invalides.";
  return "La sauvegarde du catalogue a échoué.";
}

export function importProductCatalog(payload: ProductImportRequest) {
  return fetch("/api/persistence/product-catalog", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "importProducts", payload })
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
      throw new Error(body?.error ?? "L'import produits a échoué.");
    }
    const body = await response.json() as { result: ProductImportResult; snapshot?: ProductCatalogSnapshot };
    if (body.snapshot) applyProductCatalogSnapshot(body.snapshot);
    return body.result;
  });
}

export function applyProductCatalogSnapshot(snapshot: ProductCatalogSnapshot) {
  productLocalService.replaceCategories(snapshot.categories ?? []);
  productLocalService.replaceProducts(snapshot.products ?? []);
  notifyProductStoreUpdated();
}
