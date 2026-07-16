import "server-only";

import type { Prisma } from "@prisma/client";
import type { Company } from "@/modules/crm/companies";
import type { Contact } from "@/modules/crm/contacts";
import type { Customer } from "@/modules/crm/customers";
import type { Meeting } from "@/modules/crm/meetings";
import type { Note } from "@/modules/crm/notes";
import type { Task } from "@/modules/crm/tasks";
import type { Invoice } from "@/modules/sales/invoices";
import { SALES_ORDERS_WORKSPACE_ID, type SalesOrder, type SalesOrderLine } from "@/modules/sales/orders";
import type { Payment } from "@/modules/sales/payments";
import type { Quote, QuoteItem, QuoteStatus } from "@/modules/sales/quotes";
import type { InventoryCompanyId, InventoryUserId } from "@/modules/inventory";
import type { ProductId } from "@/modules/products";
import { canTransitionDocument, type CommercialDocumentStatus } from "@/platform/commercial-documents";
import { getSalesOrderReservationStatus } from "@/modules/sales/orders";
import { loadInventorySnapshot, postInventoryMovementInTransaction } from "./inventory-repository";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbCompany = Prisma.CrmCompanyGetPayload<Record<string, never>>;
type DbCustomer = Prisma.CrmCustomerGetPayload<Record<string, never>>;
type DbContact = Prisma.CrmContactGetPayload<Record<string, never>>;
type DbMeeting = Prisma.CrmMeetingGetPayload<Record<string, never>>;
type DbTask = Prisma.CrmTaskGetPayload<Record<string, never>>;
type DbNote = Prisma.CrmNoteGetPayload<Record<string, never>>;
type DbQuote = Prisma.SalesQuoteGetPayload<{ include: { lines: true } }>;
type DbSalesOrder = Prisma.SalesOrderGetPayload<{ include: { lines: true } }>;
type DbInvoice = Prisma.SalesInvoiceGetPayload<{ include: { lines: true } }>;
type DbPayment = Prisma.SalesPaymentGetPayload<Record<string, never>>;
type DbLine = Prisma.SalesQuoteLineGetPayload<Record<string, never>> | Prisma.SalesInvoiceLineGetPayload<Record<string, never>>;
type DbSalesOrderLine = Prisma.SalesOrderLineGetPayload<Record<string, never>>;

export type CrmSalesPersistenceSnapshot = Readonly<{
  companies: Company[];
  customers: Customer[];
  contacts: Contact[];
  meetings: Meeting[];
  tasks: Task[];
  notes: Note[];
  quotes: Quote[];
  salesOrders: SalesOrder[];
  invoices: Invoice[];
  payments: Payment[];
}>;

export type CrmSalesPersistenceResource =
  | "company"
  | "customer"
  | "contact"
  | "meeting"
  | "task"
  | "note"
  | "quote"
  | "salesOrder"
  | "invoice"
  | "payment";

export async function loadCrmSalesSnapshot(scope: PersistenceTenantScope): Promise<CrmSalesPersistenceSnapshot> {
  const [companies, customers, contacts, meetings, tasks, notes, quotes, salesOrders, invoices, payments] = await Promise.all([
    prisma.crmCompany.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.crmCustomer.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.crmContact.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.crmMeeting.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { startAt: "asc" } }),
    prisma.crmTask.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { dueDate: "asc" } }),
    prisma.crmNote.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.salesQuote.findMany({
      where: { tenantCompanyId: scope.companyId },
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.salesOrder.findMany({
      where: { tenantCompanyId: scope.companyId },
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.salesInvoice.findMany({
      where: { tenantCompanyId: scope.companyId },
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.salesPayment.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } })
  ]);

  return {
    companies: companies.map(mapDbCompany),
    customers: customers.map(mapDbCustomer),
    contacts: contacts.map(mapDbContact),
    meetings: meetings.map(mapDbMeeting),
    tasks: tasks.map(mapDbTask),
    notes: notes.map(mapDbNote),
    quotes: quotes.map(mapDbQuote),
    salesOrders: salesOrders.map(mapDbSalesOrder),
    invoices: invoices.map(mapDbInvoice),
    payments: payments.map(mapDbPayment)
  };
}

export async function persistCrmSalesRecord(scope: PersistenceTenantScope, resource: CrmSalesPersistenceResource, record: unknown) {
  if (resource === "company") return persistCompany(scope, record as Company);
  if (resource === "customer") return persistCustomer(scope, record as Customer);
  if (resource === "contact") return persistContact(scope, record as Contact);
  if (resource === "meeting") return persistMeeting(scope, record as Meeting);
  if (resource === "task") return persistTask(scope, record as Task);
  if (resource === "note") return persistNote(scope, record as Note);
  if (resource === "quote") return persistQuote(scope, record as Quote);
  if (resource === "salesOrder") return persistSalesOrder(scope, record as SalesOrder);
  if (resource === "invoice") return persistInvoice(scope, record as Invoice);
  if (resource === "payment") return persistPayment(scope, record as Payment);
  throw new Error("Ressource persistante inconnue.");
}

