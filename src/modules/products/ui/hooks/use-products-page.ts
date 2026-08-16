"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { hydrateInventoryPersistence, hydrateProductCatalogPersistence, persistProductCatalogRecord } from "@/platform/persistence";
import { paginateCrmItems } from "@/modules/crm/shared";
import { formatInventoryQuantityInput, parseInventoryQuantityInput } from "@/modules/inventory";
import { inventoryLocalService, subscribeToInventoryStore } from "@/modules/inventory/inventory-local-store";
import { DEFAULT_PRODUCT_CURRENCY, DEFAULT_PRODUCT_UNIT, DEFAULT_PRODUCT_VAT_RATE, PRODUCTS_USER_ID, PRODUCTS_WORKSPACE_ID } from "../../product.constants";
import { summarizeProductStock, type ProductStockStatus, type ProductStockSummary } from "../../product-stock.utils";
import type { CreateProductInput, Product, ProductCategoryId, ProductId, ProductSort, ProductStatus, ProductUnit, UpdateProductInput } from "../../product.types";
import { productLocalService, notifyProductStoreUpdated, subscribeToProductStore } from "../product-local-store";

export type ProductFormState = Readonly<{
  sku: string;
  barcode: string;
  name: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  brand: string;
  unit: ProductUnit;
  purchasePrice: number;
  sellingPrice: number;
  vatRate: number;
  currency: string;
  reorderPoint: string;
  image: string;
  notes: string;
  trackInventory: boolean;
}>;

export type ProductSortKey = ProductSort["field"];
export type ProductOperationalSortKey = ProductSortKey | "quantityOnHand" | "quantityReserved" | "quantityAvailable" | "reorderPoint" | "stockStatus";
export type ProductStockStatusFilter = ProductStockStatus | "all";
export type ProductOperationalRow = Readonly<{
  id: ProductId;
  product: Product;
  stock: ProductStockSummary;
}>;

const emptyForm: ProductFormState = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  shortDescription: "",
  categoryId: "",
  brand: "",
  unit: DEFAULT_PRODUCT_UNIT,
  purchasePrice: 0,
  sellingPrice: 0,
  vatRate: DEFAULT_PRODUCT_VAT_RATE,
  currency: DEFAULT_PRODUCT_CURRENCY,
  reorderPoint: "0",
  image: "",
  notes: "",
  trackInventory: true
};

