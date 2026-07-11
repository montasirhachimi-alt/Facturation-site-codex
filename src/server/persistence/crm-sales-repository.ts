import "server-only";

import type { Prisma } from "@prisma/client";
import type { Company } from "@/modules/crm/companies";
import type { Contact } from "@/modules/crm/contacts";
import type { Customer } from "@/modules/crm/customers";
import type { Invoice } from "@/modules/sales/invoices";
import type { Payment } from "@/modules/sales/payments";
import type { Quote, QuoteItem } from "@/modules/sales/quotes";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbCompany = Prisma.CrmCompanyGetPayload<Record<string, never>>;
type DbCustomer = Prisma.CrmCustomerGetPayload<Record<string, never>>;
type DbContact = Prisma.CrmContactGetPayload<Record<string, never>>;
type DbQuote = Prisma.SalesQuoteGetPayload<{ include: { lines: true } }>;
type DbInvoice = Prisma.SalesInvoiceGetPayload<{ include: { lines: true } }>;
type DbPayment = Prisma.SalesPaymentGetPayload<Record<string, never>>;
type DbLine = Prisma.SalesQuoteLineGetPayload<Record<string, never>> | Prisma.SalesInvoiceLineGetPayload<Record<string, never>>;

export type CrmSalesPersistenceSnapshot = Readonly<{
  companies: Company[];
  customers: Customer[];
  contacts: Contact[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
}>;

export type CrmSalesPersistenceResource =
  | "company"
  | "customer"
  | "contact"
  | "quote"
  | "invoice"
  | "payment";

export async function loadCrmSalesSnapshot(scope: PersistenceTenantScope): Promise<CrmSalesPersistenceSnapshot> {
  const [companies, customers, contacts, quotes, invoices, payments] = await Promise.all([
    prisma.crmCompany.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.crmCustomer.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.crmContact.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.salesQuote.findMany({
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
    quotes: quotes.map(mapDbQuote),
    invoices: invoices.map(mapDbInvoice),
    payments: payments.map(mapDbPayment)
  };
}

export async function persistCrmSalesRecord(scope: PersistenceTenantScope, resource: CrmSalesPersistenceResource, record: unknown) {
  if (resource === "company") return persistCompany(scope, record as Company);
  if (resource === "customer") return persistCustomer(scope, record as Customer);
  if (resource === "contact") return persistContact(scope, record as Contact);
  if (resource === "quote") return persistQuote(scope, record as Quote);
  if (resource === "invoice") return persistInvoice(scope, record as Invoice);
  if (resource === "payment") return persistPayment(scope, record as Payment);
  throw new Error("Ressource persistante inconnue.");
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

async function persistQuote(scope: PersistenceTenantScope, quote: Quote) {
  await assertSalesQuoteTenant(scope, quote.id);
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

async function persistInvoice(scope: PersistenceTenantScope, invoice: Invoice) {
  await assertSalesInvoiceTenant(scope, invoice.id);
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

async function assertSalesQuoteTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.salesQuote.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertSalesInvoiceTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.salesInvoice.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertSalesPaymentTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.salesPayment.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
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
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxRate: item.taxRate
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
    discountRate: row.discountRate,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  } as unknown as Quote;
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
    discountRate: row.discountRate,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    paidAmount: row.paidAmount,
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
    amount: row.amount,
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
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    taxRate: row.taxRate
  };
}

function readTags(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