export async function transitionQuoteStatus(scope: PersistenceTenantScope, quoteId: string, nextStatus: QuoteStatus) {
  const existing = await prisma.salesQuote.findUnique({
    where: { id: quoteId },
    include: { lines: { orderBy: { position: "asc" } } }
  });
  if (!existing) throw new Error("Devis introuvable pour cette entreprise.");
  assertTenantOwner(scope, existing.tenantCompanyId);
  validateQuoteStatusTransition(existing.status as QuoteStatus, nextStatus);

  const updated = await prisma.salesQuote.update({
    where: { id: quoteId },
    data: { status: nextStatus, updatedAt: new Date() },
    include: { lines: { orderBy: { position: "asc" } } }
  });
  return mapDbQuote(updated);
}

export async function confirmSalesOrder(scope: PersistenceTenantScope, order: SalesOrder, options: { reserve?: boolean; warehouseId?: string; allowPartial?: boolean } = {}) {
  await assertCrmCompanyTenant(scope, order.companyId);
  if (order.contactId) await assertCrmContactTenant(scope, order.contactId);
  if (order.sourceQuoteId) await assertAcceptedSalesQuoteTenant(scope, order.sourceQuoteId);
  await assertUniqueSalesOrderSourceQuote(scope, order);

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const existing = await tx.salesOrder.findUnique({ where: { id: order.id }, include: { lines: true } });
    if (existing) {
      if (existing.tenantCompanyId !== scope.companyId) throw new Error("Accès refusé: cette commande client appartient à une autre entreprise.");
      if (existing.status !== "draft" && existing.status !== "confirmed") throw new Error("Cette commande client ne peut plus être confirmée.");
    }

    let lines = existing ? mapDbSalesOrder(existing).lines : order.lines.map((line) => ({ ...line }));
    if (options.reserve) {
      if (!options.warehouseId) throw new Error("Sélectionnez un entrepôt pour réserver le stock.");
      const warehouse = await tx.inventoryWarehouse.findUnique({ where: { id: options.warehouseId }, select: { id: true, name: true, companyId: true, active: true } });
      if (!warehouse || warehouse.companyId !== scope.companyId) throw new Error("Entrepôt introuvable pour cette entreprise.");
      if (!warehouse.active) throw new Error("Entrepôt inactif.");

      const reservedLines: SalesOrderLine[] = [];
      for (const line of lines) {
        if (!line.productId) {
          reservedLines.push(line);
          continue;
        }
        const product = await tx.product.findUnique({ where: { id: line.productId }, select: { companyId: true, active: true, trackInventory: true } });
        if (!product || product.companyId !== scope.companyId) throw new Error("Produit introuvable pour cette entreprise.");
        if (!product.active) throw new Error("Produit inactif.");
        if (!product.trackInventory) {
          reservedLines.push(line);
          continue;
        }

        if (line.quantityOrdered <= 0) throw new Error("Quantité commandée invalide.");
        const remainingQuantity = Math.max(0, line.quantityOrdered - line.quantityReserved);
        if (remainingQuantity <= 0) {
          reservedLines.push(line);
          continue;
        }
        const balance = await tx.inventoryBalance.findUnique({
          where: { companyId_productId_warehouseId: { companyId: scope.companyId, productId: line.productId, warehouseId: options.warehouseId } },
          select: { quantityAvailable: true }
        });
        const available = decimalToNumber(balance?.quantityAvailable);
        const quantityToReserve = Math.min(remainingQuantity, available);
        if (quantityToReserve <= 0) {
          reservedLines.push(line);
          continue;
        }
        if (quantityToReserve < remainingQuantity && !options.allowPartial) {
          throw new Error("Stock disponible insuffisant pour une réservation complète.");
        }
        await postInventoryMovementInTransaction(tx, scope, {
          id: `movement-${order.id}-${line.id}-reservation` as never,
          companyId: scope.companyId as InventoryCompanyId,
          productId: line.productId,
          toWarehouseId: options.warehouseId as never,
          type: "RESERVATION",
          quantity: quantityToReserve,
          reference: order.number,
          referenceType: "SALES_ORDER",
          referenceId: order.id,
          reason: `Réservation commande client ${order.number}`,
          createdBy: order.ownerId as unknown as InventoryUserId
        });
        reservedLines.push({ ...line, quantityReserved: line.quantityReserved + quantityToReserve, warehouseId: warehouse.id, warehouseName: warehouse.name });
      }
      lines = reservedLines;
    }

    const reservationStatus = getSalesOrderReservationStatus(lines);
    const nextStatus = reservationStatus === "reserved" ? "reserved" : reservationStatus === "partially_reserved" ? "partially_reserved" : "confirmed";
    const nextOrder: SalesOrder = { ...order, status: nextStatus, reservationStatus, lines, updatedAt: now.toISOString() };
    await upsertSalesOrderWithLines(tx, scope, nextOrder);
  });

  return {
    crmSalesSnapshot: await loadCrmSalesSnapshot(scope),
    inventorySnapshot: await loadInventorySnapshot(scope)
  };
}

