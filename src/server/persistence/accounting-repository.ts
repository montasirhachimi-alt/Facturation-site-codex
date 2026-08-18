import "server-only";

import type { Prisma } from "@prisma/client";
import {
  AccountingDomainError,
  ACCOUNTING_WORKSPACE_ID,
  createBalanceSheetReport,
  createGeneralLedgerReport,
  createProfitLossReport,
  createSalesInvoiceAccountingEntry,
  createSalesPaymentAccountingEntry,
  createTrialBalanceReport,
  normalizeJournalEntry,
  postJournalEntry,
  validateAccount,
  validateJournal,
  validateJournalEntry,
  type AccountingAccount,
  type AccountingAccountId,
  type AccountingCommercialPostingSettings,
  type AccountingReportDateScope,
  type BalanceSheetReport,
  type AccountingJournal,
  type AccountingJournalId,
  type AccountingJournalEntry,
  type AccountingJournalEntryId,
  type ProfitLossReport,
  type AccountingJournalEntryLine,
  type AccountingTenantCompanyId
} from "@/modules/accounting";
import type { Invoice } from "@/modules/sales/invoices";
import type { Payment } from "@/modules/sales/payments";
import type { QuoteItem } from "@/modules/sales/quotes";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbAccount = Prisma.AccountingAccountGetPayload<Record<string, never>>;
type DbJournal = Prisma.AccountingJournalGetPayload<Record<string, never>>;
type DbEntry = Prisma.AccountingJournalEntryGetPayload<{ include: { lines: { orderBy: { position: "asc" } } } }>;
type DbCommercialSettings = Prisma.AccountingCommercialPostingSettingsGetPayload<Record<string, never>>;
type DbSalesInvoice = Prisma.SalesInvoiceGetPayload<{ include: { lines: { orderBy: { position: "asc" } } } }>;
type DbSalesPayment = Prisma.SalesPaymentGetPayload<Record<string, never>>;

export type AccountingPersistenceResource = "account" | "journal" | "journalEntryDraft";

export type AccountingPersistenceSnapshot = Readonly<{
  accounts: readonly AccountingAccount[];
  journals: readonly AccountingJournal[];
  journalEntries: readonly AccountingJournalEntry[];
  commercialPostingSettings?: AccountingCommercialPostingSettings;
  commercialSources: {
    invoices: readonly { sourceType: "sales.invoice"; sourceId: string; journalEntryId?: AccountingJournalEntryId; journalEntryNumber?: string; status: "not_posted" | "draft" | "posted"; postedAt?: string }[];
    payments: readonly { sourceType: "sales.payment"; sourceId: string; journalEntryId?: AccountingJournalEntryId; journalEntryNumber?: string; status: "not_posted" | "draft" | "posted"; postedAt?: string }[];
  };
}>;

export async function loadAccountingSnapshot(scope: PersistenceTenantScope): Promise<AccountingPersistenceSnapshot> {
  const [accounts, journals, entries, settings, sourceStatuses] = await Promise.all([
    prisma.accountingAccount.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ code: "asc" }] }),
    prisma.accountingJournal.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ code: "asc" }] }),
    prisma.accountingJournalEntry.findMany({
      where: { tenantCompanyId: scope.companyId },
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { entryDate: "desc" }
    }),
    prisma.accountingCommercialPostingSettings.findUnique({ where: { tenantCompanyId: scope.companyId } }),
    loadCommercialSourceStatuses(scope)
  ]);

  return Object.freeze({
    accounts: Object.freeze(accounts.map(mapDbAccount)),
    journals: Object.freeze(journals.map(mapDbJournal)),
    journalEntries: Object.freeze(entries.map(mapDbEntry)),
    commercialPostingSettings: settings ? mapDbCommercialSettings(settings) : undefined,
    commercialSources: sourceStatuses
  });
}

export async function persistAccountingRecord(scope: PersistenceTenantScope, resource: AccountingPersistenceResource, record: unknown) {
  if (resource === "account") return persistAccountingAccount(scope, record as AccountingAccount);
  if (resource === "journal") return persistAccountingJournal(scope, record as AccountingJournal);
  if (resource === "journalEntryDraft") return persistAccountingJournalEntryDraft(scope, record as AccountingJournalEntry);
  throw new Error("Ressource comptable inconnue.");
}

