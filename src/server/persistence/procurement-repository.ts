import "server-only";

import type { Prisma } from "@prisma/client";
import type { InventoryCompanyId, InventoryUserId } from "@/modules/inventory";
import type { GoodsReceipt, GoodsReceiptId, GoodsReceiptLine, ProcurementSupplier, ProcurementSupplierId, ProcurementUserId, PurchaseOrder, PurchaseOrderId, PurchaseOrderLine } from "@/modules/procurement";
import type { SupplierImportRequest, SupplierImportResult, SupplierImportValues } from "@/modules/procurement";
import { getPurchaseOrderReceiptState, validateSupplierImportRows } from "@/modules/procurement";
import { loadInventorySnapshot, postInventoryMovementInTransaction } from "./inventory-repository";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbSupplier = Prisma.ProcurementSupplierGetPayload<Record<string, never>>;
type DbPurchaseOrder = Prisma.ProcurementPurchaseOrderGetPayload<{ include: { lines: true } }>;
type DbGoodsReceipt = Prisma.ProcurementGoodsReceiptGetPayload<{ include: { lines: true } }>;

export type ProcurementSnapshot = Readonly<{
  suppliers: ProcurementSupplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
}>;

export type ProcurementPersistenceResource = "supplier" | "purchaseOrder" | "goodsReceipt";