export async function cancelSalesOrder(scope: PersistenceTenantScope, orderId: string) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const existing = await tx.salesOrder.findUnique({ where: { id: orderId }, include: { lines: { orderBy: { position: "asc" } } } });
    if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Commande client introuvable.");
    if (existing.status === "cancelled") throw new Error("Cette commande client est déjà annulée.");
    if (existing.status === "archived") throw new Error("Cette commande client est archivée.");
    const order = mapDbSalesOrder(existing);
    if (order.lines.some((line) => line.quantityDelivered > 0)) {
      throw new Error("Cette commande contient déjà des quantités livrées et ne peut pas être annulée.");
    }
    for (const line of order.lines) {
      if (!line.productId || !line.warehouseId || line.quantityReserved <= 0) continue;
      await postInventoryMovementInTransaction(tx, scope, {
        id: `movement-${order.id}-${line.id}-release` as never,
        companyId: scope.companyId as InventoryCompanyId,
        productId: line.productId,
        fromWarehouseId: line.warehouseId as never,
        type: "RELEASE",
        quantity: line.quantityReserved,
        reference: order.number,
        referenceType: "SALES_ORDER",
        referenceId: order.id,
        reason: `Libération réservation commande client ${order.number}`,
        createdBy: order.ownerId as unknown as InventoryUserId
      });
    }
    await tx.salesOrder.update({
      where: { id: order.id },
      data: {
        status: "cancelled",
        reservationStatus: "released",
        updatedAt: now,
        lines: {
          update: order.lines.map((line) => ({ where: { id: line.id }, data: { quantityReserved: 0 } }))
        }
      }
    });
  });
  return {
    crmSalesSnapshot: await loadCrmSalesSnapshot(scope),
    inventorySnapshot: await loadInventorySnapshot(scope)
  };
}

async function persistCompany(scope: PersistenceTenantScope, company: Company) {
  await assertCrmCompanyTenant(scope, company.id);
  await prisma.crmCompany.upsert({
    where: { id: company.id },
    update: {
      legalName: company.legalName,
      displayName: company.displayName,
      registrationNumber: company.registrationNumber,
      taxNumber: company.taxNumber,
      industry: company.industry,
      website: company.website,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      country: company.country,
      status: company.status,
      tags: [...company.tags],
      notes: company.notes,
      ownerId: company.ownerId,
      updatedBy: company.updatedBy,
      createdAt: parseDate(company.createdAt),
      updatedAt: parseDate(company.updatedAt)
    },
    create: {
      id: company.id,
      tenantCompanyId: scope.companyId,
      workspaceId: company.workspaceId,
      legalName: company.legalName,
      displayName: company.displayName,
      registrationNumber: company.registrationNumber,
      taxNumber: company.taxNumber,
      industry: company.industry,
      website: company.website,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      country: company.country,
      status: company.status,
      tags: [...company.tags],
      notes: company.notes,
      ownerId: company.ownerId,
      createdBy: company.createdBy,
      updatedBy: company.updatedBy,
      createdAt: parseDate(company.createdAt),
      updatedAt: parseDate(company.updatedAt)
    }
  });
  return company;
}

async function persistCustomer(scope: PersistenceTenantScope, customer: Customer) {
  await assertCrmCustomerTenant(scope, customer.id);
  await prisma.crmCustomer.upsert({
    where: { id: customer.id },
    update: {
      displayName: customer.displayName,
      crmCompanyId: customer.companyId,
      companyName: customer.companyName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      type: customer.type,
      source: customer.source,
      tags: [...customer.tags],
      notes: customer.notes,
      updatedBy: customer.updatedBy,
      createdAt: parseDate(customer.createdAt),
      updatedAt: parseDate(customer.updatedAt)
    },
    create: {
      id: customer.id,
      tenantCompanyId: scope.companyId,
      workspaceId: customer.workspaceId,
      displayName: customer.displayName,
      crmCompanyId: customer.companyId,
      companyName: customer.companyName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      type: customer.type,
      source: customer.source,
      tags: [...customer.tags],
      notes: customer.notes,
      createdBy: customer.createdBy,
      updatedBy: customer.updatedBy,
      createdAt: parseDate(customer.createdAt),
      updatedAt: parseDate(customer.updatedAt)
    }
  });
  return customer;
}