export async function postAccountingEntry(scope: PersistenceTenantScope, id: AccountingJournalEntryId) {
  const snapshot = await loadAccountingSnapshot(scope);
  const existing = snapshot.journalEntries.find((entry) => entry.id === id);
  if (!existing) throw new Error("Ecriture comptable introuvable.");

  const posted = postJournalEntry(existing, {
    accounts: snapshot.accounts,
    journals: snapshot.journals,
    postedBy: scope.userId
  });

  await prisma.accountingJournalEntry.update({
    where: { id },
    data: {
      status: posted.status,
      debitTotal: posted.debitTotal,
      creditTotal: posted.creditTotal,
      postedAt: parseOptionalDate(posted.postedAt),
      postedBy: posted.postedBy ?? null,
      updatedBy: scope.userId,
      updatedAt: parseDate(posted.updatedAt)
    }
  });

  return posted;
}

export async function persistCommercialPostingSettings(scope: PersistenceTenantScope, settings: AccountingCommercialPostingSettings) {
  const scoped = {
    ...settings,
    tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
    functionalCurrency: normalizeCurrency(settings.functionalCurrency)
  };
  await assertCommercialPostingSettingsTenant(scope, scoped);
  const now = new Date().toISOString();

  const saved = await prisma.accountingCommercialPostingSettings.upsert({
    where: { tenantCompanyId: scope.companyId },
    update: commercialSettingsWriteData({ ...scoped, updatedAt: now }, scope),
    create: {
      tenantCompanyId: scope.companyId,
      ...commercialSettingsWriteData({ ...scoped, createdAt: settings.createdAt || now, updatedAt: now }, scope)
    }
  });

  return mapDbCommercialSettings(saved);
}

export async function postSalesInvoiceToAccounting(scope: PersistenceTenantScope, invoiceId: string) {
  const existing = await findCommercialSourceEntry(scope, "sales.invoice", invoiceId);
  if (existing) return mapDbEntry(existing);

  const [settings, invoice, snapshot] = await Promise.all([
    requireCommercialPostingSettings(scope),
    prisma.salesInvoice.findFirst({
      where: { tenantCompanyId: scope.companyId, id: invoiceId },
      include: { lines: { orderBy: { position: "asc" } } }
    }),
    loadAccountingSnapshot(scope)
  ]);
  if (!invoice) throw new Error("Facture introuvable pour cette entreprise.");

  const posted = createSalesInvoiceAccountingEntry(mapDbSalesInvoice(invoice), settings, {
    tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    userId: scope.userId as AccountingJournalEntry["postedBy"],
    now: () => new Date().toISOString()
  });
  validateCommercialPostedEntry(posted, snapshot);
  await insertGeneratedJournalEntry(scope, posted);
  const saved = await findCommercialSourceEntry(scope, "sales.invoice", invoiceId);
  if (!saved) throw new Error("Ecriture comptable générée introuvable après comptabilisation.");
  return mapDbEntry(saved);
}

export async function postSalesPaymentToAccounting(scope: PersistenceTenantScope, paymentId: string) {
  const existing = await findCommercialSourceEntry(scope, "sales.payment", paymentId);
  if (existing) return mapDbEntry(existing);

  const [settings, payment, snapshot] = await Promise.all([
    requireCommercialPostingSettings(scope),
    prisma.salesPayment.findFirst({ where: { tenantCompanyId: scope.companyId, id: paymentId } }),
    loadAccountingSnapshot(scope)
  ]);
  if (!payment) throw new Error("Règlement introuvable pour cette entreprise.");

  const posted = createSalesPaymentAccountingEntry(mapDbSalesPayment(payment), settings, {
    tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    userId: scope.userId as AccountingJournalEntry["postedBy"],
    now: () => new Date().toISOString()
  });
  validateCommercialPostedEntry(posted, snapshot);
  await insertGeneratedJournalEntry(scope, posted);
  const saved = await findCommercialSourceEntry(scope, "sales.payment", paymentId);
  if (!saved) throw new Error("Ecriture comptable générée introuvable après comptabilisation.");
  return mapDbEntry(saved);
}

