"use client";

import { useCallback, useEffect, useState } from "react";
import { persistProductCatalogRecord } from "@/platform/persistence";
import { paginateCrmItems } from "@/modules/crm/shared";
import { inventoryLocalService } from "@/modules/inventory/inventory-local-store";
import { DEFAULT_PRODUCT_CURRENCY, DEFAULT_PRODUCT_UNIT, DEFAULT_PRODUCT_VAT_RATE, PRODUCTS_USER_ID, PRODUCTS_WORKSPACE_ID } from "../../product.constants";
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
  image: string;
  notes: string;
  trackInventory: boolean;
}>;

export type ProductSortKey = ProductSort["field"];

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sort, setSort] = useState<ProductSort>({ field: "updatedAt", direction: "desc" });
  const [selectedIds, setSelectedIds] = useState<readonly ProductId[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToProductStore(() => setVersion((value) => value + 1)), []);

  void version;
  const categories = productLocalService.listCategories(PRODUCTS_WORKSPACE_ID).categories;
  const baseProducts = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: true }).products;
  const filteredProducts = productLocalService.listProducts({
    workspaceId: PRODUCTS_WORKSPACE_ID,
    query,
    status,
    unit,
    categoryId,
    includeArchived: status !== "active"
  }, sort).products;
  const paginatedProducts = paginateCrmItems(filteredProducts, { page, pageSize });
  const stats = {
    total: baseProducts.filter((product) => product.status !== "archived").length,
    archived: baseProducts.filter((product) => product.status === "archived").length,
    categories: categories.filter((category) => category.active).length,
    averagePrice: getAveragePrice(baseProducts.filter((product) => product.status !== "archived"))
  };

  const resetPage = useCallback(() => setPage(1), []);

  const updateSort = useCallback((field: ProductSortKey) => {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
  }, []);

  const toggleRow = useCallback((id: ProductId) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }, []);

  const toggleAllVisible = useCallback(() => {
    const visibleIds = paginatedProducts.items.map((product) => product.id);
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
    } catch {
      productLocalService.replaceProducts(snapshot);
      setError("Le produit n'a pas pu être enregistré dans la base. Vérifiez la connexion puis réessayez.");
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
    } catch {
      productLocalService.replaceProducts(snapshot);
      setError("Les modifications n'ont pas pu être enregistrées dans la base. Vérifiez la connexion puis réessayez.");
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
    } catch {
      productLocalService.replaceProducts(snapshot);
      setError("Le produit n'a pas pu être archivé dans la base.");
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
    } catch {
      productLocalService.replaceProducts(snapshot);
      setError("Le produit n'a pas pu être restauré dans la base.");
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
    filteredProducts,
    form,
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
    setUnit,
    sort,
    stats,
    status,
    toggleAllVisible,
    toggleRow,
    totalFiltered: filteredProducts.length,
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