async function persistContact(scope: PersistenceTenantScope, contact: Contact) {
  await assertCrmContactTenant(scope, contact.id);
  await prisma.crmContact.upsert({
    where: { id: contact.id },
    update: {
      crmCompanyId: contact.companyId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      jobTitle: contact.jobTitle,
      department: contact.department,
      email: contact.email,
      mobilePhone: contact.mobilePhone,
      officePhone: contact.officePhone,
      preferredLanguage: contact.preferredLanguage,
      timezone: contact.timezone,
      status: contact.status,
      role: contact.role,
      isPrimaryContact: contact.isPrimaryContact,
      isDecisionMaker: contact.isDecisionMaker,
      linkedin: contact.linkedin,
      notes: contact.notes,
      tags: [...contact.tags],
      ownerId: contact.ownerId,
      updatedBy: contact.updatedBy,
      createdAt: parseDate(contact.createdAt),
      updatedAt: parseDate(contact.updatedAt)
    },
    create: {
      id: contact.id,
      tenantCompanyId: scope.companyId,
      workspaceId: contact.workspaceId,
      crmCompanyId: contact.companyId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      jobTitle: contact.jobTitle,
      department: contact.department,
      email: contact.email,
      mobilePhone: contact.mobilePhone,
      officePhone: contact.officePhone,
      preferredLanguage: contact.preferredLanguage,
      timezone: contact.timezone,
      status: contact.status,
      role: contact.role,
      isPrimaryContact: contact.isPrimaryContact,
      isDecisionMaker: contact.isDecisionMaker,
      linkedin: contact.linkedin,
      notes: contact.notes,
      tags: [...contact.tags],
      ownerId: contact.ownerId,
      createdBy: contact.createdBy,
      updatedBy: contact.updatedBy,
      createdAt: parseDate(contact.createdAt),
      updatedAt: parseDate(contact.updatedAt)
    }
  });
  return contact;
}

async function persistMeeting(scope: PersistenceTenantScope, meeting: Meeting) {
  await assertCrmMeetingTenant(scope, meeting.id);
  await prisma.crmMeeting.upsert({
    where: { id: meeting.id },
    update: meetingWriteData(meeting),
    create: {
      id: meeting.id,
      tenantCompanyId: scope.companyId,
      ...meetingWriteData(meeting)
    }
  });
  return meeting;
}

async function persistTask(scope: PersistenceTenantScope, task: Task) {
  await assertCrmTaskTenant(scope, task.id);
  await prisma.crmTask.upsert({
    where: { id: task.id },
    update: taskWriteData(task),
    create: {
      id: task.id,
      tenantCompanyId: scope.companyId,
      ...taskWriteData(task)
    }
  });
  return task;
}

async function persistNote(scope: PersistenceTenantScope, note: Note) {
  await assertCrmNoteTenant(scope, note.id);
  await prisma.crmNote.upsert({
    where: { id: note.id },
    update: noteWriteData(note),
    create: {
      id: note.id,
      tenantCompanyId: scope.companyId,
      ...noteWriteData(note)
    }
  });
  return note;
}

async function persistQuote(scope: PersistenceTenantScope, quote: Quote) {
  await assertPersistedQuoteStatus(scope, quote);
  await assertSalesLineProductsTenant(scope, quote.items);
  await prisma.salesQuote.upsert({
    where: { id: quote.id },
    update: quoteWriteData(quote),
    create: {
      id: quote.id,
      tenantCompanyId: scope.companyId,
      ...quoteWriteData(quote)
    }
  });
  await replaceQuoteLines(quote.id, quote.items);
  return quote;
}

async function persistSalesOrder(scope: PersistenceTenantScope, order: SalesOrder) {
  if (order.workspaceId !== SALES_ORDERS_WORKSPACE_ID) throw new Error("La commande client doit appartenir à l'espace Commandes clients.");
  await assertSalesOrderTenant(scope, order.id);
  await assertCrmCompanyTenant(scope, order.companyId);
  if (order.contactId) await assertCrmContactTenant(scope, order.contactId);
  if (order.sourceQuoteId) await assertAcceptedSalesQuoteTenant(scope, order.sourceQuoteId);
  await assertUniqueSalesOrderSourceQuote(scope, order);
  await prisma.$transaction((tx) => upsertSalesOrderWithLines(tx, scope, order));
  return order;
}

async function upsertSalesOrderWithLines(tx: Prisma.TransactionClient, scope: PersistenceTenantScope, order: SalesOrder) {
  await tx.salesOrder.upsert({
    where: { id: order.id },
    update: salesOrderWriteData(order),
    create: {
      id: order.id,
      tenantCompanyId: scope.companyId,
      ...salesOrderWriteData(order)
    }
  });
  await tx.salesOrderLine.deleteMany({ where: { salesOrderId: order.id } });
  if (order.lines.length > 0) {
    await tx.salesOrderLine.createMany({
      data: order.lines.map((line, position) => salesOrderLineWriteData(order.id, line, position))
    });
  }
}

