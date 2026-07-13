"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, PackageCheck } from "lucide-react";
import type { EntityPickerItem } from "@/ui/forms/entity-picker.types";
import { PRODUCTS_WORKSPACE_ID, type Product, type ProductId } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { inventoryLocalService, subscribeToInventoryStore } from "../../inventory-local-store";
import type { InventoryBalance, InventoryMovementType, StockMovement, Warehouse } from "../../inventory.types";

export type InventoryTab = "overview" | "stock" | "warehouses" | "movements";
export type InventoryOperationMode = "receipt" | "issue" | "transfer" | "adjustment";

export const INVENTORY_COMPANY_ID = "company-bosiaco" as import("../../inventory.types").InventoryCompanyId;

export type StockRow = Readonly<{
  id: string;
  balance: InventoryBalance;
  product?: Product;
  warehouse?: Warehouse;
  status: "low" | "out" | "ok";
}>;

export type MovementRow = Readonly<{
  movement: StockMovement;
  product?: Product;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
}>;

export function useInventoryWorkspace() {
  const [version, setVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<InventoryTab>("overview");
  const [stockQuery, setStockQuery] = useState("");
  const [stockWarehouseId, setStockWarehouseId] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [movementQuery, setMovementQuery] = useState("");
  const [movementWarehouseId, setMovementWarehouseId] = useState("all");
  const [movementType, setMovementType] = useState<InventoryMovementType | "all">("all");

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    const unsubscribeInventory = subscribeToInventoryStore(refresh);
    const unsubscribeProducts = subscribeToProductStore(refresh);
    return () => {
      unsubscribeInventory();
      unsubscribeProducts();
    };
  }, []);

  return useMemo(() => {
    const snapshot = inventoryLocalService.getSnapshot(INVENTORY_COMPANY_ID);
    const products = productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: false }).products;
    const productById = new Map(products.map((product) => [product.id, product]));
    const warehouseById = new Map(snapshot.warehouses.map((warehouse) => [warehouse.id, warehouse]));
    const activeWarehouses = snapshot.warehouses.filter((warehouse) => warehouse.active);
    const stockRows = snapshot.balances.map((balance) => {
      const status = getStockStatus(balance);
      return {
        id: `${balance.productId}:${balance.warehouseId}`,
        balance,
        product: productById.get(balance.productId),
        warehouse: warehouseById.get(balance.warehouseId),
        status
      } satisfies StockRow;
    });
    const filteredStockRows = stockRows.filter((row) => filterStockRow(row, stockQuery, stockWarehouseId, lowOnly));
    const movementRows = snapshot.movements.map((movement) => ({
      movement,
      product: productById.get(movement.productId),
      fromWarehouse: movement.fromWarehouseId ? warehouseById.get(movement.fromWarehouseId) : undefined,
      toWarehouse: movement.toWarehouseId ? warehouseById.get(movement.toWarehouseId) : undefined
    } satisfies MovementRow));
    const filteredMovementRows = movementRows.filter((row) => filterMovementRow(row, movementQuery, movementWarehouseId, movementType));
    const trackedProductIds = new Set(stockRows.map((row) => row.balance.productId));
    const productItems = products.map(productToPickerItem);

    return {
      activeTab,
      activeWarehouses,
      filteredMovementRows,
      filteredStockRows,
      kpis: {
        trackedProducts: trackedProductIds.size,
        quantityOnHand: sum(stockRows, (row) => row.balance.quantityOnHand),
        quantityReserved: sum(stockRows, (row) => row.balance.quantityReserved),
        quantityAvailable: sum(stockRows, (row) => row.balance.quantityAvailable),
        lowStock: stockRows.filter((row) => row.status === "low" || row.status === "out").length,
        activeWarehouses: activeWarehouses.length,
        recentMovements: snapshot.movements.slice(0, 5).length
      },
      lowOnly,
      movementQuery,
      movementType,
      movementWarehouseId,
      movements: snapshot.movements,
      productItems,
      products,
      setActiveTab,
      setLowOnly,
      setMovementQuery,
      setMovementType,
      setMovementWarehouseId,
      setStockQuery,
      setStockWarehouseId,
      stockQuery,
      stockRows,
      stockWarehouseId,
      version,
      warehouses: snapshot.warehouses,
      warehouseById
    };
  }, [activeTab, lowOnly, movementQuery, movementType, movementWarehouseId, stockQuery, stockWarehouseId, version]);
}

export function formatInventoryQuantity(value: number) {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value);
}

export function movementTypeLabel(type: InventoryMovementType) {
  const labels: Record<InventoryMovementType, string> = {
    ADJUSTMENT_IN: "Ajustement +",
    ADJUSTMENT_OUT: "Ajustement -",
    ISSUE: "Sortie",
    RECEIPT: "Réception",
    RELEASE: "Libération",
    RESERVATION: "Réservation",
    TRANSFER: "Transfert"
  };
  return labels[type];
}

function getStockStatus(balance: InventoryBalance): StockRow["status"] {
  if (balance.quantityAvailable <= 0) return "out";
  if (balance.reorderPoint > 0 && balance.quantityAvailable <= balance.reorderPoint) return "low";
  return "ok";
}

function filterStockRow(row: StockRow, query: string, warehouseId: string, lowOnly: boolean) {
  if (warehouseId !== "all" && row.balance.warehouseId !== warehouseId) return false;
  if (lowOnly && row.status === "ok") return false;
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [row.product?.name, row.product?.sku, row.product?.barcode, row.warehouse?.name, row.warehouse?.code]
    .filter(Boolean)
    .some((value) => normalizeSearch(value).includes(normalized));
}

function filterMovementRow(row: MovementRow, query: string, warehouseId: string, type: InventoryMovementType | "all") {
  if (type !== "all" && row.movement.type !== type) return false;
  if (warehouseId !== "all" && row.movement.fromWarehouseId !== warehouseId && row.movement.toWarehouseId !== warehouseId) return false;
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [row.product?.name, row.product?.sku, row.fromWarehouse?.name, row.toWarehouse?.name, row.movement.reference, row.movement.reason]
    .filter(Boolean)
    .some((value) => normalizeSearch(value).includes(normalized));
}

function productToPickerItem(product: Product): EntityPickerItem {
  return {
    id: product.id,
    title: product.name,
    type: "product",
    typeLabel: "Produit",
    metadata: `${product.sku} · ${product.unit}`,
    icon: product.flags.trackInventory ? Boxes : PackageCheck,
    keywords: [product.sku, product.barcode, product.name, product.brand, product.categoryName].filter(Boolean) as string[],
    relations: { productId: product.id as ProductId }
  };
}

function sum<T>(items: readonly T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
