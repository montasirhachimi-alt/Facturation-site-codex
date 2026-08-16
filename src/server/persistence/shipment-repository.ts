import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { ProductId } from "@/modules/products";
import {
  SHIPMENTS_WORKSPACE_ID,
  formatShipmentNumber,
  validateShipmentStatusTransition,
  type Shipment,
  type ShipmentId,
  type ShipmentLine,
  type ShipmentStatus
} from "@/modules/sales/shipments";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbShipment = Prisma.SalesShipmentGetPayload<{ include: { lines: { orderBy: { position: "asc" } } } }>;
type DbShipmentLine = Prisma.SalesShipmentLineGetPayload<Record<string, never>>;

export type ShipmentPersistenceSnapshot = Readonly<{ shipments: Shipment[] }>;

export async function loadShipmentSnapshot(scope: PersistenceTenantScope): Promise<ShipmentPersistenceSnapshot> {
  const shipments = await prisma.salesShipment.findMany({
    where: { tenantCompanyId: scope.companyId },
    include: { lines: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" }
  });
  return { shipments: shipments.map(mapDbShipment) };
}

export async function persistShipment(scope: PersistenceTenantScope, shipment: Shipment) {
  if (shipment.workspaceId !== SHIPMENTS_WORKSPACE_ID) throw new Error("L'expédition doit appartenir à l'espace Expéditions.");
  const carrier = shipment.carrier.trim();
  if (!carrier) throw new Error("Renseignez le transporteur.");
  if (shipment.lines.length === 0) throw new Error("Le bon de livraison ne contient aucune ligne à expédier.");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.salesShipment.findUnique({
      where: { id: shipment.id },
      select: { tenantCompanyId: true, number: true, status: true, deliveryNoteId: true }
    });
    assertTenantOwner(scope, existing?.tenantCompanyId);
    if (existing?.deliveryNoteId && existing.deliveryNoteId !== shipment.deliveryNoteId) {
      throw new Error("Une expédition existante ne peut pas changer de bon de livraison.");
    }
    if (existing && existing.status !== shipment.status) {
      validateShipmentStatusTransition(existing.status as ShipmentStatus, shipment.status);
    }

    const context = await validateShipmentContext(tx, scope, shipment);
    const duplicate = await tx.salesShipment.findFirst({
      where: {
        tenantCompanyId: scope.companyId,
        deliveryNoteId: shipment.deliveryNoteId,
        NOT: { id: shipment.id }
      },
      select: { number: true }
    });
    if (duplicate) throw new Error(`Une expédition existe déjà pour ce bon de livraison (${duplicate.number}).`);

    const persistedId = existing ? shipment.id : (`shipment-${randomUUID()}` as ShipmentId);
    const number = existing?.number ?? formatShipmentNumber(await tx.salesShipment.count({ where: { tenantCompanyId: scope.companyId } }) + 1);
    await tx.salesShipment.upsert({
      where: { id: persistedId },
      update: shipmentWriteData(shipment, number, carrier, context),
      create: { id: persistedId, tenantCompanyId: scope.companyId, ...shipmentWriteData(shipment, number, carrier, context) }
    });
    await tx.salesShipmentLine.deleteMany({ where: { shipmentId: persistedId } });
    await tx.salesShipmentLine.createMany({
      data: shipment.lines.map((line, position) => shipmentLineWriteData(persistedId, line, position))
    });

    return loadShipmentInTransaction(tx, scope, persistedId);
  });
}

export async function updateShipmentStatus(scope: PersistenceTenantScope, shipmentId: string, status: ShipmentStatus) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.salesShipment.findUnique({
      where: { id: shipmentId },
      include: { lines: { orderBy: { position: "asc" } } }
    });
    if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Expédition introuvable.");
    validateShipmentStatusTransition(existing.status as ShipmentStatus, status);
    const now = new Date();
    const updated = await tx.salesShipment.update({
      where: { id: shipmentId },
      data: {
        status,
        deliveredAt: status === "delivered" ? now : existing.deliveredAt,
        updatedAt: now
      },
      include: { lines: { orderBy: { position: "asc" } } }
    });
    return mapDbShipment(updated);
  });
}