async function persistInvoice(scope: PersistenceTenantScope, invoice: Invoice) {
  await assertSalesInvoiceTenant(scope, invoice.id);
  await assertSalesLineProductsTenant(scope, invoice.items);
  await prisma.salesInvoice.upsert({
    where: { id: invoice.id },
    update: invoiceWriteData(invoice),
    create: {
      id: invoice.id,
      tenantCompanyId: scope.companyId,
      ...invoiceWriteData(invoice)
    }
  });
  await replaceInvoiceLines(invoice.id, invoice.items);
  return invoice;
}

async function persistPayment(scope: PersistenceTenantScope, payment: Payment) {
  await assertSalesPaymentTenant(scope, payment.id);
  await prisma.salesPayment.upsert({
    where: { id: payment.id },
    update: paymentWriteData(payment),
    create: {
      id: payment.id,
      tenantCompanyId: scope.companyId,
      ...paymentWriteData(payment)
    }
  });
  return payment;
}

async function assertCrmCompanyTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.crmCompany.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertCrmCustomerTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.crmCustomer.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertCrmContactTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.crmContact.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertCrmMeetingTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.crmMeeting.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertCrmTaskTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.crmTask.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertCrmNoteTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.crmNote.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertPersistedQuoteStatus(scope: PersistenceTenantScope, quote: Quote) {
  const existing = await prisma.salesQuote.findUnique({ where: { id: quote.id }, select: { tenantCompanyId: true, status: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
  if (!existing) {
    if (quote.status !== "draft") throw new Error("Un nouveau devis doit être créé en brouillon.");
    return;
  }
  if (existing.status !== quote.status) validateQuoteStatusTransition(existing.status as QuoteStatus, quote.status);
}

async function assertAcceptedSalesQuoteTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.salesQuote.findUnique({ where: { id }, select: { tenantCompanyId: true, status: true } });
  if (!existing) throw new Error("Devis source introuvable pour cette entreprise.");
  assertTenantOwner(scope, existing.tenantCompanyId);
  if (existing.status !== "accepted") {
    throw new Error("Une commande client ne peut être créée qu'à partir d'un devis accepté.");
  }
}

async function assertUniqueSalesOrderSourceQuote(scope: PersistenceTenantScope, order: SalesOrder) {
  if (!order.sourceQuoteId) return;
  const existing = await prisma.salesOrder.findFirst({
    where: {
      tenantCompanyId: scope.companyId,
      sourceQuoteId: order.sourceQuoteId,
      NOT: { id: order.id }
    },
    select: { id: true, number: true }
  });
  if (existing) {
    throw new Error(`Une commande client existe déjà pour ce devis (${existing.number}).`);
  }
}

function validateQuoteStatusTransition(from: QuoteStatus, to: QuoteStatus) {
  if (from === to) throw new Error("Ce devis possède déjà ce statut.");
  if (!canTransitionDocument("quote", from as CommercialDocumentStatus, to as CommercialDocumentStatus)) {
    throw new Error("Transition de devis non autorisée.");
  }
}

async function assertSalesInvoiceTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.salesInvoice.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertSalesOrderTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.salesOrder.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertSalesPaymentTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.salesPayment.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertSalesLineProductsTenant(scope: PersistenceTenantScope, items: readonly QuoteItem[]) {
  const productIds = [...new Set(items.map((item) => item.productId).filter((id): id is NonNullable<QuoteItem["productId"]> => Boolean(id)))];
  if (productIds.length === 0) return;
  const products = await prisma.product.findMany({ where: { companyId: scope.companyId, id: { in: productIds } }, select: { id: true } });
  const found = new Set(products.map((product) => product.id));
  const missing = productIds.find((id) => !found.has(id));
  if (missing) throw new Error("Produit introuvable pour cette entreprise.");
}

function assertTenantOwner(scope: PersistenceTenantScope, tenantCompanyId?: string) {
  if (tenantCompanyId && tenantCompanyId !== scope.companyId) {
    throw new Error("Accès refusé: cet enregistrement appartient à une autre entreprise.");
  }
}

function quoteWriteData(quote: Quote) {
  return {
    workspaceId: quote.workspaceId,
    number: quote.number,
    crmCustomerId: quote.customerId,
    customerName: quote.customerName,
    crmCompanyId: quote.companyId,
    companyName: quote.companyName,
    crmContactId: quote.contactId,
    contactName: quote.contactName,
    opportunityId: quote.opportunityId,
    opportunityName: quote.opportunityName,
    status: quote.status,
    issueDate: parseDate(quote.issueDate),
    expirationDate: parseDate(quote.expirationDate),
    validityDays: quote.validityDays,
    currency: quote.currency,
    discountRate: quote.discountRate,
    notes: quote.notes,
    ownerId: quote.ownerId,
    createdAt: parseDate(quote.createdAt),
    updatedAt: parseDate(quote.updatedAt)
  };
}

function invoiceWriteData(invoice: Invoice) {
  return {
    workspaceId: invoice.workspaceId,
    number: invoice.number,
    crmCustomerId: invoice.customerId,
    customerName: invoice.customerName,
    crmCompanyId: invoice.companyId,
    companyName: invoice.companyName,
    crmContactId: invoice.contactId,
    contactName: invoice.contactName,
    opportunityId: invoice.opportunityId,
    opportunityName: invoice.opportunityName,
    quoteId: invoice.quoteId,
    status: invoice.status,
    issueDate: parseDate(invoice.issueDate),
    dueDate: parseDate(invoice.dueDate),
    currency: invoice.currency,
    discountRate: invoice.discountRate,
    notes: invoice.notes,
    ownerId: invoice.ownerId,
    paidAmount: invoice.paidAmount,
    archivedAt: invoice.archivedAt ? parseDate(invoice.archivedAt) : null,
    createdAt: parseDate(invoice.createdAt),
    updatedAt: parseDate(invoice.updatedAt)
  };
}

function salesOrderWriteData(order: SalesOrder) {
  return {
    workspaceId: order.workspaceId,
    number: order.number,
    crmCompanyId: order.companyId,
    companyName: order.companyName,
    crmContactId: order.contactId ?? null,
    contactName: order.contactName ?? null,
    sourceQuoteId: order.sourceQuoteId ?? null,
    sourceQuoteNumber: order.sourceQuoteNumber ?? null,
    orderDate: parseDate(order.orderDate),
    expectedDeliveryDate: order.expectedDeliveryDate ? parseDate(order.expectedDeliveryDate) : null,
    currency: order.currency,
    status: order.status,
    reservationStatus: order.reservationStatus,
    customerReference: order.customerReference ?? null,
    internalReference: order.internalReference ?? null,
    notes: order.notes ?? null,
    discountRate: order.discountRate,
    ownerId: order.ownerId,
    archivedAt: order.archivedAt ? parseDate(order.archivedAt) : null,
    createdAt: parseDate(order.createdAt),
    updatedAt: parseDate(order.updatedAt)
  };
}

function paymentWriteData(payment: Payment) {
  return {
    workspaceId: payment.workspaceId,
    number: payment.number,
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoiceNumber,
    customerName: payment.customerName,
    crmCompanyId: payment.companyId,
    crmContactId: payment.contactId,
    opportunityId: payment.opportunityId,
    status: payment.status,
    method: payment.method,
    amount: payment.amount,
    currency: payment.currency,
    receivedAt: parseDate(payment.receivedAt),
    reference: payment.reference,
    notes: payment.notes,
    ownerId: payment.ownerId,
    archivedAt: payment.archivedAt ? parseDate(payment.archivedAt) : null,
    createdAt: parseDate(payment.createdAt),
    updatedAt: parseDate(payment.updatedAt)
  };
}

function meetingWriteData(meeting: Meeting) {
  return {
    workspaceId: meeting.workspaceId,
    crmCompanyId: meeting.companyId,
    crmContactId: meeting.contactIds[0] ?? null,
    contactIds: [...meeting.contactIds],
    title: meeting.title,
    description: meeting.description,
    location: meeting.location,
    meetingType: meeting.meetingType,
    status: meeting.status,
    startAt: parseDate(meeting.startAt),
    endAt: parseDate(meeting.endAt),
    organizerId: meeting.organizerId,
    participants: meeting.participants.map((participant) => ({ ...participant })),
    notes: meeting.notes,
    tags: [...meeting.tags],
    createdAt: parseDate(meeting.createdAt),
    updatedAt: parseDate(meeting.updatedAt)
  };
}

function taskWriteData(task: Task) {
  return {
    workspaceId: task.workspaceId,
    crmCompanyId: task.companyId,
    crmContactId: task.contactId ?? null,
    meetingId: task.meetingId,
    title: task.title,
    description: task.description,
    taskType: task.taskType,
    priority: task.priority,
    status: task.status,
    assignedTo: task.assignedTo,
    dueDate: parseDate(task.dueDate),
    completedAt: task.completedAt ? parseDate(task.completedAt) : null,
    tags: [...task.tags],
    createdAt: parseDate(task.createdAt),
    updatedAt: parseDate(task.updatedAt)
  };
}

function noteWriteData(note: Note) {
  return {
    workspaceId: note.workspaceId,
    crmCompanyId: note.companyId,
    crmContactId: note.contactId ?? null,
    meetingId: note.meetingId,
    taskId: note.taskId,
    title: note.title,
    content: note.content,
    visibility: note.visibility,
    authorId: note.authorId,
    tags: [...note.tags],
    attachments: note.attachments.map((attachment) => ({ ...attachment })),
    archivedAt: note.archivedAt ? parseDate(note.archivedAt) : null,
    createdAt: parseDate(note.createdAt),
    updatedAt: parseDate(note.updatedAt)
  };
}

async function replaceQuoteLines(quoteId: string, items: readonly QuoteItem[]) {
  await prisma.salesQuoteLine.deleteMany({ where: { quoteId } });
  if (items.length === 0) return;
  await prisma.salesQuoteLine.createMany({
    data: items.map((item, position) => ({ ...lineWriteData(item), quoteId, position }))
  });
}

async function replaceInvoiceLines(invoiceId: string, items: readonly QuoteItem[]) {
  await prisma.salesInvoiceLine.deleteMany({ where: { invoiceId } });
  if (items.length === 0) return;
  await prisma.salesInvoiceLine.createMany({
    data: items.map((item, position) => ({ ...lineWriteData(item), invoiceId, position }))
  });
}

function lineWriteData(item: QuoteItem) {
  return {
    id: item.id,
    productId: item.productId ?? null,
    productSku: item.productSku ?? null,
    productName: item.productName ?? null,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit ?? null,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate
  };
}

function salesOrderLineWriteData(salesOrderId: string, line: SalesOrderLine, position: number) {
  return {
    id: line.id,
    salesOrderId,
    productId: line.productId ?? null,
    productSku: line.productSku ?? null,
    productName: line.productName ?? null,
    description: line.description,
    quantityOrdered: line.quantityOrdered,
    quantityReserved: line.quantityReserved,
    quantityDelivered: line.quantityDelivered,
    warehouseId: line.warehouseId ?? null,
    warehouseName: line.warehouseName ?? null,
    unit: String(line.unit),
    unitPrice: line.unitPrice,
    discountRate: line.discountRate,
    taxRate: line.taxRate,
    position
  };
}

function mapDbCompany(row: DbCompany): Company {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    legalName: row.legalName,
    displayName: row.displayName,
    registrationNumber: row.registrationNumber ?? undefined,
    taxNumber: row.taxNumber ?? undefined,
    industry: row.industry,
    website: row.website ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    status: row.status,
    tags: readTags(row.tags),
    notes: row.notes ?? undefined,
    ownerId: row.ownerId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy ?? undefined
  } as unknown as Company;
}

function mapDbCustomer(row: DbCustomer): Customer {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    displayName: row.displayName,
    companyId: row.crmCompanyId ?? undefined,
    companyName: row.companyName ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status,
    type: row.type,
    source: row.source,
    tags: readTags(row.tags),
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy ?? undefined
  } as unknown as Customer;
}