export async function getAccountingGeneralLedger(scope: PersistenceTenantScope, query: AccountingReportDateScope & {
  accountIds?: readonly AccountingAccountId[];
  journalIds?: readonly AccountingJournalId[];
} = {}) {
  const snapshot = await loadAccountingSnapshot(scope);
  return createGeneralLedgerReport({
    accounts: snapshot.accounts,
    journals: snapshot.journals,
    journalEntries: snapshot.journalEntries,
    query: {
      tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      accountIds: query.accountIds,
      journalIds: query.journalIds
    }
  });
}

export async function getAccountingTrialBalance(scope: PersistenceTenantScope, query: AccountingReportDateScope & {
  accountIds?: readonly AccountingAccountId[];
  journalIds?: readonly AccountingJournalId[];
} = {}) {
  const snapshot = await loadAccountingSnapshot(scope);
  return createTrialBalanceReport({
    accounts: snapshot.accounts,
    journals: snapshot.journals,
    journalEntries: snapshot.journalEntries,
    query: {
      tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      accountIds: query.accountIds,
      journalIds: query.journalIds
    }
  });
}

export async function getAccountingProfitLoss(scope: PersistenceTenantScope, query: AccountingReportDateScope = {}): Promise<ProfitLossReport> {
  const snapshot = await loadAccountingSnapshot(scope);
  return createProfitLossReport({
    accounts: snapshot.accounts,
    journals: snapshot.journals,
    journalEntries: snapshot.journalEntries,
    query: {
      tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
      fromDate: query.fromDate,
      toDate: query.toDate
    }
  });
}

export async function getAccountingBalanceSheet(scope: PersistenceTenantScope, query: AccountingReportDateScope & { asOfDate?: string } = {}): Promise<BalanceSheetReport> {
  const snapshot = await loadAccountingSnapshot(scope);
  return createBalanceSheetReport({
    accounts: snapshot.accounts,
    journals: snapshot.journals,
    journalEntries: snapshot.journalEntries,
    query: {
      tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
      fromDate: query.fromDate,
      asOfDate: query.asOfDate ?? query.toDate
    }
  });
}

async function persistAccountingAccount(scope: PersistenceTenantScope, account: AccountingAccount) {
  const scopedAccount = Object.freeze({ ...account, tenantCompanyId: scope.companyId as AccountingTenantCompanyId });
  await assertAccountTenant(scope, scopedAccount.id);
  if (scopedAccount.parentAccountId) await assertAccountTenant(scope, scopedAccount.parentAccountId, { requireExisting: true });

  const validation = validateAccount(scopedAccount);
  if (!validation.valid) throw new AccountingDomainError("Compte comptable invalide.", validation.issues);

  await prisma.accountingAccount.upsert({
    where: { id: scopedAccount.id },
    update: accountWriteData(scopedAccount, scope),
    create: { id: scopedAccount.id, tenantCompanyId: scope.companyId, ...accountWriteData(scopedAccount, scope) }
  });
  return scopedAccount;
}

async function persistAccountingJournal(scope: PersistenceTenantScope, journal: AccountingJournal) {
  const scopedJournal = Object.freeze({ ...journal, tenantCompanyId: scope.companyId as AccountingTenantCompanyId });
  await assertJournalTenant(scope, scopedJournal.id);

  const validation = validateJournal(scopedJournal);
  if (!validation.valid) throw new AccountingDomainError("Journal comptable invalide.", validation.issues);

  await prisma.accountingJournal.upsert({
    where: { id: scopedJournal.id },
    update: journalWriteData(scopedJournal, scope),
    create: { id: scopedJournal.id, tenantCompanyId: scope.companyId, ...journalWriteData(scopedJournal, scope) }
  });
  return scopedJournal;
}