async function validateShipmentContext(tx: Prisma.TransactionClient, scope: PersistenceTenantScope, shipment: Shipment) {
  const note = await tx.salesDeliveryNote.findUnique({
    where: { id: shipment.deliveryNoteId },
    include: { lines: { orderBy: { position: "asc" } }, salesOrder: { select: { id: true, tenantCompanyId: true } } }
  });
  if (!note || note.tenantCompanyId !== scope.companyId) throw new Error("Bon de livraison introuvable.");
  if (note.status !== "posted") throw new Error("Créez l'expédition depuis un bon de livraison posté.");
  if (note.salesOrder.tenantCompanyId !== scope.companyId) throw new Error("Commande client introuvable pour cette entreprise.");
  if (shipment.deliveryNoteNumber !== note.number) throw new Error("La référence du bon de livraison ne correspond pas.");
  if (shipment.salesOrderId !== note.salesOrderId) throw new Error("La commande client ne correspond pas au bon de livraison.");
  if (shipment.companyId !== note.crmCompanyId) throw new Error("La société de l'expédition ne correspond pas au bon de livraison.");
  if (shipment.contactId && shipment.contactId !== note.crmContactId) throw new Error("Le contact de l'expédition ne correspond pas au bon de livraison.");
  if (shipment.lines.length !== note.lines.length) throw new Error("L'expédition doit reprendre toutes les lignes du bon de livraison posté.");

  const noteLines = new Map(note.lines.map((line) => [line.id, line]));
  const seenDeliveryNoteLineIds = new Set<string>();
  for (const line of shipment.lines) {
    if (seenDeliveryNoteLineIds.has(line.deliveryNoteLineId)) throw new Error("Une ligne du bon de livraison ne peut pas être expédiée deux fois.");
    seenDeliveryNoteLineIds.add(line.deliveryNoteLineId);
    const noteLine = noteLines.get(line.deliveryNoteLineId);
    if (!noteLine || noteLine.productId !== line.productId) throw new Error("Ligne de bon de livraison invalide.");
    if (line.quantity <= 0) throw new Error("La quantité expédiée doit être supérieure à zéro.");
    if (line.quantity !== decimalToNumber(noteLine.quantityPosted)) throw new Error("La quantité expédiée doit correspondre à la quantité postée du bon de livraison.");
    const product = await tx.product.findUnique({ where: { id: line.productId }, select: { companyId: true, active: true } });
    if (!product || product.companyId !== scope.companyId) throw new Error("Produit introuvable pour cette entreprise.");
  }

  return {
    deliveryNoteNumber: note.number,
    salesOrderNumber: note.salesOrderNumber,
    companyName: note.companyName,
    contactName: note.contactName,
    contactId: note.crmContactId,
    salesOrderId: note.salesOrderId,
    companyId: note.crmCompanyId
  };
}

async function loadShipmentInTransaction(tx: Prisma.TransactionClient, scope: PersistenceTenantScope, id: string) {
  const shipment = await tx.salesShipment.findUnique({ where: { id }, include: { lines: { orderBy: { position: "asc" } } } });
  if (!shipment || shipment.tenantCompanyId !== scope.companyId) throw new Error("Expédition introuvable.");
  return mapDbShipment(shipment);
}

function shipmentWriteData(shipment: Shipment, number: string, carrier: string, context: Awaited<ReturnType<typeof validateShipmentContext>>) {
  const status = shipment.status ?? "draft";
  return {
    workspaceId: shipment.workspaceId,
    number,
    deliveryNoteId: shipment.deliveryNoteId,
    deliveryNoteNumber: context.deliveryNoteNumber,
    salesOrderId: context.salesOrderId,
    salesOrderNumber: context.salesOrderNumber,
    crmCompanyId: context.companyId,
    companyName: context.companyName,
    crmContactId: context.contactId,
    contactName: context.contactName,
    deliveryAddress: shipment.deliveryAddress?.trim() || null,
    carrier,
    trackingNumber: shipment.trackingNumber?.trim() || null,
    shipmentDate: parseDate(shipment.shipmentDate),
    expectedDelivery: shipment.expectedDelivery ? parseDate(shipment.expectedDelivery) : null,
    deliveredAt: status === "delivered" ? parseDate(shipment.deliveredAt ?? new Date().toISOString()) : shipment.deliveredAt ? parseDate(shipment.deliveredAt) : null,
    status,
    notes: shipment.notes?.trim() || null,
    ownerId: shipment.ownerId ?? null,
    createdAt: parseDate(shipment.createdAt),
    updatedAt: new Date()
  };
}

function shipmentLineWriteData(shipmentId: string, line: ShipmentLine, position: number) {
  return {
    id: `shipment-line-${shipmentId}-${position + 1}`,
    shipmentId,
    deliveryNoteLineId: line.deliveryNoteLineId,
    productId: line.productId,
    productSku: line.productSku ?? null,
    productName: line.productName ?? null,
    description: line.description,
    unit: line.unit,
    quantity: line.quantity,
    position
  };
}

function mapDbShipment(row: DbShipment): Shipment {
  return {
    id: row.id as ShipmentId,
    workspaceId: row.workspaceId as Shipment["workspaceId"],
    number: row.number,
    deliveryNoteId: row.deliveryNoteId as Shipment["deliveryNoteId"],
    deliveryNoteNumber: row.deliveryNoteNumber,
    salesOrderId: row.salesOrderId as Shipment["salesOrderId"],
    salesOrderNumber: row.salesOrderNumber,
    companyId: row.crmCompanyId as Shipment["companyId"],
    companyName: row.companyName,
    contactId: row.crmContactId as Shipment["contactId"],
    contactName: row.contactName ?? undefined,
    deliveryAddress: row.deliveryAddress ?? undefined,
    carrier: row.carrier,
    trackingNumber: row.trackingNumber ?? undefined,
    shipmentDate: row.shipmentDate.toISOString(),
    expectedDelivery: row.expectedDelivery?.toISOString(),
    deliveredAt: row.deliveredAt?.toISOString(),
    status: row.status as ShipmentStatus,
    notes: row.notes ?? undefined,
    lines: row.lines.map(mapDbShipmentLine),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ownerId: row.ownerId as Shipment["ownerId"]
  };
}

function mapDbShipmentLine(row: DbShipmentLine): ShipmentLine {
  return {
    id: row.id,
    deliveryNoteLineId: row.deliveryNoteLineId,
    productId: row.productId as ProductId,
    productSku: row.productSku ?? undefined,
    productName: row.productName ?? undefined,
    description: row.description,
    unit: row.unit,
    quantity: decimalToNumber(row.quantity)
  };
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function assertTenantOwner(scope: PersistenceTenantScope, tenantCompanyId?: string) {
  if (tenantCompanyId && tenantCompanyId !== scope.companyId) {
    throw new Error("Accès refusé: cet enregistrement appartient à une autre entreprise.");
  }
}