function mapDbContact(row: DbContact): Contact {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    companyId: row.crmCompanyId,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: row.fullName,
    jobTitle: row.jobTitle ?? undefined,
    department: row.department ?? undefined,
    email: row.email ?? undefined,
    mobilePhone: row.mobilePhone ?? undefined,
    officePhone: row.officePhone ?? undefined,
    preferredLanguage: row.preferredLanguage ?? undefined,
    timezone: row.timezone ?? undefined,
    status: row.status,
    role: row.role ?? undefined,
    isPrimaryContact: row.isPrimaryContact,
    isDecisionMaker: row.isDecisionMaker,
    linkedin: row.linkedin ?? undefined,
    notes: row.notes ?? undefined,
    tags: readTags(row.tags),
    ownerId: row.ownerId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy ?? undefined
  } as unknown as Contact;
}

function mapDbMeeting(row: DbMeeting): Meeting {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    companyId: row.crmCompanyId,
    contactIds: readTags(row.contactIds),
    title: row.title,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    meetingType: row.meetingType,
    status: row.status,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    organizerId: row.organizerId,
    participants: readObjectArray(row.participants),
    notes: row.notes ?? undefined,
    tags: readTags(row.tags),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as unknown as Meeting;
}

function mapDbTask(row: DbTask): Task {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    companyId: row.crmCompanyId,
    contactId: row.crmContactId ?? undefined,
    meetingId: row.meetingId ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    taskType: row.taskType,
    priority: row.priority,
    status: row.status,
    assignedTo: row.assignedTo,
    dueDate: row.dueDate.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    tags: readTags(row.tags),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as unknown as Task;
}

