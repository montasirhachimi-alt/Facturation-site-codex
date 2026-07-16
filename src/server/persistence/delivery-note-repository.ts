import "server-only";

import type { Prisma } from "@prisma/client";
import type { InventoryCompanyId, InventoryUserId, InventoryWarehouseId } from "@/modules/inventory";
import type { ProductId } from "@/modules/products";
import {
  DELIVERY_NOTES_WORKSPACE_ID,
  formatDeliveryNoteNumber,
  type DeliveryNote,
  type DeliveryNoteId,
  type DeliveryNoteLine
} from "@/modules/sales/delivery-notes";
import { parseDeliveryNoteQuantity } from "@/modules/sales/delivery-notes/delivery-note.utils";
import { normalizeInventoryQuantity } from "@/modules/inventory/inventory.utils";
import { getSalesOrderReservationStatus, type SalesOrderLine } from "@/modules/sales/orders";
import { consumeInventoryReservationInTransaction, loadInventorySnapshot, postInventoryMovementInTransaction } from "./inventory-repository";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbDeliveryNote = Prisma.SalesDeliveryNoteGetPayload<{ include: { lines: { orderBy: { position: "asc" } } } }>;
type DbDeliveryNoteLine = Prisma.SalesDeliveryNoteLineGetPayload<Record<string, never>>;

export type DeliveryNotePersistenceSnapshot = Readonly<{ deliveryNotes: DeliveryNote[] }>;