export function useProductsPage() {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProductStatus | "all">("active");
  const [unit, setUnit] = useState<ProductUnit | "all">("all");
  const [categoryId, setCategoryId] = useState<ProductCategoryId | "all">("all");
  const [stockStatus, setStockStatus] = useState<ProductStockStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sort, setSort] = useState<Readonly<{ field: ProductOperationalSortKey; direction: "asc" | "desc" }>>({ field: "updatedAt", direction: "desc" });
  const [selectedIds, setSelectedIds] = useState<readonly ProductId[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribeProducts = subscribeToProductStore(refresh);
    const unsubscribeInventory = subscribeToInventoryStore(refresh);
    return () => {
      unsubscribeProducts();
      unsubscribeInventory();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([hydrateProductCatalogPersistence(), hydrateInventoryPersistence()])
      .catch(() => {
        if (!cancelled) setLoadError("Le catalogue produits n'a pas pu être actualisé.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  void version;
  const categories = productLocalService.listCategories(PRODUCTS_WORKSPACE_ID).categories;
  const baseProducts = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: true }).products;
  const inventorySnapshot = inventoryLocalService.getSnapshot();
  const filteredBaseProducts = productLocalService.listProducts({
    workspaceId: PRODUCTS_WORKSPACE_ID,
    query,
    status,
    unit,
    categoryId,
    includeArchived: status !== "active"
  }).products;
  const filteredRows = useMemo(() => {
    const rows = filteredBaseProducts
      .map((product) => ({
        id: product.id,
        product,
        stock: summarizeProductStock(product, inventorySnapshot.balances, inventorySnapshot.movements)
      } satisfies ProductOperationalRow))
      .filter((row) => stockStatus === "all" || row.stock.status === stockStatus);
    return sortOperationalRows(rows, sort);
  }, [filteredBaseProducts, inventorySnapshot.balances, inventorySnapshot.movements, sort, stockStatus]);
  const paginatedProducts = paginateCrmItems(filteredRows, { page, pageSize });
  const allStockSummaries = baseProducts.map((product) => summarizeProductStock(product, inventorySnapshot.balances, inventorySnapshot.movements));
  const stats = {
    total: baseProducts.filter((product) => product.status !== "archived").length,
    archived: baseProducts.filter((product) => product.status === "archived").length,
    categories: categories.filter((category) => category.active).length,
    averagePrice: getAveragePrice(baseProducts.filter((product) => product.status !== "archived")),
    lowStock: allStockSummaries.filter((summary) => summary.status === "lowStock").length,
    outOfStock: allStockSummaries.filter((summary) => summary.status === "outOfStock").length,
    quantityOnHand: allStockSummaries.reduce((sum, summary) => sum + summary.quantityOnHand, 0),
    quantityReserved: allStockSummaries.reduce((sum, summary) => sum + summary.quantityReserved, 0),
    quantityAvailable: allStockSummaries.reduce((sum, summary) => sum + summary.quantityAvailable, 0)
  };

  const resetPage = useCallback(() => setPage(1), []);

  const updateSort = useCallback((field: ProductOperationalSortKey) => {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
  }, []);

  const toggleRow = useCallback((id: ProductId) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }, []);

  const toggleAllVisible = useCallback(() => {
    const visibleIds = paginatedProducts.items.map((row) => row.id);
    setSelectedIds((current) => {
      const allSelected = visibleIds.every((id) => current.includes(id));
      return allSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds]));
    });
  }, [paginatedProducts.items]);

  const openCreateDialog = useCallback(() => {
    setError(null);
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((product: Product) => {
    setError(null);
    setEditingProduct(product);
    setForm(productToForm(product));
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingProduct(null);
    setError(null);
  }, []);

  const createProduct = useCallback(async () => {
    const snapshot = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: true }).products;
    const input: CreateProductInput = {
      workspaceId: PRODUCTS_WORKSPACE_ID,
      ...formToProductInput(form),
      createdBy: PRODUCTS_USER_ID
    };
    const result = productLocalService.createProduct(input);
    if (!result.validation.valid || !result.product) {
      setError(result.validation.issues[0]?.message ?? "Impossible de créer le produit.");
      return false;
    }

    try {
      await persistProductCatalogRecord("product", result.product);
    } catch (error) {
      productLocalService.replaceProducts(snapshot);
      setError(getProductPersistenceErrorMessage(error, "Le produit n'a pas pu être enregistré dans la base. Réessayez ou contactez l'administrateur."));
      notifyProductStoreUpdated();
      return false;
    }

    setDialogOpen(false);
    setVersion((value) => value + 1);
    notifyProductStoreUpdated();
    setPage(1);
    return true;
  }, [form]);

  const updateProduct = useCallback(async (product: Product) => {
    const snapshot = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: true }).products;
    if (product.flags.trackInventory && !form.trackInventory && hasInventoryHistory(product)) {
      setError("Ce produit a déjà un historique ou un solde de stock. Il ne peut pas être transformé en service non stocké.");
      return false;
    }
    const input: UpdateProductInput = {
      id: product.id,
      workspaceId: PRODUCTS_WORKSPACE_ID,
      ...formToProductInput(form),
      updatedBy: PRODUCTS_USER_ID
    };
    const result = productLocalService.updateProduct(input);
    if (!result.validation.valid || !result.product) {
      setError(result.validation.issues[0]?.message ?? "Impossible de modifier le produit.");
      return false;
    }

    try {
      await persistProductCatalogRecord("product", result.product);
    } catch (error) {
      productLocalService.replaceProducts(snapshot);
      setError(getProductPersistenceErrorMessage(error, "Les modifications n'ont pas pu être enregistrées dans la base. Réessayez ou contactez l'administrateur."));
      notifyProductStoreUpdated();
      return false;
    }

    setDialogOpen(false);
    setEditingProduct(null);
    setVersion((value) => value + 1);
    notifyProductStoreUpdated();
    return true;
  }, [form]);

  const saveProduct = useCallback(async () => {
    return editingProduct ? updateProduct(editingProduct) : createProduct();
  }, [createProduct, editingProduct, updateProduct]);

  const archiveProduct = useCallback(async (product: Product) => {
    const snapshot = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: true }).products;
    const result = productLocalService.archiveProduct(product.id, PRODUCTS_WORKSPACE_ID, PRODUCTS_USER_ID);
    if (!result.product) return;
    try {
      await persistProductCatalogRecord("product", result.product);
    } catch (error) {
      productLocalService.replaceProducts(snapshot);
      setError(getProductPersistenceErrorMessage(error, "Le produit n'a pas pu être archivé dans la base."));
      notifyProductStoreUpdated();
      return;
    }
    setVersion((value) => value + 1);
    notifyProductStoreUpdated();
  }, []);

  const restoreProduct = useCallback(async (product: Product) => {
    const snapshot = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: true }).products;
    const result = productLocalService.restoreProduct(product.id, PRODUCTS_WORKSPACE_ID, PRODUCTS_USER_ID);
    if (!result.product) return;
    try {
      await persistProductCatalogRecord("product", result.product);
    } catch (error) {
      productLocalService.replaceProducts(snapshot);
      setError(getProductPersistenceErrorMessage(error, "Le produit n'a pas pu être restauré dans la base."));
      notifyProductStoreUpdated();
      return;
    }
    setVersion((value) => value + 1);
    notifyProductStoreUpdated();
  }, []);

  return {
    archiveProduct,
    baseProducts,
    categories,
    categoryId,
    closeDialog,
    dialogOpen,
    editingProduct,
    error,
    filteredProducts: filteredRows.map((row) => row.product),
    filteredRows,
    form,
    loadError,
    loading,
    openCreateDialog,
    openEditDialog,
    page,
    pageSize,
    paginatedProducts,
    query,
    resetPage,
    restoreProduct,
    saveProduct,
    selectedIds,
    selectedProducts: baseProducts.filter((product) => selectedIds.includes(product.id)),
    setCategoryId,
    setForm,
    setPage,
    setPageSize,
    setQuery,
    setStatus,
    setStockStatus,
    setUnit,
    sort,
    stats,
    status,
    stockStatus,
    toggleAllVisible,
    toggleRow,
    totalFiltered: filteredRows.length,
    unit,
    updateSort
  };
}