function mapDbNote(row: DbNote): Note {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    companyId: row.crmCompanyId,
    contactId: row.crmContactId ?? undefined,
    meetingId: row.meetingId ?? undefined,
    taskId: row.taskId ?? undefined,
    title: row.title,
    content: row.content,
    visibility: row.visibility,
    authorId: row.authorId,
    tags: readTags(row.tags),
    attachments: readObjectArray(row.attachments),
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as unknown as Note;
}

function mapDbQuote(row: DbQuote): Quote {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    number: row.number,
    customerId: row.crmCustomerId ?? undefined,
    customerName: row.customerName,
    companyId: row.crmCompanyId,
    companyName: row.companyName ?? undefined,
    contactId: row.crmContactId ?? undefined,
    contactName: row.contactName ?? undefined,
    opportunityId: row.opportunityId ?? undefined,
    opportunityName: row.opportunityName ?? undefined,
    status: row.status,
    issueDate: row.issueDate.toISOString(),
    expirationDate: row.expirationDate.toISOString(),
    validityDays: row.validityDays ?? undefined,
    currency: row.currency,
    items: row.lines.map(mapDbLine),
    discountRate: decimalToNumber(row.discountRate),
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as unknown as Quote;
}

function mapDbSalesOrder(row: DbSalesOrder): SalesOrder {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    number: row.number,
    companyId: row.crmCompanyId,
    companyName: row.companyName,
    contactId: row.crmContactId ?? undefined,
    contactName: row.contactName ?? undefined,
    sourceQuoteId: row.sourceQuoteId ?? undefined,
    sourceQuoteNumber: row.sourceQuoteNumber ?? undefined,
    orderDate: row.orderDate.toISOString(),
    expectedDeliveryDate: row.expectedDeliveryDate?.toISOString(),
    currency: row.currency,
    status: row.status,
    reservationStatus: row.reservationStatus,
    customerReference: row.customerReference ?? undefined,
    internalReference: row.internalReference ?? undefined,
    notes: row.notes ?? undefined,
    lines: row.lines.map(mapDbSalesOrderLine),
    discountRate: decimalToNumber(row.discountRate),
    ownerId: row.ownerId,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as unknown as SalesOrder;
}

