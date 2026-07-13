import "server-only";

import type { Prisma } from "@prisma/client";
import type { ProductId } from "@/modules/products";
import type { InventoryBalance, InventoryMovementId, InventorySnapshot, InventoryWarehouseId, PostMovementInput, StockMovement, Warehouse } from "@/modules/inventory";
import { calculateQuantityAvailable, normalizeWarehouseCode, roundQuantity } from "@/modules/inventory";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbWarehouse = Prisma.InventoryWarehouseGetPayload<Record<string, never>>;
type DbBalance = Prisma.InventoryBalanceGetPayload<Record<string, never>>;
type DbMovement = Prisma.InventoryStockMovementGetPayload<Record<string, never>>;
type InventoryTx = Prisma.TransactionClient;

export async function loadInventorySnapshot(scope: PersistenceTenantScope): Promise<InventorySnapshot> {
  const [warehouses, balances, movements] = await Promise.all([
    prisma.inventoryWarehouse.findMany({ where: { companyId: scope.companyId }, orderBy: [{ isDefault: "desc" }, { code: "asc" }] }),
    prisma.inventoryBalance.findMany({ where: { companyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.inventoryStockMovement.findMany({ where: { companyId: scope.companyId }, orderBy: { createdAt: "desc" } })
  ]);

  return {
    warehouses: warehouses.map(mapDbWarehouse),
    balances: balances.map(mapDbBalance),
    movements: movements.map(mapDbMovement)
  };
}

export async function createInventoryWarehouse(scope: PersistenceTenantScope, input: {
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}) {
  const code = normalizeWarehouseCode(input.code);
  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.inventoryWarehouse.findUnique({
      where: { companyId_code: { companyId: scope.companyId, code } },
      select: { id: true }
    });
    if (duplicate) throw new Error("Ce code entrepôt existe déjà.");

    if (input.isDefault) {
      const existingDefault = await tx.inventoryWarehouse.findFirst({
        where: { companyId: scope.companyId, isDefault: true, active: true },
        select: { id: true }
      });
      if (existingDefault) throw new Error("Un entrepôt par défaut existe déjà.");
    }

    const warehouse = await tx.inventoryWarehouse.create({
      data: {
        companyId: scope.companyId,
        code,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        isDefault: input.isDefault ?? false
      }
    });
    return mapDbWarehouse(warehouse);
  });
}

export async function archiveInventoryWarehouse(scope: PersistenceTenantScope, warehouseId: string) {
  await assertWarehouseTenant(scope, warehouseId);
  const warehouse = await prisma.inventoryWarehouse.update({
    where: { id: warehouseId },
    data: { active: false, isDefault: false }
  });
  return mapDbWarehouse(warehouse);
}

export async function updateInventoryWarehouse(scope: PersistenceTenantScope, warehouseId: string, input: {
  code?: string;
  name?: string;
  description?: string;
  active?: boolean;
  isDefault?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.inventoryWarehouse.findUnique({ where: { id: warehouseId } });
    if (!existing || existing.companyId !== scope.companyId) throw new Error("Entrepôt introuvable pour cette entreprise.");

    const code = input.code === undefined ? existing.code : normalizeWarehouseCode(input.code);
    if (!code) throw new Error("Le code entrepôt est obligatoire.");
    if (input.name !== undefined && !input.name.trim()) throw new Error("Le nom entrepôt est obligatoire.");

    if (code !== existing.code) {
      const duplicate = await tx.inventoryWarehouse.findUnique({
        where: { companyId_code: { companyId: scope.companyId, code } },
        select: { id: true }
      });
      if (duplicate) throw new Error("Ce code entrepôt existe déjà.");
    }

    const active = input.active ?? existing.active;
    const isDefault = active ? input.isDefault ?? existing.isDefault : false;
    if (isDefault) {
      await tx.inventoryWarehouse.updateMany({
        where: { companyId: scope.companyId, id: { not: warehouseId } },
        data: { isDefault: false }
      });
    }

    const warehouse = await tx.inventoryWarehouse.update({
      where: { id: warehouseId },
      data: {
        code,
        name: input.name?.trim() ?? existing.name,
        description: input.description === undefined ? existing.description : input.description.trim() || null,
        active,
        isDefault
      }
    });
    return mapDbWarehouse(warehouse);
  });
}