async function persistAccountingJournalEntryDraft(scope: PersistenceTenantScope, entry: AccountingJournalEntry) {
  const normalized = normalizeJournalEntry({ ...entry, tenantCompanyId: scope.companyId as AccountingTenantCompanyId, status: "draft" });
  await assertJournalTenant(scope, normalized.journalId, { requireExisting: true });
  for (const line of normalized.lines) await assertAccountTenant(scope, line.accountId, { requireExisting: true });

  const existing = await prisma.accountingJournalEntry.findUnique({ where: { id: normalized.id }, select: { tenantCompanyId: true, status: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
  if (existing?.status === "posted") throw new Error("Une ecriture comptable postee ne peut pas etre modifiee silencieusement.");

  const snapshot = await loadAccountingSnapshot(scope);
  const validation = validateJournalEntry(normalized, { accounts: snapshot.accounts, journals: snapshot.journals });
  if (!validation.valid) throw new AccountingDomainError("Ecriture comptable invalide.", validation.issues);

  await prisma.$transaction(async (tx) => {
    await tx.accountingJournalEntry.upsert({
      where: { id: normalized.id },
      update: journalEntryWriteData(normalized, scope),
      create: { id: normalized.id, tenantCompanyId: scope.companyId, ...journalEntryWriteData(normalized, scope) }
    });
    await tx.accountingJournalEntryLine.deleteMany({ where: { journalEntryId: normalized.id } });
    await tx.accountingJournalEntryLine.createMany({
      data: normalized.lines.map((line, position) => journalEntryLineWriteData(normalized.id, line, position))
    });
  });

  return normalized;
}

async function assertAccountTenant(scope: PersistenceTenantScope, id: AccountingAccountId, options: { requireExisting?: boolean } = {}) {
  const existing = await prisma.accountingAccount.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing && options.requireExisting) throw new Error("Compte comptable introuvable.");
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertJournalTenant(scope: PersistenceTenantScope, id: string, options: { requireExisting?: boolean } = {}) {
  const existing = await prisma.accountingJournal.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing && options.requireExisting) throw new Error("Journal comptable introuvable.");
  assertTenantOwner(scope, existing?.tenantCompanyId);
}

async function assertCommercialPostingSettingsTenant(scope: PersistenceTenantScope, settings: AccountingCommercialPostingSettings) {
  if (settings.salesJournalId) await assertJournalTenant(scope, settings.salesJournalId, { requireExisting: true });
  if (settings.receivableAccountId) await assertAccountTenant(scope, settings.receivableAccountId, { requireExisting: true });
  if (settings.revenueAccountId) await assertAccountTenant(scope, settings.revenueAccountId, { requireExisting: true });
  if (settings.settlementAccountId) await assertAccountTenant(scope, settings.settlementAccountId, { requireExisting: true });
  if (settings.taxPayableAccountId) await assertAccountTenant(scope, settings.taxPayableAccountId, { requireExisting: true });
}

function assertTenantOwner(scope: PersistenceTenantScope, tenantCompanyId?: string) {
  if (tenantCompanyId && tenantCompanyId !== scope.companyId) throw new Error("Acces refuse: cet enregistrement comptable appartient a une autre entreprise.");
}

function accountWriteData(account: AccountingAccount, scope: PersistenceTenantScope) {
  return {
    code: account.code,
    name: account.name,
    type: account.type,
    normalBalance: account.normalBalance,
    parentAccountId: account.parentAccountId ?? null,
    currency: account.currency ?? null,
    active: account.active,
    archivedAt: parseOptionalDate(account.archivedAt),
    createdBy: account.createdBy ?? scope.userId,
    updatedBy: account.updatedBy ?? scope.userId,
    createdAt: parseDate(account.createdAt),
    updatedAt: parseDate(account.updatedAt)
  };
}

function journalWriteData(journal: AccountingJournal, scope: PersistenceTenantScope) {
  return {
    code: journal.code,
    name: journal.name,
    type: journal.type,
    active: journal.active,
    archivedAt: parseOptionalDate(journal.archivedAt),
    createdBy: journal.createdBy ?? scope.userId,
    updatedBy: journal.updatedBy ?? scope.userId,
    createdAt: parseDate(journal.createdAt),
    updatedAt: parseDate(journal.updatedAt)
  };
}

function journalEntryWriteData(entry: AccountingJournalEntry, scope: PersistenceTenantScope) {
  return {
    workspaceId: entry.workspaceId,
    journalId: entry.journalId,
    number: entry.number,
    entryDate: parseDate(entry.entryDate),
    status: entry.status,
    description: entry.description ?? null,
    reference: entry.reference ?? null,
    sourceType: entry.sourceType ?? "manual",
    sourceId: entry.sourceId ?? null,
    functionalCurrency: entry.functionalCurrency,
    transactionCurrency: entry.transactionCurrency ?? null,
    exchangeRate: entry.exchangeRate ?? null,
    debitTotal: entry.debitTotal,
    creditTotal: entry.creditTotal,
    postedAt: parseOptionalDate(entry.postedAt),
    postedBy: entry.postedBy ?? null,
    createdBy: entry.createdBy ?? scope.userId,
    updatedBy: entry.updatedBy ?? scope.userId,
    createdAt: parseDate(entry.createdAt),
    updatedAt: parseDate(entry.updatedAt)
  };
}

function journalEntryLineWriteData(journalEntryId: string, line: AccountingJournalEntryLine, position: number) {
  return {
    id: line.id,
    journalEntryId,
    accountId: line.accountId,
    label: line.label,
    debitAmount: line.debitAmount,
    creditAmount: line.creditAmount,
    position,
    metadata: line.metadata ? line.metadata as Prisma.InputJsonValue : undefined
  };
}

function commercialSettingsWriteData(settings: AccountingCommercialPostingSettings, scope: PersistenceTenantScope) {
  return {
    salesJournalId: settings.salesJournalId ?? null,
    receivableAccountId: settings.receivableAccountId ?? null,
    revenueAccountId: settings.revenueAccountId ?? null,
    settlementAccountId: settings.settlementAccountId ?? null,
    taxPayableAccountId: settings.taxPayableAccountId ?? null,
    functionalCurrency: normalizeCurrency(settings.functionalCurrency),
    updatedBy: settings.updatedBy ?? scope.userId,
    createdAt: parseDate(settings.createdAt),
    updatedAt: parseDate(settings.updatedAt)
  };
}

async function requireCommercialPostingSettings(scope: PersistenceTenantScope) {
  const settings = await prisma.accountingCommercialPostingSettings.findUnique({ where: { tenantCompanyId: scope.companyId } });
  if (!settings) throw new Error("Configuration de comptabilisation des ventes manquante.");
  return mapDbCommercialSettings(settings);
}

async function findCommercialSourceEntry(scope: PersistenceTenantScope, sourceType: "sales.invoice" | "sales.payment", sourceId: string) {
  return await prisma.accountingJournalEntry.findFirst({
    where: { tenantCompanyId: scope.companyId, sourceType, sourceId },
    include: { lines: { orderBy: { position: "asc" } } }
  });
}

async function insertGeneratedJournalEntry(scope: PersistenceTenantScope, entry: AccountingJournalEntry) {
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.accountingJournalEntry.findFirst({
        where: { tenantCompanyId: scope.companyId, sourceType: entry.sourceType, sourceId: entry.sourceId },
        select: { id: true }
      });
      if (existing) return;

      await tx.accountingJournalEntry.create({
        data: { id: entry.id, tenantCompanyId: scope.companyId, ...journalEntryWriteData(entry, scope) }
      });
      await tx.accountingJournalEntryLine.createMany({
        data: entry.lines.map((line, position) => journalEntryLineWriteData(entry.id, line, position))
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return;
    throw error;
  }
}

function validateCommercialPostedEntry(entry: AccountingJournalEntry, snapshot: AccountingPersistenceSnapshot) {
  const validation = validateJournalEntry(entry, { accounts: snapshot.accounts, journals: snapshot.journals, requireBalanced: true });
  if (!validation.valid) throw new AccountingDomainError("Ecriture commerciale invalide.", validation.issues);
}

function mapDbAccount(row: DbAccount): AccountingAccount {
  return Object.freeze({
    id: row.id as AccountingAccount["id"],
    tenantCompanyId: row.tenantCompanyId as AccountingAccount["tenantCompanyId"],
    code: row.code,
    name: row.name,
    type: row.type as AccountingAccount["type"],
    normalBalance: row.normalBalance as AccountingAccount["normalBalance"],
    parentAccountId: row.parentAccountId as AccountingAccount["parentAccountId"] | undefined,
    currency: row.currency ?? undefined,
    active: row.active,
    archivedAt: row.archivedAt?.toISOString(),
    createdBy: row.createdBy as AccountingAccount["createdBy"] | undefined,
    updatedBy: row.updatedBy as AccountingAccount["updatedBy"] | undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbJournal(row: DbJournal): AccountingJournal {
  return Object.freeze({
    id: row.id as AccountingJournal["id"],
    tenantCompanyId: row.tenantCompanyId as AccountingJournal["tenantCompanyId"],
    code: row.code,
    name: row.name,
    type: row.type as AccountingJournal["type"],
    active: row.active,
    archivedAt: row.archivedAt?.toISOString(),
    createdBy: row.createdBy as AccountingJournal["createdBy"] | undefined,
    updatedBy: row.updatedBy as AccountingJournal["updatedBy"] | undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbEntry(row: DbEntry): AccountingJournalEntry {
  return normalizeJournalEntry({
    id: row.id as AccountingJournalEntry["id"],
    tenantCompanyId: row.tenantCompanyId as AccountingJournalEntry["tenantCompanyId"],
    workspaceId: row.workspaceId as AccountingJournalEntry["workspaceId"],
    journalId: row.journalId as AccountingJournalEntry["journalId"],
    number: row.number,
    entryDate: row.entryDate.toISOString(),
    status: row.status as AccountingJournalEntry["status"],
    description: row.description ?? undefined,
    reference: row.reference ?? undefined,
    sourceType: row.sourceType as AccountingJournalEntry["sourceType"] | undefined,
    sourceId: row.sourceId ?? undefined,
    functionalCurrency: row.functionalCurrency,
    transactionCurrency: row.transactionCurrency ?? undefined,
    exchangeRate: row.exchangeRate?.toFixed(2) as AccountingJournalEntry["exchangeRate"] | undefined,
    debitTotal: row.debitTotal.toFixed(2) as AccountingJournalEntry["debitTotal"],
    creditTotal: row.creditTotal.toFixed(2) as AccountingJournalEntry["creditTotal"],
    postedAt: row.postedAt?.toISOString(),
    postedBy: row.postedBy as AccountingJournalEntry["postedBy"] | undefined,
    createdBy: row.createdBy as AccountingJournalEntry["createdBy"] | undefined,
    updatedBy: row.updatedBy as AccountingJournalEntry["updatedBy"] | undefined,
    lines: row.lines.map((line) => Object.freeze({
      id: line.id as AccountingJournalEntryLine["id"],
      accountId: line.accountId as AccountingJournalEntryLine["accountId"],
      label: line.label,
      debitAmount: line.debitAmount.toFixed(2) as AccountingJournalEntryLine["debitAmount"],
      creditAmount: line.creditAmount.toFixed(2) as AccountingJournalEntryLine["creditAmount"],
      metadata: line.metadata && typeof line.metadata === "object" && !Array.isArray(line.metadata) ? line.metadata as Record<string, unknown> : undefined
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbCommercialSettings(row: DbCommercialSettings): AccountingCommercialPostingSettings {
  return Object.freeze({
    tenantCompanyId: row.tenantCompanyId as AccountingTenantCompanyId,
    salesJournalId: row.salesJournalId as AccountingCommercialPostingSettings["salesJournalId"] | undefined,
    receivableAccountId: row.receivableAccountId as AccountingCommercialPostingSettings["receivableAccountId"] | undefined,
    revenueAccountId: row.revenueAccountId as AccountingCommercialPostingSettings["revenueAccountId"] | undefined,
    settlementAccountId: row.settlementAccountId as AccountingCommercialPostingSettings["settlementAccountId"] | undefined,
    taxPayableAccountId: row.taxPayableAccountId as AccountingCommercialPostingSettings["taxPayableAccountId"] | undefined,
    functionalCurrency: row.functionalCurrency,
    updatedBy: row.updatedBy as AccountingCommercialPostingSettings["updatedBy"] | undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbSalesInvoice(row: DbSalesInvoice): Invoice {
  return Object.freeze({
    id: row.id as Invoice["id"],
    workspaceId: row.workspaceId as Invoice["workspaceId"],
    number: row.number,
    customerId: row.crmCustomerId as Invoice["customerId"] | undefined,
    customerName: row.customerName,
    companyId: row.crmCompanyId as Invoice["companyId"],
    companyName: row.companyName ?? undefined,
    contactId: row.crmContactId as Invoice["contactId"] | undefined,
    contactName: row.contactName ?? undefined,
    opportunityId: row.opportunityId as Invoice["opportunityId"] | undefined,
    opportunityName: row.opportunityName ?? undefined,
    quoteId: row.quoteId as Invoice["quoteId"] | undefined,
    status: row.status as Invoice["status"],
    issueDate: row.issueDate.toISOString(),
    dueDate: row.dueDate.toISOString(),
    currency: row.currency as Invoice["currency"],
    items: Object.freeze(row.lines.map(mapDbSalesLine)),
    discountRate: row.discountRate,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId as Invoice["ownerId"],
    paidAmount: row.paidAmount,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbSalesPayment(row: DbSalesPayment): Payment {
  return Object.freeze({
    id: row.id as Payment["id"],
    workspaceId: row.workspaceId as Payment["workspaceId"],
    number: row.number,
    invoiceId: row.invoiceId as Payment["invoiceId"],
    invoiceNumber: row.invoiceNumber,
    customerName: row.customerName,
    companyId: row.crmCompanyId as Payment["companyId"],
    contactId: row.crmContactId as Payment["contactId"] | undefined,
    opportunityId: row.opportunityId as Payment["opportunityId"] | undefined,
    status: row.status as Payment["status"],
    method: row.method as Payment["method"],
    amount: row.amount,
    currency: row.currency as Payment["currency"],
    receivedAt: row.receivedAt.toISOString(),
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId as Payment["ownerId"],
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbSalesLine(row: DbSalesInvoice["lines"][number]): QuoteItem {
  return Object.freeze({
    id: row.id,
    productId: row.productId as QuoteItem["productId"] | undefined,
    productSku: row.productSku ?? undefined,
    productName: row.productName ?? undefined,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit ?? undefined,
    unitPrice: row.unitPrice,
    taxRate: row.taxRate
  });
}

async function loadCommercialSourceStatuses(scope: PersistenceTenantScope): Promise<AccountingPersistenceSnapshot["commercialSources"]> {
  const [invoices, payments, entries] = await Promise.all([
    prisma.salesInvoice.findMany({ where: { tenantCompanyId: scope.companyId }, select: { id: true } }),
    prisma.salesPayment.findMany({ where: { tenantCompanyId: scope.companyId }, select: { id: true } }),
    prisma.accountingJournalEntry.findMany({
      where: { tenantCompanyId: scope.companyId, sourceType: { in: ["sales.invoice", "sales.payment"] } },
      select: { id: true, number: true, sourceType: true, sourceId: true, status: true, postedAt: true }
    })
  ]);
  const entryBySource = new Map(entries.map((entry) => [`${entry.sourceType}:${entry.sourceId}`, entry]));
  return Object.freeze({
    invoices: Object.freeze(invoices.map((invoice) => mapSourceStatus("sales.invoice", invoice.id, entryBySource))),
    payments: Object.freeze(payments.map((payment) => mapSourceStatus("sales.payment", payment.id, entryBySource)))
  });
}

function mapSourceStatus<TSourceType extends "sales.invoice" | "sales.payment">(sourceType: TSourceType, sourceId: string, entryBySource: Map<string, { id: string; number: string; status: string; postedAt: Date | null }>) {
  const entry = entryBySource.get(`${sourceType}:${sourceId}`);
  return Object.freeze({
    sourceType,
    sourceId,
    journalEntryId: entry?.id as AccountingJournalEntryId | undefined,
    journalEntryNumber: entry?.number,
    status: entry ? entry.status === "posted" ? "posted" : "draft" : "not_posted",
    postedAt: entry?.postedAt?.toISOString()
  } as const);
}

function parseDate(value: string) {
  return new Date(value);
}

function parseOptionalDate(value?: string) {
  return value ? new Date(value) : null;
}

function normalizeCurrency(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Devise comptable invalide.");
  return normalized;
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}
