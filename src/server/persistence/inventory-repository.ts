import "server-only";

import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import type { ProductId } from "@/modules/products";
import type { InventoryBalance, InventoryMovementId, InventorySnapshot, InventoryValuationEvent, InventoryValuationReportRow, InventoryWarehouseId, PostMovementInput, StockMovement, Warehouse } from "@/modules/inventory";
import { calculateQuantityAvailable, normalizeInventoryQuantity, normalizeWarehouseCode, roundQuantity } from "@/modules/inventory";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbWarehouse = Prisma.InventoryWarehouseGetPayload<Record<string, never>>;
type DbBalance = Prisma.InventoryBalanceGetPayload<Record<string, never>>;
type DbMovement = Prisma.InventoryStockMovementGetPayload<Record<string, never>>;
type DbValuationEvent = Prisma.InventoryValuationEventGetPayload<Record<string, never>>;
type DbGoodsReceiptForValuation = Prisma.ProcurementGoodsReceiptGetPayload<{
  include: { lines: true; purchaseOrder: { include: { lines: true } } };
}>;
type InventoryTx = Prisma.TransactionClient;
type ProductValuationReference = Readonly<{
  id: string;
  companyId: string;
  currency: string;
  purchasePrice: Prisma.Decimal;
  name: string;
  sku: string;
}>;
type InventoryValuationEventWrite = Readonly<{
  id: string;
  companyId: string;
  productId: string;
  warehouseId: string;
  movementId: string;
  eventType: "INBOUND" | "OUTBOUND";
  valuationMethod: "moving_average_v1";
  quantity: number;
  unitCost: number;
  totalValue: number;
  currency: string;
  sourceType: string;
  sourceId: string;
  occurredAt: Date;
  createdBy: string | null;
}>;