export async function postInventoryMovement(scope: PersistenceTenantScope, input: PostMovementInput) {
  return prisma.$transaction(async (tx) => {
    await assertProductTenant(scope, input.productId, tx);
    await assertMovementNotPosted(scope, input.id, tx);
    if (input.fromWarehouseId) await assertWarehouseTenant(scope, input.fromWarehouseId, tx);
    if (input.toWarehouseId) await assertWarehouseTenant(scope, input.toWarehouseId, tx);

    if (input.type === "RECEIPT" || input.type === "ADJUSTMENT_IN") {
      await incrementOnHand(tx, scope, input.productId, input.toWarehouseId!, input.quantity);
    }
    if (input.type === "ISSUE" || input.type === "ADJUSTMENT_OUT") {
      await assertAvailable(tx, scope, input.productId, input.fromWarehouseId!, input.quantity);
      await incrementOnHand(tx, scope, input.productId, input.fromWarehouseId!, -input.quantity);
    }
    if (input.type === "TRANSFER") {
      await assertAvailable(tx, scope, input.productId, input.fromWarehouseId!, input.quantity);
      await incrementOnHand(tx, scope, input.productId, input.fromWarehouseId!, -input.quantity);
      await incrementOnHand(tx, scope, input.productId, input.toWarehouseId!, input.quantity);
    }
    if (input.type === "RESERVATION") {
      await assertAvailable(tx, scope, input.productId, input.toWarehouseId!, input.quantity);
      await incrementReserved(tx, scope, input.productId, input.toWarehouseId!, input.quantity);
    }
    if (input.type === "RELEASE") {
      await assertReserved(tx, scope, input.productId, input.fromWarehouseId!, input.quantity);
      await incrementReserved(tx, scope, input.productId, input.fromWarehouseId!, -input.quantity);
    }

    const now = new Date();
    const movement = await tx.inventoryStockMovement.create({
      data: {
        id: input.id,
        companyId: scope.companyId,
        productId: input.productId,
        fromWarehouseId: input.fromWarehouseId ?? null,
        toWarehouseId: input.toWarehouseId ?? null,
        type: input.type,
        status: "POSTED",
        quantity: input.quantity,
        reference: input.reference?.trim() || null,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId?.trim() || null,
        reason: input.reason?.trim() || null,
        postedAt: now,
        createdBy: input.createdBy ?? scope.userId
      }
    });
    return mapDbMovement(movement);
  });
}

async function incrementOnHand(tx: InventoryTx, scope: PersistenceTenantScope, productId: ProductId, warehouseId: InventoryWarehouseId, delta: number) {
  const balance = await getOrCreateBalance(tx, scope, productId, warehouseId);
  const quantityOnHand = roundQuantity(decimalToNumber(balance.quantityOnHand) + delta);
  await updateBalance(tx, balance.id, quantityOnHand, decimalToNumber(balance.quantityReserved));
}

async function incrementReserved(tx: InventoryTx, scope: PersistenceTenantScope, productId: ProductId, warehouseId: InventoryWarehouseId, delta: number) {
  const balance = await getOrCreateBalance(tx, scope, productId, warehouseId);
  const quantityReserved = roundQuantity(decimalToNumber(balance.quantityReserved) + delta);
  await updateBalance(tx, balance.id, decimalToNumber(balance.quantityOnHand), quantityReserved);
}

async function getOrCreateBalance(tx: InventoryTx, scope: PersistenceTenantScope, productId: ProductId, warehouseId: InventoryWarehouseId) {
  const existing = await tx.inventoryBalance.findUnique({
    where: { companyId_productId_warehouseId: { companyId: scope.companyId, productId, warehouseId } }
  });
  if (existing) return existing;

  return tx.inventoryBalance.create({
    data: {
      companyId: scope.companyId,
      productId,
      warehouseId,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantityAvailable: 0,
      reorderPoint: 0
    }
  });
}