function mapDbSalesOrderLine(row: DbSalesOrderLine): SalesOrderLine {
  return {
    id: row.id,
    productId: row.productId ? row.productId as ProductId : undefined,
    productSku: row.productSku ?? undefined,
    productName: row.productName ?? undefined,
    description: row.description,
    quantityOrdered: decimalToNumber(row.quantityOrdered),
    quantityReserved: decimalToNumber(row.quantityReserved),
    quantityDelivered: decimalToNumber(row.quantityDelivered),
    warehouseId: row.warehouseId ?? undefined,
    warehouseName: row.warehouseName ?? undefined,
    unit: row.unit,
    unitPrice: decimalToNumber(row.unitPrice),
    discountRate: decimalToNumber(row.discountRate),
    taxRate: decimalToNumber(row.taxRate)
  } as SalesOrderLine;
}

function mapDbInvoice(row: DbInvoice): Invoice {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    number: row.number,
    customerId: row.crmCustomerId ?? undefined,
    customerName: row.customerName,
    companyId: row.crmCompanyId,
    companyName: row.companyName ?? undefined,
    contactId: row.crmContactId ?? undefined,
    contactName: row.contactName ?? undefined,
    opportunityId: row.opportunityId ?? undefined,
    opportunityName: row.opportunityName ?? undefined,
    quoteId: row.quoteId ?? undefined,
    status: row.status,
    issueDate: row.issueDate.toISOString(),
    dueDate: row.dueDate.toISOString(),
    currency: row.currency,
    items: row.lines.map(mapDbLine),
    discountRate: decimalToNumber(row.discountRate),
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    paidAmount: decimalToNumber(row.paidAmount),
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as unknown as Invoice;
}

function mapDbPayment(row: DbPayment): Payment {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    number: row.number,
    invoiceId: row.invoiceId,
    invoiceNumber: row.invoiceNumber,
    customerName: row.customerName,
    companyId: row.crmCompanyId,
    contactId: row.crmContactId ?? undefined,
    opportunityId: row.opportunityId ?? undefined,
    status: row.status,
    method: row.method,
    amount: decimalToNumber(row.amount),
    currency: row.currency,
    receivedAt: row.receivedAt.toISOString(),
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as unknown as Payment;
}

function mapDbLine(row: DbLine): QuoteItem {
  return {
    id: row.id,
    productId: row.productId ? row.productId as ProductId : undefined,
    productSku: row.productSku ?? undefined,
    productName: row.productName ?? undefined,
    description: row.description,
    quantity: decimalToNumber(row.quantity),
    unit: row.unit ?? undefined,
    unitPrice: decimalToNumber(row.unitPrice),
    taxRate: decimalToNumber(row.taxRate)
  };
}

function readTags(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readObjectArray(value: unknown): readonly Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : value.toNumber();
}