export async function loadInventorySnapshot(scope: PersistenceTenantScope): Promise<InventorySnapshot> {
  const [warehouses, balances, movements, valuationEvents] = await Promise.all([
    prisma.inventoryWarehouse.findMany({ where: { companyId: scope.companyId }, orderBy: [{ isDefault: "desc" }, { code: "asc" }] }),
    prisma.inventoryBalance.findMany({ where: { companyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.inventoryStockMovement.findMany({ where: { companyId: scope.companyId }, orderBy: { createdAt: "desc" } }),
    prisma.inventoryValuationEvent.findMany({ where: { companyId: scope.companyId }, orderBy: { occurredAt: "desc" } })
  ]);
  const valuationRows = buildValuationReportRows(valuationEvents.map(mapDbValuationEvent));

  return {
    warehouses: warehouses.map(mapDbWarehouse),
    balances: balances.map(mapDbBalance),
    movements: movements.map(mapDbMovement),
    valuationEvents: valuationEvents.map(mapDbValuationEvent),
    valuationRows
  };
}

export async function reconcileInventoryValuation(scope: PersistenceTenantScope): Promise<InventorySnapshot> {
  const [movements, existingEvents] = await Promise.all([
    prisma.inventoryStockMovement.findMany({
      where: { companyId: scope.companyId, status: "POSTED", type: { in: ["RECEIPT", "ISSUE", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"] } },
      orderBy: [{ postedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    }),
    prisma.inventoryValuationEvent.findMany({
      where: { companyId: scope.companyId },
      orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    })
  ]);
  const existingMovementIds = new Set(existingEvents.map((event) => event.movementId));
  const missingMovements = movements.filter((movement) => !existingMovementIds.has(movement.id));
  if (missingMovements.length === 0) return loadInventorySnapshot(scope);

  const productIds = [...new Set(missingMovements.map((movement) => movement.productId))];
  const goodsReceiptIds = [...new Set(missingMovements
    .filter((movement) => movement.referenceType === "GOODS_RECEIPT" && movement.referenceId)
    .map((movement) => movement.referenceId!))];
  const [products, goodsReceipts] = await Promise.all([
    prisma.product.findMany({
      where: { companyId: scope.companyId, id: { in: productIds } },
      select: { id: true, companyId: true, currency: true, purchasePrice: true, name: true, sku: true }
    }),
    prisma.procurementGoodsReceipt.findMany({
      where: { tenantCompanyId: scope.companyId, id: { in: goodsReceiptIds } },
      include: { lines: { orderBy: { position: "asc" } }, purchaseOrder: { include: { lines: { orderBy: { position: "asc" } } } } }
    })
  ]);

  const productById = new Map(products.map((product) => [product.id, product]));
  const goodsReceiptById = new Map(goodsReceipts.map((receipt) => [receipt.id, receipt]));
  const eventByMovement = new Map(existingEvents.map((event) => [event.movementId, mapDbValuationEvent(event)]));
  const state = new Map<string, { quantityMicros: bigint; totalMinor: bigint; currency: string }>();
  const plannedEvents: InventoryValuationEventWrite[] = [];

  for (const movement of movements) {
    const existing = eventByMovement.get(movement.id);
    if (existing) {
      applyValuationEventState(state, existing);
      continue;
    }

    const event = buildMissingValuationEventWrite(scope, movement, state, productById, goodsReceiptById);
    plannedEvents.push(event);
    const plannedDomainEvent = mapValuationWriteToEvent(event);
    eventByMovement.set(movement.id, plannedDomainEvent);
    applyValuationEventState(state, plannedDomainEvent);
  }

  if (plannedEvents.length > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.inventoryValuationEvent.createMany({ data: plannedEvents });
    });
  }
  return loadInventorySnapshot(scope);
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
  return prisma.$transaction((tx) => postInventoryMovementInTransaction(tx, scope, input));
}

export async function postInventoryMovementInTransaction(tx: InventoryTx, scope: PersistenceTenantScope, input: PostMovementInput) {
  const quantity = normalizeInventoryQuantity(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Saisissez une quantité supérieure à zéro.");

  await assertProductTenant(scope, input.productId, tx);
  await assertMovementNotPosted(scope, input.id, tx);
  if (input.fromWarehouseId) await assertWarehouseTenant(scope, input.fromWarehouseId, tx);
  if (input.toWarehouseId) await assertWarehouseTenant(scope, input.toWarehouseId, tx);

  if (input.type === "RECEIPT" || input.type === "ADJUSTMENT_IN") {
    await incrementOnHand(tx, scope, input.productId, input.toWarehouseId!, quantity);
  }
  if (input.type === "ISSUE" || input.type === "ADJUSTMENT_OUT") {
    await assertAvailable(tx, scope, input.productId, input.fromWarehouseId!, quantity);
    await incrementOnHand(tx, scope, input.productId, input.fromWarehouseId!, -quantity);
  }
  if (input.type === "TRANSFER") {
    await assertAvailable(tx, scope, input.productId, input.fromWarehouseId!, quantity);
    await incrementOnHand(tx, scope, input.productId, input.fromWarehouseId!, -quantity);
    await incrementOnHand(tx, scope, input.productId, input.toWarehouseId!, quantity);
  }
  if (input.type === "RESERVATION") {
    await assertAvailable(tx, scope, input.productId, input.toWarehouseId!, quantity);
    await incrementReserved(tx, scope, input.productId, input.toWarehouseId!, quantity);
  }
  if (input.type === "RELEASE") {
    await assertReserved(tx, scope, input.productId, input.fromWarehouseId!, quantity);
    await incrementReserved(tx, scope, input.productId, input.fromWarehouseId!, -quantity);
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
      quantity,
      reference: input.reference?.trim() || null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId?.trim() || null,
      reason: input.reason?.trim() || null,
      postedAt: now,
      createdBy: input.createdBy ?? scope.userId
    }
  });
  return mapDbMovement(movement);
}

export async function consumeInventoryReservationInTransaction(
  tx: InventoryTx,
  scope: PersistenceTenantScope,
  productId: ProductId,
  warehouseId: InventoryWarehouseId,
  requestedQuantity: number
) {
  const quantity = normalizeInventoryQuantity(requestedQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  const balance = await getOrCreateBalance(tx, scope, productId, warehouseId);
  const currentReserved = decimalToNumber(balance.quantityReserved);
  const consumed = Math.min(currentReserved, quantity);
  if (consumed <= 0) return 0;
  await updateBalance(tx, balance.id, decimalToNumber(balance.quantityOnHand), roundQuantity(currentReserved - consumed));
  return consumed;
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
  const product = await tx.product.findUnique({ where: { id: productId }, select: { companyId: true, active: true, trackInventory: true } });
  if (!product || product.companyId !== scope.companyId) throw new Error("Produit introuvable pour cette entreprise.");
  if (!product.active) throw new Error("Produit inactif.");
  if (!product.trackInventory) throw new Error("Produit non suivi en stock.");
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

function mapDbValuationEvent(row: DbValuationEvent): InventoryValuationEvent {
  return Object.freeze({
    id: row.id,
    companyId: row.companyId as InventoryValuationEvent["companyId"],
    productId: row.productId as InventoryValuationEvent["productId"],
    warehouseId: row.warehouseId as InventoryValuationEvent["warehouseId"] | undefined,
    movementId: row.movementId as InventoryValuationEvent["movementId"],
    eventType: row.eventType as InventoryValuationEvent["eventType"],
    valuationMethod: row.valuationMethod as InventoryValuationEvent["valuationMethod"],
    quantity: decimalToNumber(row.quantity),
    unitCost: decimalToNumber(row.unitCost),
    totalValue: decimalToNumber(row.totalValue),
    currency: row.currency,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    occurredAt: row.occurredAt.toISOString(),
    createdBy: row.createdBy as InventoryValuationEvent["createdBy"] | undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function buildMissingValuationEventWrite(
  scope: PersistenceTenantScope,
  movement: DbMovement,
  state: Map<string, { quantityMicros: bigint; totalMinor: bigint; currency: string }>,
  productById: ReadonlyMap<string, ProductValuationReference>,
  goodsReceiptById: ReadonlyMap<string, DbGoodsReceiptForValuation>
) {
  const quantity = normalizeInventoryQuantity(decimalToNumber(movement.quantity));
  if (quantity <= 0) throw new Error("Quantité de valorisation invalide.");
  const product = productById.get(movement.productId);
  if (!product || product.companyId !== scope.companyId) throw new Error("Produit de valorisation introuvable.");
  const warehouseId = movement.type === "ISSUE" || movement.type === "ADJUSTMENT_OUT" ? movement.fromWarehouseId : movement.toWarehouseId;
  if (!warehouseId) throw new Error("Entrepôt de valorisation manquant.");
  const occurredAt = movement.postedAt ?? movement.createdAt;
  const sourceType = getValuationSourceType(movement);
  const sourceId = movement.referenceId ?? movement.id;

  let totalMinor: bigint;
  if (movement.type === "RECEIPT" || movement.type === "ADJUSTMENT_IN") {
    totalMinor = resolveInboundCostMinor(scope, movement, quantity, product, goodsReceiptById);
  } else {
    totalMinor = consumeOutboundCostMinor(state, movement.productId, warehouseId, product.currency, quantity);
  }
  const unitCost = minorToMoney(roundDivide(totalMinor * BigInt(1_000_000), quantityToMicros(quantity)));
  const totalValue = minorToMoney(totalMinor);
  return Object.freeze({
    id: `inventory-valuation-${randomUUID()}`,
    companyId: scope.companyId,
    productId: movement.productId,
    warehouseId,
    movementId: movement.id,
    eventType: movement.type === "ISSUE" || movement.type === "ADJUSTMENT_OUT" ? "OUTBOUND" : "INBOUND",
    valuationMethod: "moving_average_v1",
    quantity,
    unitCost,
    totalValue,
    currency: product.currency,
    sourceType,
    sourceId,
    occurredAt,
    createdBy: movement.createdBy ?? scope.userId
  });
}

function resolveInboundCostMinor(
  scope: PersistenceTenantScope,
  movement: DbMovement,
  quantity: number,
  product: { purchasePrice: Prisma.Decimal; currency: string },
  goodsReceiptById: ReadonlyMap<string, DbGoodsReceiptForValuation>
) {
  if (movement.referenceType === "GOODS_RECEIPT" && movement.referenceId) {
    const receipt = goodsReceiptById.get(movement.referenceId);
    if (!receipt || receipt.tenantCompanyId !== scope.companyId) throw new Error("Réception fournisseur introuvable pour la valorisation.");
    const receiptLine = receipt.lines.find((line) => movement.id === `movement-${receipt.id}-${line.id}` || (line.productId === movement.productId && decimalToNumber(line.receivedQuantity) === quantity));
    if (!receiptLine) throw new Error("Ligne de réception introuvable pour la valorisation.");
    const purchaseLine = receipt.purchaseOrder.lines.find((line) => line.id === receiptLine.purchaseOrderLineId);
    if (!purchaseLine) throw new Error("Ligne de commande fournisseur introuvable pour la valorisation.");
    if (receipt.purchaseOrder.currency !== product.currency) throw new Error("Devise achat incompatible avec la devise produit.");
    const unitCostMinor = moneyNumberToMinor(decimalToNumber(purchaseLine.unitPrice) * (1 - decimalToNumber(purchaseLine.discountRate) / 100));
    if (unitCostMinor <= BigInt(0)) throw new Error("Coût d'achat manquant pour la valorisation.");
    return roundDivide(unitCostMinor * quantityToMicros(quantity), BigInt(1_000_000));
  }

  const unitCostMinor = moneyNumberToMinor(decimalToNumber(product.purchasePrice));
  if (unitCostMinor <= BigInt(0)) throw new Error("Coût produit manquant pour la valorisation d'entrée.");
  return roundDivide(unitCostMinor * quantityToMicros(quantity), BigInt(1_000_000));
}

function mapValuationWriteToEvent(event: InventoryValuationEventWrite): InventoryValuationEvent {
  const now = new Date().toISOString();
  return Object.freeze({
    id: event.id,
    companyId: event.companyId as InventoryValuationEvent["companyId"],
    productId: event.productId as InventoryValuationEvent["productId"],
    warehouseId: event.warehouseId as InventoryValuationEvent["warehouseId"],
    movementId: event.movementId as InventoryValuationEvent["movementId"],
    eventType: event.eventType,
    valuationMethod: event.valuationMethod,
    quantity: event.quantity,
    unitCost: event.unitCost,
    totalValue: event.totalValue,
    currency: event.currency,
    sourceType: event.sourceType,
    sourceId: event.sourceId,
    occurredAt: event.occurredAt.toISOString(),
    createdBy: event.createdBy as InventoryValuationEvent["createdBy"] | undefined,
    createdAt: now,
    updatedAt: now
  });
}

function consumeOutboundCostMinor(
  state: Map<string, { quantityMicros: bigint; totalMinor: bigint; currency: string }>,
  productId: string,
  warehouseId: string,
  currency: string,
  quantity: number
) {
  const key = valuationStateKey(productId, warehouseId, currency);
  const current = state.get(key);
  const quantityMicros = quantityToMicros(quantity);
  if (!current || current.currency !== currency || current.quantityMicros < quantityMicros || current.totalMinor <= BigInt(0)) {
    throw new Error("Quantité valorisée insuffisante pour comptabiliser le COGS.");
  }
  if (current.quantityMicros === quantityMicros) return current.totalMinor;
  return roundDivide(current.totalMinor * quantityMicros, current.quantityMicros);
}

function applyValuationEventState(state: Map<string, { quantityMicros: bigint; totalMinor: bigint; currency: string }>, event: InventoryValuationEvent) {
  if (!event.warehouseId) return;
  const key = valuationStateKey(event.productId, event.warehouseId, event.currency);
  const current = state.get(key) ?? { quantityMicros: BigInt(0), totalMinor: BigInt(0), currency: event.currency };
  const quantityMicros = quantityToMicros(event.quantity);
  const totalMinor = moneyNumberToMinor(event.totalValue);
  state.set(key, {
    quantityMicros: event.eventType === "INBOUND" ? current.quantityMicros + quantityMicros : current.quantityMicros - quantityMicros,
    totalMinor: event.eventType === "INBOUND" ? current.totalMinor + totalMinor : current.totalMinor - totalMinor,
    currency: event.currency
  });
}

function buildValuationReportRows(events: readonly InventoryValuationEvent[]): readonly InventoryValuationReportRow[] {
  const state = new Map<string, InventoryValuationReportRow>();
  const sorted = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
  for (const event of sorted) {
    if (!event.warehouseId) continue;
    const key = valuationStateKey(event.productId, event.warehouseId, event.currency);
    const current = state.get(key) ?? {
      id: key,
      companyId: event.companyId,
      productId: event.productId,
      warehouseId: event.warehouseId,
      quantity: 0,
      valuedQuantity: 0,
      averageUnitCost: 0,
      totalValue: 0,
      currency: event.currency
    };
    const direction = event.eventType === "INBOUND" ? 1 : -1;
    const quantity = roundQuantity(current.quantity + direction * event.quantity);
    const totalValue = roundMoney(current.totalValue + direction * event.totalValue);
    state.set(key, Object.freeze({
      ...current,
      quantity,
      valuedQuantity: quantity,
      averageUnitCost: quantity > 0 ? roundMoney(totalValue / quantity) : 0,
      totalValue,
      lastValuationAt: event.occurredAt
    }));
  }
  return Object.freeze([...state.values()]);
}

function getValuationSourceType(movement: DbMovement) {
  if (movement.referenceType === "GOODS_RECEIPT") return "inventory.goods-receipt";
  if (movement.referenceType === "DELIVERY_NOTE") return "inventory.delivery-note";
  if (movement.referenceType === "ADJUSTMENT") return "inventory.adjustment";
  return "inventory.movement";
}

function valuationStateKey(productId: string, warehouseId: string, currency: string) {
  return `${productId}:${warehouseId}:${currency}`;
}

function quantityToMicros(quantity: number) {
  return BigInt(Math.round(quantity * 1_000_000));
}

function moneyNumberToMinor(value: number) {
  return BigInt(Math.round(value * 100));
}

function minorToMoney(value: bigint) {
  return Number(value) / 100;
}

function roundDivide(numerator: bigint, denominator: bigint) {
  if (denominator <= BigInt(0)) throw new Error("Division de valorisation invalide.");
  return (numerator + denominator / BigInt(2)) / denominator;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}