export async function loadDeliveryNoteSnapshot(scope: PersistenceTenantScope): Promise<DeliveryNotePersistenceSnapshot> {
  const deliveryNotes = await prisma.salesDeliveryNote.findMany({
    where: { tenantCompanyId: scope.companyId },
    include: { lines: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" }
  });
  return { deliveryNotes: deliveryNotes.map(mapDbDeliveryNote) };
}

export async function persistDeliveryNoteDraft(scope: PersistenceTenantScope, note: DeliveryNote) {
  const normalizedNote = normalizeDeliveryNoteDraft(note);
  if (normalizedNote.workspaceId !== DELIVERY_NOTES_WORKSPACE_ID) throw new Error("Le bon de livraison doit appartenir à l'espace Bons de livraison.");
  return prisma.$transaction(async (tx) => {
    const existing = await tx.salesDeliveryNote.findUnique({ where: { id: normalizedNote.id }, select: { tenantCompanyId: true, number: true, status: true } });
    if (existing?.tenantCompanyId && existing.tenantCompanyId !== scope.companyId) throw new Error("Accès refusé: ce bon de livraison appartient à une autre entreprise.");
    if (existing && existing.status !== "draft") throw new Error("Seul un bon de livraison brouillon peut être modifié.");

    const context = await validateDeliveryNoteContext(tx, scope, normalizedNote);
    const number = existing?.number ?? formatDeliveryNoteNumber(await tx.salesDeliveryNote.count({ where: { tenantCompanyId: scope.companyId } }) + 1);
    const data = deliveryNoteWriteData(normalizedNote, number, context.warehouse.name);
    await tx.salesDeliveryNote.upsert({
      where: { id: normalizedNote.id },
      update: data,
      create: { id: normalizedNote.id, tenantCompanyId: scope.companyId, ...data }
    });
    await tx.salesDeliveryNoteLine.deleteMany({ where: { deliveryNoteId: normalizedNote.id } });
    await tx.salesDeliveryNoteLine.createMany({
      data: normalizedNote.lines.map((line, position) => deliveryNoteLineWriteData(normalizedNote.id, line, position))
    });
    return loadDeliveryNoteInTransaction(tx, scope, normalizedNote.id);
  });
}

export async function postDeliveryNote(scope: PersistenceTenantScope, deliveryNoteId: string) {
  await prisma.$transaction(async (tx) => {
    const note = await tx.salesDeliveryNote.findUnique({
      where: { id: deliveryNoteId },
      include: { lines: { orderBy: { position: "asc" } }, salesOrder: { include: { lines: { orderBy: { position: "asc" } } } } }
    });
    if (!note || note.tenantCompanyId !== scope.companyId) throw new Error("Bon de livraison introuvable.");
    if (note.status !== "draft" || note.postedAt) throw new Error("Ce bon de livraison est déjà posté.");
    if (note.salesOrder.tenantCompanyId !== scope.companyId) throw new Error("Commande client introuvable pour cette entreprise.");
    if (["cancelled", "archived", "delivered"].includes(note.salesOrder.status)) throw new Error("Cette commande client ne peut pas être livrée.");
    const warehouse = await tx.inventoryWarehouse.findUnique({ where: { id: note.warehouseId }, select: { id: true, name: true, companyId: true, active: true } });
    if (!warehouse || warehouse.companyId !== scope.companyId) throw new Error("Entrepôt introuvable pour cette entreprise.");
    if (!warehouse.active) throw new Error("Entrepôt inactif.");

    const orderLines = new Map(note.salesOrder.lines.map((line) => [line.id, line]));
    for (const line of note.lines) {
      const orderLine = orderLines.get(line.salesOrderLineId);
      if (!orderLine || orderLine.salesOrderId !== note.salesOrderId) throw new Error("Ligne de commande client invalide.");
      if (!orderLine.productId || orderLine.productId !== line.productId) throw new Error("Référence Produit invalide pour cette livraison.");
      const quantity = requirePositiveDeliveryQuantity(line.quantityToDeliver);
      const remaining = normalizeInventoryQuantity(Math.max(0, orderLine.quantityOrdered - orderLine.quantityDelivered));
      if (quantity > remaining) throw new Error("La quantité dépasse le reliquat à livrer.");
      if (decimalToNumber(line.quantityPosted) > 0) throw new Error("Cette ligne a déjà été postée.");

      const product = await tx.product.findUnique({ where: { id: line.productId }, select: { companyId: true, active: true, trackInventory: true } });
      if (!product || product.companyId !== scope.companyId) throw new Error("Produit introuvable pour cette entreprise.");
      if (!product.active) throw new Error("Produit inactif.");
      if (!product.trackInventory) throw new Error("Ce produit n'est pas suivi en stock.");
      if (orderLine.quantityReserved > 0 && orderLine.warehouseId && orderLine.warehouseId !== note.warehouseId) {
        throw new Error("La livraison doit utiliser l'entrepôt de la réservation existante.");
      }

      const reservationConsumed = await consumeInventoryReservationInTransaction(
        tx,
        scope,
        line.productId as ProductId,
        note.warehouseId as InventoryWarehouseId,
        Math.min(quantity, orderLine.quantityReserved)
      );
      await postInventoryMovementInTransaction(tx, scope, {
        id: `movement-${note.id}-${line.id}-issue` as never,
        companyId: scope.companyId as InventoryCompanyId,
        productId: line.productId as ProductId,
        fromWarehouseId: note.warehouseId as InventoryWarehouseId,
        type: "ISSUE",
        quantity,
        reference: `${note.number} · ${note.salesOrderNumber} · ${note.companyName}`,
        referenceType: "DELIVERY_NOTE",
        referenceId: note.id,
        reason: `Livraison client ${note.number}`,
        createdBy: scope.userId as unknown as InventoryUserId
      });
      await tx.salesOrderLine.update({
        where: { id: orderLine.id },
        data: {
          quantityDelivered: normalizeInventoryQuantity(orderLine.quantityDelivered + quantity),
          quantityReserved: normalizeInventoryQuantity(Math.max(0, orderLine.quantityReserved - reservationConsumed))
        }
      });
      await tx.salesDeliveryNoteLine.update({ where: { id: line.id }, data: { quantityPosted: quantity } });
    }

    const updatedLines = await tx.salesOrderLine.findMany({ where: { salesOrderId: note.salesOrderId }, orderBy: { position: "asc" } });
    const domainLines = updatedLines.map(mapDbSalesOrderLine);
    const allDelivered = domainLines.every((line) => line.quantityDelivered >= line.quantityOrdered);
    const anyDelivered = domainLines.some((line) => line.quantityDelivered > 0);
    await tx.salesOrder.update({
      where: { id: note.salesOrderId },
      data: {
        status: allDelivered ? "delivered" : anyDelivered ? "partially_delivered" : note.salesOrder.status,
        reservationStatus: getSalesOrderReservationStatus(domainLines),
        updatedAt: new Date()
      }
    });
    await tx.salesDeliveryNote.update({
      where: { id: note.id },
      data: { status: "posted", postedAt: new Date(), postedBy: scope.userId, updatedAt: new Date() }
    });
  }, { isolationLevel: "Serializable" });

  return {
    deliveryNoteSnapshot: await loadDeliveryNoteSnapshot(scope),
    inventorySnapshot: await loadInventorySnapshot(scope)
  };
}

export async function archiveDeliveryNote(scope: PersistenceTenantScope, deliveryNoteId: string) {
  const existing = await prisma.salesDeliveryNote.findUnique({ where: { id: deliveryNoteId }, select: { tenantCompanyId: true, status: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Bon de livraison introuvable.");
  if (existing.status === "draft") throw new Error("Postez le bon de livraison avant de l'archiver.");
  await prisma.salesDeliveryNote.update({ where: { id: deliveryNoteId }, data: { status: "archived", archivedAt: new Date() } });
  return loadDeliveryNoteSnapshot(scope);
}

async function validateDeliveryNoteContext(tx: Prisma.TransactionClient, scope: PersistenceTenantScope, note: DeliveryNote) {
  const order = await tx.salesOrder.findUnique({ where: { id: note.salesOrderId }, include: { lines: true } });
  if (!order || order.tenantCompanyId !== scope.companyId) throw new Error("Commande client introuvable pour cette entreprise.");
  if (!["confirmed", "partially_reserved", "reserved", "partially_delivered"].includes(order.status)) throw new Error("Confirmez la commande avant de créer un bon de livraison.");
  if (order.crmCompanyId !== note.companyId) throw new Error("La société du bon de livraison ne correspond pas à la commande.");
  if (note.contactId && note.contactId !== order.crmContactId) throw new Error("Le contact du bon de livraison ne correspond pas à la commande.");
  const warehouse = await tx.inventoryWarehouse.findUnique({ where: { id: note.warehouseId }, select: { id: true, name: true, companyId: true, active: true } });
  if (!warehouse || warehouse.companyId !== scope.companyId) throw new Error("Entrepôt introuvable pour cette entreprise.");
  if (!warehouse.active) throw new Error("Entrepôt inactif.");
  if (note.lines.length === 0) throw new Error("Ajoutez au moins une quantité à livrer.");

  const orderLines = new Map(order.lines.map((line) => [line.id, line]));
  for (const line of note.lines) {
    const orderLine = orderLines.get(line.salesOrderLineId);
    if (!orderLine || orderLine.productId !== line.productId) throw new Error("Ligne de commande client invalide.");
    const quantity = requirePositiveDeliveryQuantity(line.quantityToDeliver);
    const remaining = normalizeInventoryQuantity(Math.max(0, orderLine.quantityOrdered - orderLine.quantityDelivered));
    if (quantity > remaining) throw new Error("La quantité dépasse le reliquat à livrer.");
    const product = await tx.product.findUnique({ where: { id: line.productId }, select: { companyId: true, active: true, trackInventory: true } });
    if (!product || product.companyId !== scope.companyId) throw new Error("Produit introuvable pour cette entreprise.");
    if (!product.active) throw new Error("Produit inactif.");
    if (!product.trackInventory) throw new Error("Ce produit n'est pas suivi en stock.");
  }
  return { order, warehouse };
}

async function loadDeliveryNoteInTransaction(tx: Prisma.TransactionClient, scope: PersistenceTenantScope, id: string) {
  const note = await tx.salesDeliveryNote.findUnique({ where: { id }, include: { lines: { orderBy: { position: "asc" } } } });
  if (!note || note.tenantCompanyId !== scope.companyId) throw new Error("Bon de livraison introuvable.");
  return mapDbDeliveryNote(note);
}

function deliveryNoteWriteData(note: DeliveryNote, number: string, warehouseName: string) {
  return {
    workspaceId: note.workspaceId,
    number,
    crmCompanyId: note.companyId,
    companyName: note.companyName,
    crmContactId: note.contactId ?? null,
    contactName: note.contactName ?? null,
    salesOrderId: note.salesOrderId,
    salesOrderNumber: note.salesOrderNumber,
    warehouseId: note.warehouseId,
    warehouseName,
    deliveryDate: parseDate(note.deliveryDate),
    status: "draft",
    notes: note.notes?.trim() || null,
    customerReference: note.customerReference?.trim() || null,
    postedAt: null,
    postedBy: null,
    archivedAt: null,
    createdAt: parseDate(note.createdAt),
    updatedAt: new Date()
  };
}

function deliveryNoteLineWriteData(deliveryNoteId: string, line: DeliveryNoteLine, position: number) {
  return {
    id: line.id,
    deliveryNoteId,
    salesOrderLineId: line.salesOrderLineId,
    productId: line.productId,
    productSku: line.productSku ?? null,
    productName: line.productName ?? null,
    description: line.description,
    unit: line.unit,
    quantityToDeliver: requirePositiveDeliveryQuantity(line.quantityToDeliver),
    quantityPosted: 0,
    position
  };
}

function mapDbDeliveryNote(row: DbDeliveryNote): DeliveryNote {
  return {
    id: row.id as DeliveryNoteId,
    workspaceId: row.workspaceId as DeliveryNote["workspaceId"],
    number: row.number,
    companyId: row.crmCompanyId as DeliveryNote["companyId"],
    companyName: row.companyName,
    contactId: row.crmContactId as DeliveryNote["contactId"],
    contactName: row.contactName ?? undefined,
    salesOrderId: row.salesOrderId as DeliveryNote["salesOrderId"],
    salesOrderNumber: row.salesOrderNumber,
    warehouseId: row.warehouseId as DeliveryNote["warehouseId"],
    warehouseName: row.warehouseName,
    deliveryDate: row.deliveryDate.toISOString(),
    status: row.status as DeliveryNote["status"],
    notes: row.notes ?? undefined,
    customerReference: row.customerReference ?? undefined,
    postedAt: row.postedAt?.toISOString(),
    postedBy: row.postedBy as DeliveryNote["postedBy"],
    archivedAt: row.archivedAt?.toISOString(),
    lines: row.lines.map(mapDbDeliveryNoteLine),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapDbDeliveryNoteLine(row: DbDeliveryNoteLine): DeliveryNoteLine {
  return {
    id: row.id,
    salesOrderLineId: row.salesOrderLineId,
    productId: row.productId as ProductId,
    productSku: row.productSku ?? undefined,
    productName: row.productName ?? undefined,
    description: row.description,
    unit: row.unit,
    quantityToDeliver: parseDeliveryNoteQuantity(row.quantityToDeliver),
    quantityPosted: parseDeliveryNoteQuantity(row.quantityPosted)
  };
}

function mapDbSalesOrderLine(row: Prisma.SalesOrderLineGetPayload<Record<string, never>>): SalesOrderLine {
  return {
    id: row.id,
    productId: row.productId as ProductId | undefined,
    productSku: row.productSku ?? undefined,
    productName: row.productName ?? undefined,
    description: row.description,
    quantityOrdered: row.quantityOrdered,
    quantityReserved: row.quantityReserved,
    quantityDelivered: row.quantityDelivered,
    warehouseId: row.warehouseId ?? undefined,
    warehouseName: row.warehouseName ?? undefined,
    unit: row.unit,
    unitPrice: row.unitPrice,
    discountRate: row.discountRate,
    taxRate: row.taxRate
  };
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function normalizeDeliveryNoteDraft(note: DeliveryNote): DeliveryNote {
  return {
    ...note,
    lines: note.lines.map((line) => ({
      ...line,
      quantityToDeliver: requirePositiveDeliveryQuantity(line.quantityToDeliver),
      quantityPosted: 0
    }))
  };
}

function requirePositiveDeliveryQuantity(value: unknown) {
  const quantity = parseDeliveryNoteQuantity(value);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("La quantité à livrer doit être supérieure à zéro.");
  return quantity;
}