async function updateBalance(tx: InventoryTx, id: string, quantityOnHand: number, quantityReserved: number) {
  await tx.inventoryBalance.update({
    where: { id },
    data: {
      quantityOnHand,
      quantityReserved,
      quantityAvailable: calculateQuantityAvailable(quantityOnHand, quantityReserved),
      lastMovementDate: new Date()
    }
  });
}

async function assertAvailable(tx: InventoryTx, scope: PersistenceTenantScope, productId: ProductId, warehouseId: InventoryWarehouseId, quantity: number) {
  const balance = await getOrCreateBalance(tx, scope, productId, warehouseId);
  if (decimalToNumber(balance.quantityAvailable) < quantity) throw new Error("Stock disponible insuffisant.");
}

async function assertReserved(tx: InventoryTx, scope: PersistenceTenantScope, productId: ProductId, warehouseId: InventoryWarehouseId, quantity: number) {
  const balance = await getOrCreateBalance(tx, scope, productId, warehouseId);
  if (decimalToNumber(balance.quantityReserved) < quantity) throw new Error("Stock réservé insuffisant.");
}

async function assertProductTenant(scope: PersistenceTenantScope, productId: string, tx: InventoryTx = prisma) {
  const product = await tx.product.findUnique({ where: { id: productId }, select: { companyId: true } });
  if (!product || product.companyId !== scope.companyId) throw new Error("Produit introuvable pour cette entreprise.");
}

async function assertWarehouseTenant(scope: PersistenceTenantScope, warehouseId: string, tx: InventoryTx = prisma) {
  const warehouse = await tx.inventoryWarehouse.findUnique({ where: { id: warehouseId }, select: { companyId: true, active: true } });
  if (!warehouse || warehouse.companyId !== scope.companyId) throw new Error("Entrepôt introuvable pour cette entreprise.");
  if (!warehouse.active) throw new Error("Entrepôt inactif.");
}

async function assertMovementNotPosted(scope: PersistenceTenantScope, movementId: InventoryMovementId | undefined, tx: InventoryTx) {
  if (!movementId) return;
  const existing = await tx.inventoryStockMovement.findUnique({ where: { id: movementId }, select: { companyId: true, status: true } });
  if (!existing) return;
  if (existing.companyId !== scope.companyId) throw new Error("Mouvement introuvable pour cette entreprise.");
  if (existing.status === "POSTED") throw new Error("Ce mouvement a déjà été posté.");
}

function mapDbWarehouse(row: DbWarehouse): Warehouse {
  return {
    id: row.id,
    companyId: row.companyId,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    active: row.active,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as Warehouse;
}

function mapDbBalance(row: DbBalance): InventoryBalance {
  return {
    id: row.id,
    companyId: row.companyId,
    productId: row.productId,
    warehouseId: row.warehouseId,
    quantityOnHand: decimalToNumber(row.quantityOnHand),
    quantityReserved: decimalToNumber(row.quantityReserved),
    quantityAvailable: decimalToNumber(row.quantityAvailable),
    reorderPoint: decimalToNumber(row.reorderPoint),
    lastMovementDate: row.lastMovementDate?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as InventoryBalance;
}

function mapDbMovement(row: DbMovement): StockMovement {
  return {
    id: row.id,
    companyId: row.companyId,
    productId: row.productId,
    fromWarehouseId: row.fromWarehouseId ?? undefined,
    toWarehouseId: row.toWarehouseId ?? undefined,
    type: row.type,
    status: row.status,
    quantity: decimalToNumber(row.quantity),
    reference: row.reference ?? undefined,
    referenceType: row.referenceType ?? undefined,
    referenceId: row.referenceId ?? undefined,
    reason: row.reason ?? undefined,
    postedAt: row.postedAt?.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString(),
    createdBy: row.createdBy ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as StockMovement;
}

function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}