export async function loadProcurementSnapshot(scope: PersistenceTenantScope): Promise<ProcurementSnapshot> {
  const [suppliers, purchaseOrders, goodsReceipts] = await Promise.all([
    prisma.procurementSupplier.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.procurementPurchaseOrder.findMany({
      where: { tenantCompanyId: scope.companyId },
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.procurementGoodsReceipt.findMany({
      where: { tenantCompanyId: scope.companyId },
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return {
    suppliers: suppliers.map(mapDbSupplier),
    purchaseOrders: purchaseOrders.map(mapDbPurchaseOrder),
    goodsReceipts: goodsReceipts.map(mapDbGoodsReceipt)
  };
}

export async function persistProcurementRecord(scope: PersistenceTenantScope, resource: ProcurementPersistenceResource, record: unknown) {
  if (resource === "supplier") return persistSupplier(scope, record as ProcurementSupplier);
  if (resource === "purchaseOrder") return persistPurchaseOrder(scope, record as PurchaseOrder);
  if (resource === "goodsReceipt") return persistGoodsReceipt(scope, record as GoodsReceipt);
  throw new Error("Ressource achats inconnue.");
}

export async function postGoodsReceipt(scope: PersistenceTenantScope, receipt: GoodsReceipt) {
  await assertSupplierTenant(scope, receipt.supplierId);
  await assertPurchaseOrderTenant(scope, receipt.purchaseOrderId);
  await assertWarehouseTenant(scope, receipt.warehouseId);

  const postedAt = new Date();
  await prisma.$transaction(async (tx) => {
    const existingPosted = await tx.procurementGoodsReceipt.findUnique({
      where: { id: receipt.id },
      select: { tenantCompanyId: true, status: true, postedAt: true }
    });
    assertTenantOwner(scope, existingPosted?.tenantCompanyId);
    if (existingPosted?.status === "posted" || existingPosted?.postedAt) throw new Error("Cette réception est déjà postée.");

    const order = await tx.procurementPurchaseOrder.findUnique({
      where: { id: receipt.purchaseOrderId },
      include: { lines: { orderBy: { position: "asc" } } }
    });
    if (!order || order.tenantCompanyId !== scope.companyId) throw new Error("Commande fournisseur introuvable.");

    const previousReceipts = (await tx.procurementGoodsReceipt.findMany({
      where: { tenantCompanyId: scope.companyId, purchaseOrderId: order.id, status: "posted", id: { not: receipt.id } },
      include: { lines: { orderBy: { position: "asc" } } }
    })).map(mapDbGoodsReceipt);
    const receiptState = getPurchaseOrderReceiptState(mapDbPurchaseOrder(order), previousReceipts);
    const remainingByLine = new Map(receiptState.lines.map((line) => [line.line.id, line.remainingQuantity]));

    const cleanLines = receipt.lines.filter((line) => line.receivedQuantity > 0);
    if (cleanLines.length === 0) throw new Error("Ajoutez au moins une quantité reçue.");
    for (const line of cleanLines) {
      const remaining = remainingByLine.get(line.purchaseOrderLineId) ?? 0;
      if (line.receivedQuantity <= 0) throw new Error("La quantité reçue doit être supérieure à zéro.");
      if (line.receivedQuantity > remaining) throw new Error("La quantité reçue dépasse le reliquat de la commande fournisseur.");
    }

    await tx.procurementGoodsReceipt.upsert({
      where: { id: receipt.id },
      update: { ...goodsReceiptWriteData({ ...receipt, status: "posted", postedAt: postedAt.toISOString() }), postedAt },
      create: { id: receipt.id, tenantCompanyId: scope.companyId, ...goodsReceiptWriteData({ ...receipt, status: "posted", postedAt: postedAt.toISOString() }), postedAt }
    });
    await tx.procurementGoodsReceiptLine.deleteMany({ where: { goodsReceiptId: receipt.id } });
    await tx.procurementGoodsReceiptLine.createMany({
      data: cleanLines.map((line, index) => goodsReceiptLineWriteData(receipt.id, line, index))
    });

    for (const line of cleanLines) {
      await postInventoryMovementInTransaction(tx, scope, {
        id: `movement-${receipt.id}-${line.id}` as never,
        companyId: scope.companyId as InventoryCompanyId,
        type: "RECEIPT",
        productId: line.productId,
        toWarehouseId: receipt.warehouseId as never,
        quantity: line.receivedQuantity,
        reference: `${receipt.number} · ${receipt.purchaseOrderNumber} · ${receipt.supplierName}`,
        referenceType: "GOODS_RECEIPT",
        referenceId: receipt.id,
        reason: `Réception fournisseur ${receipt.number}`,
        createdBy: (receipt.ownerId ?? scope.userId) as InventoryUserId
      });
    }

    const allReceipts = [...previousReceipts, { ...receipt, status: "posted", postedAt: postedAt.toISOString(), lines: cleanLines } as GoodsReceipt];
    const updatedState = getPurchaseOrderReceiptState(mapDbPurchaseOrder(order), allReceipts);
    await tx.procurementPurchaseOrder.update({
      where: { id: order.id },
      data: {
        status: updatedState.fullyReceived ? "received" : "partially_received",
        updatedAt: postedAt
      }
    });
  });

  return {
    procurementSnapshot: await loadProcurementSnapshot(scope),
    inventorySnapshot: await loadInventorySnapshot(scope)
  };
}

export async function applySupplierImport(scope: PersistenceTenantScope, request: SupplierImportRequest): Promise<SupplierImportResult> {
  const snapshot = await loadProcurementSnapshot(scope);
  const preview = validateSupplierImportRows(request.rows, request.mapping, {
    existingSuppliers: snapshot.suppliers,
    duplicatePolicy: request.duplicatePolicy
  });

  if (preview.invalidRows > 0) {
    return {
      importedCount: 0,
      updatedCount: 0,
      ignoredCount: preview.ignoredRows,
      failedCount: preview.invalidRows,
      preview,
      suppliers: snapshot.suppliers
    };
  }

  const rowsToCreate = preview.rows.filter((row) => row.action === "create");
  const rowsToUpdate = preview.rows.filter((row) => row.action === "update" && row.existingRecordId);

  await prisma.$transaction(async (tx) => {
    for (const row of rowsToCreate) {
      const id = `supplier-${Date.now()}-${row.rowNumber}`;
      await tx.procurementSupplier.create({
        data: {
          id,
          tenantCompanyId: scope.companyId,
          ...supplierImportWriteData(row.values)
        }
      });
    }
    for (const row of rowsToUpdate) {
      await tx.procurementSupplier.update({
        where: { id: row.existingRecordId! },
        data: supplierImportWriteData(row.values)
      });
    }
  });

  const updatedSnapshot = await loadProcurementSnapshot(scope);
  return {
    importedCount: rowsToCreate.length,
    updatedCount: rowsToUpdate.length,
    ignoredCount: preview.ignoredRows,
    failedCount: 0,
    preview,
    suppliers: updatedSnapshot.suppliers
  };
}

async function persistSupplier(scope: PersistenceTenantScope, supplier: ProcurementSupplier) {
  await assertSupplierTenant(scope, supplier.id);
  await prisma.procurementSupplier.upsert({
    where: { id: supplier.id },
    update: supplierWriteData(supplier),
    create: { id: supplier.id, tenantCompanyId: scope.companyId, ...supplierWriteData(supplier) }
  });
  return supplier;
}

async function persistPurchaseOrder(scope: PersistenceTenantScope, order: PurchaseOrder) {
  await assertPurchaseOrderTenant(scope, order.id);
  await assertSupplierTenant(scope, order.supplierId);

  await prisma.$transaction(async (tx) => {
    await tx.procurementPurchaseOrder.upsert({
      where: { id: order.id },
      update: purchaseOrderWriteData(order),
      create: { id: order.id, tenantCompanyId: scope.companyId, ...purchaseOrderWriteData(order) }
    });
    await tx.procurementPurchaseOrderLine.deleteMany({ where: { purchaseOrderId: order.id } });
    await tx.procurementPurchaseOrderLine.createMany({
      data: order.lines.map((line, index) => purchaseOrderLineWriteData(order.id, line, index))
    });
  });

  return order;
}

async function persistGoodsReceipt(scope: PersistenceTenantScope, receipt: GoodsReceipt) {
  await assertSupplierTenant(scope, receipt.supplierId);
  await assertPurchaseOrderTenant(scope, receipt.purchaseOrderId);
  await assertWarehouseTenant(scope, receipt.warehouseId);

  await prisma.$transaction(async (tx) => {
    await tx.procurementGoodsReceipt.upsert({
      where: { id: receipt.id },
      update: goodsReceiptWriteData(receipt),
      create: { id: receipt.id, tenantCompanyId: scope.companyId, ...goodsReceiptWriteData(receipt) }
    });
    await tx.procurementGoodsReceiptLine.deleteMany({ where: { goodsReceiptId: receipt.id } });
    await tx.procurementGoodsReceiptLine.createMany({
      data: receipt.lines.map((line, index) => goodsReceiptLineWriteData(receipt.id, line, index))
    });
  });

  return receipt;
}

async function assertSupplierTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.procurementSupplier.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertPurchaseOrderTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.procurementPurchaseOrder.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertWarehouseTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.inventoryWarehouse.findUnique({ where: { id }, select: { companyId: true, active: true } });
  if (!existing || existing.companyId !== scope.companyId) throw new Error("Entrepôt introuvable pour cette entreprise.");
  if (!existing.active) throw new Error("Entrepôt inactif.");
}

function assertTenantOwner(scope: PersistenceTenantScope, tenantCompanyId?: string) {
  if (tenantCompanyId && tenantCompanyId !== scope.companyId) {
    throw new Error("Accès refusé: cet enregistrement achats appartient à une autre entreprise.");
  }
}

function supplierWriteData(supplier: ProcurementSupplier) {
  return {
    workspaceId: supplier.workspaceId,
    companyName: supplier.companyName,
    tradeName: supplier.tradeName ?? null,
    ice: supplier.ice ?? null,
    taxId: supplier.taxId ?? null,
    rc: supplier.rc ?? null,
    vat: supplier.vat ?? null,
    phone: supplier.phone ?? null,
    email: supplier.email ?? null,
    address: supplier.address ?? null,
    country: supplier.country,
    currency: supplier.currency,
    paymentTerms: supplier.paymentTerms ?? null,
    notes: supplier.notes ?? null,
    status: supplier.status,
    active: supplier.active,
    archivedAt: parseOptionalDate(supplier.archivedAt),
    createdAt: parseDate(supplier.createdAt),
    updatedAt: parseDate(supplier.updatedAt)
  };
}

function supplierImportWriteData(values: SupplierImportValues) {
  const now = new Date();
  return {
    workspaceId: "procurement-main",
    companyName: String(values.companyName),
    tradeName: optionalString(values.tradeName),
    ice: optionalString(values.ice),
    taxId: optionalString(values.taxId),
    rc: optionalString(values.rc),
    vat: optionalString(values.vat),
    phone: optionalString(values.phone),
    email: optionalString(values.email),
    address: optionalString(values.address),
    country: String(values.country),
    currency: String(values.currency),
    paymentTerms: optionalString(values.paymentTerms),
    notes: optionalString(values.notes),
    status: values.active ? "active" : "archived",
    active: Boolean(values.active),
    archivedAt: values.active ? null : now,
    createdAt: now,
    updatedAt: now
  };
}

function purchaseOrderWriteData(order: PurchaseOrder) {
  return {
    workspaceId: order.workspaceId,
    number: order.number,
    supplierId: order.supplierId,
    supplierName: order.supplierName,
    status: order.status,
    issueDate: parseDate(order.issueDate),
    expectedDate: parseOptionalDate(order.expectedDate),
    currency: order.currency,
    reference: order.reference ?? null,
    notes: order.notes ?? null,
    discountRate: order.discountRate,
    archivedAt: parseOptionalDate(order.archivedAt),
    ownerId: order.ownerId ?? null,
    createdAt: parseDate(order.createdAt),
    updatedAt: parseDate(order.updatedAt)
  };
}

function purchaseOrderLineWriteData(purchaseOrderId: string, line: PurchaseOrderLine, position: number) {
  return {
    id: line.id,
    purchaseOrderId,
    productId: line.productId ?? null,
    productSku: line.productSku ?? null,
    productName: line.productName ?? null,
    description: line.description,
    quantity: line.quantity,
    unit: String(line.unit),
    unitPrice: line.unitPrice,
    discountRate: line.discountRate,
    taxRate: line.taxRate,
    position
  };
}

function goodsReceiptWriteData(receipt: GoodsReceipt) {
  return {
    workspaceId: receipt.workspaceId,
    number: receipt.number,
    supplierId: receipt.supplierId,
    supplierName: receipt.supplierName,
    purchaseOrderId: receipt.purchaseOrderId,
    purchaseOrderNumber: receipt.purchaseOrderNumber,
    warehouseId: receipt.warehouseId,
    warehouseName: receipt.warehouseName ?? null,
    receiptDate: parseDate(receipt.receiptDate),
    status: receipt.status,
    reference: receipt.reference ?? null,
    notes: receipt.notes ?? null,
    postedAt: parseOptionalDate(receipt.postedAt),
    archivedAt: parseOptionalDate(receipt.archivedAt),
    ownerId: receipt.ownerId ?? null,
    createdAt: parseDate(receipt.createdAt),
    updatedAt: parseDate(receipt.updatedAt)
  };
}

function goodsReceiptLineWriteData(goodsReceiptId: string, line: GoodsReceiptLine, position: number) {
  return {
    id: line.id,
    goodsReceiptId,
    purchaseOrderLineId: line.purchaseOrderLineId,
    productId: line.productId,
    productSku: line.productSku ?? null,
    productName: line.productName ?? null,
    description: line.description,
    orderedQuantity: line.orderedQuantity,
    previouslyReceivedQuantity: line.previouslyReceivedQuantity,
    receivedQuantity: line.receivedQuantity,
    unit: String(line.unit),
    position
  };
}

function mapDbSupplier(row: DbSupplier): ProcurementSupplier {
  return {
    id: row.id as ProcurementSupplierId,
    workspaceId: row.workspaceId as ProcurementSupplier["workspaceId"],
    companyName: row.companyName,
    tradeName: row.tradeName ?? undefined,
    ice: row.ice ?? undefined,
    taxId: row.taxId ?? undefined,
    rc: row.rc ?? undefined,
    vat: row.vat ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    country: row.country,
    currency: row.currency,
    paymentTerms: row.paymentTerms ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status === "archived" ? "archived" : "active",
    active: row.active,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapDbPurchaseOrder(row: DbPurchaseOrder): PurchaseOrder {
  return {
    id: row.id as PurchaseOrderId,
    workspaceId: row.workspaceId as PurchaseOrder["workspaceId"],
    number: row.number,
    supplierId: row.supplierId as PurchaseOrder["supplierId"],
    supplierName: row.supplierName,
    status: row.status as PurchaseOrder["status"],
    issueDate: row.issueDate.toISOString(),
    expectedDate: row.expectedDate?.toISOString(),
    currency: row.currency,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
    lines: row.lines.map((line) => ({
      id: line.id as PurchaseOrderLine["id"],
      productId: line.productId as PurchaseOrderLine["productId"] | undefined,
      productSku: line.productSku ?? undefined,
      productName: line.productName ?? undefined,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      discountRate: line.discountRate,
      taxRate: line.taxRate
    })),
    discountRate: row.discountRate,
    ownerId: row.ownerId as PurchaseOrder["ownerId"] | undefined,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapDbGoodsReceipt(row: DbGoodsReceipt): GoodsReceipt {
  return {
    id: row.id as GoodsReceiptId,
    workspaceId: row.workspaceId as GoodsReceipt["workspaceId"],
    number: row.number,
    supplierId: row.supplierId as GoodsReceipt["supplierId"],
    supplierName: row.supplierName,
    purchaseOrderId: row.purchaseOrderId as GoodsReceipt["purchaseOrderId"],
    purchaseOrderNumber: row.purchaseOrderNumber,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouseName ?? undefined,
    receiptDate: row.receiptDate.toISOString(),
    status: row.status as GoodsReceipt["status"],
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
    postedAt: row.postedAt?.toISOString(),
    archivedAt: row.archivedAt?.toISOString(),
    ownerId: row.ownerId as ProcurementUserId | undefined,
    lines: row.lines.map((line) => ({
      id: line.id as GoodsReceiptLine["id"],
      purchaseOrderLineId: line.purchaseOrderLineId as GoodsReceiptLine["purchaseOrderLineId"],
      productId: line.productId as GoodsReceiptLine["productId"],
      productSku: line.productSku ?? undefined,
      productName: line.productName ?? undefined,
      description: line.description,
      orderedQuantity: line.orderedQuantity,
      previouslyReceivedQuantity: line.previouslyReceivedQuantity,
      receivedQuantity: line.receivedQuantity,
      unit: line.unit
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function parseOptionalDate(value: string | undefined) {
  return value ? parseDate(value) : null;
}

function optionalString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}