function formToProductInput(form: ProductFormState) {
  return {
    sku: form.sku,
    barcode: form.barcode || undefined,
    name: form.name,
    description: form.description || undefined,
    shortDescription: form.shortDescription || undefined,
    categoryId: form.categoryId ? form.categoryId as ProductCategoryId : undefined,
    brand: form.brand || undefined,
    unit: form.unit,
    purchasePrice: form.purchasePrice,
    sellingPrice: form.sellingPrice,
    vatRate: form.vatRate,
    currency: form.currency,
    reorderPoint: form.reorderPoint.trim() ? parseInventoryQuantityInput(form.reorderPoint) : 0,
    image: form.image || undefined,
    notes: form.notes || undefined,
    flags: {
      trackInventory: form.trackInventory
    }
  };
}

function productToForm(product: Product): ProductFormState {
  return {
    sku: product.sku,
    barcode: product.barcode ?? "",
    name: product.name,
    description: product.description ?? "",
    shortDescription: product.shortDescription ?? "",
    categoryId: product.categoryId ?? "",
    brand: product.brand ?? "",
    unit: product.unit,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    vatRate: product.vatRate,
    currency: product.currency,
    reorderPoint: formatInventoryQuantityInput(product.reorderPoint),
    image: product.image ?? "",
    notes: product.notes ?? "",
    trackInventory: product.flags.trackInventory
  };
}

function hasInventoryHistory(product: Product) {
  const snapshot = inventoryLocalService.getSnapshot();
  return snapshot.balances.some((balance) => balance.productId === product.id)
    || snapshot.movements.some((movement) => movement.productId === product.id);
}

function getAveragePrice(products: readonly Product[]) {
  if (products.length === 0) return 0;
  return products.reduce((sum, product) => sum + product.sellingPrice, 0) / products.length;
}

function getProductPersistenceErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function sortOperationalRows(
  rows: readonly ProductOperationalRow[],
  sort: Readonly<{ field: ProductOperationalSortKey; direction: "asc" | "desc" }>
) {
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((first, second) => {
    const firstValue = operationalSortValue(first, sort.field);
    const secondValue = operationalSortValue(second, sort.field);
    if (typeof firstValue === "number" && typeof secondValue === "number") return (firstValue - secondValue) * direction;
    return String(firstValue).localeCompare(String(secondValue), "fr") * direction;
  });
}

function operationalSortValue(row: ProductOperationalRow, field: ProductOperationalSortKey) {
  if (field === "quantityOnHand") return row.stock.quantityOnHand;
  if (field === "quantityReserved") return row.stock.quantityReserved;
  if (field === "quantityAvailable") return row.stock.quantityAvailable;
  if (field === "reorderPoint") return row.stock.reorderPoint;
  if (field === "stockStatus") return row.stock.status;
  if (field === "sellingPrice" || field === "vatRate") return row.product[field];
  return row.product[field] ?? "";
}
