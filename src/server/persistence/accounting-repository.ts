import "server-only";

import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import {
  AccountingDomainError,
  ACCOUNTING_WORKSPACE_ID,
  assertPostingDateIsOpen,
  createSupplierBillAccountingEntry,
  createBalanceSheetReport,
  createGeneralLedgerReport,
  createProfitLossReport,
  createReversalJournalEntry,
  createSalesInvoiceAccountingEntry,
  createSalesPaymentAccountingEntry,
  createTrialBalanceReport,
  normalizeJournalEntry,
  postJournalEntry,
  validateAccount,
  validateAccountingPeriod,
  validateJournal,
  validateJournalEntry,
  type AccountingAccount,
  type AccountingApPostingSettings,
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
  type AccountingPeriod,
  type AccountingPeriodId,
  type AccountingTenantCompanyId
} from "@/modules/accounting";
import type { SupplierBill } from "@/modules/procurement";
import type { Invoice } from "@/modules/sales/invoices";
import type { Payment } from "@/modules/sales/payments";
import type { QuoteItem } from "@/modules/sales/quotes";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbAccount = Prisma.AccountingAccountGetPayload<Record<string, never>>;
type DbJournal = Prisma.AccountingJournalGetPayload<Record<string, never>>;
type DbEntry = Prisma.AccountingJournalEntryGetPayload<{ include: { lines: { orderBy: { position: "asc" } } } }>;
type DbCommercialSettings = Prisma.AccountingCommercialPostingSettingsGetPayload<Record<string, never>>;
type DbApSettings = Prisma.AccountingApPostingSettingsGetPayload<Record<string, never>>;
type DbPeriod = Prisma.AccountingPeriodGetPayload<Record<string, never>>;
type DbSalesInvoice = Prisma.SalesInvoiceGetPayload<{ include: { lines: { orderBy: { position: "asc" } } } }>;
type DbSalesPayment = Prisma.SalesPaymentGetPayload<Record<string, never>>;
type DbSupplierBill = Prisma.ProcurementSupplierBillGetPayload<{ include: { lines: { orderBy: { position: "asc" } } } }>;

export type AccountingPersistenceResource = "account" | "journal" | "journalEntryDraft" | "period";

export type AccountingPersistenceSnapshot = Readonly<{
  accounts: readonly AccountingAccount[];
  journals: readonly AccountingJournal[];
  journalEntries: readonly AccountingJournalEntry[];
  periods: readonly AccountingPeriod[];
  commercialPostingSettings?: AccountingCommercialPostingSettings;
  apPostingSettings?: AccountingApPostingSettings;
  commercialSources: {
    invoices: readonly { sourceType: "sales.invoice"; sourceId: string; journalEntryId?: AccountingJournalEntryId; journalEntryNumber?: string; status: "not_posted" | "draft" | "posted" | "reversed"; postedAt?: string; reversedAt?: string }[];
    payments: readonly { sourceType: "sales.payment"; sourceId: string; journalEntryId?: AccountingJournalEntryId; journalEntryNumber?: string; status: "not_posted" | "draft" | "posted" | "reversed"; postedAt?: string; reversedAt?: string }[];
  };
  apSources: {
    supplierBills: readonly { sourceType: "procurement.supplier-bill"; sourceId: string; journalEntryId?: AccountingJournalEntryId; journalEntryNumber?: string; status: "not_posted" | "draft" | "posted" | "reversed"; postedAt?: string; reversedAt?: string }[];
  };
}>;

export async function loadAccountingSnapshot(scope: PersistenceTenantScope): Promise<AccountingPersistenceSnapshot> {
  const [accounts, journals, entries, periods, settings, apSettings, sourceStatuses, apSourceStatuses] = await Promise.all([
    prisma.accountingAccount.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ code: "asc" }] }),
    prisma.accountingJournal.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ code: "asc" }] }),
    prisma.accountingJournalEntry.findMany({
      where: { tenantCompanyId: scope.companyId },
      include: { lines: { orderBy: { position: "asc" } } },
      orderBy: { entryDate: "desc" }
    }),
    prisma.accountingPeriod.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ startDate: "asc" }] }),
    prisma.accountingCommercialPostingSettings.findUnique({ where: { tenantCompanyId: scope.companyId } }),
    prisma.accountingApPostingSettings.findUnique({ where: { tenantCompanyId: scope.companyId } }),
    loadCommercialSourceStatuses(scope),
    loadApSourceStatuses(scope)
  ]);
  const reversalByOriginal = new Map(entries.filter((entry) => entry.reversalOfEntryId).map((entry) => [entry.reversalOfEntryId, entry.id]));

  return Object.freeze({
    accounts: Object.freeze(accounts.map(mapDbAccount)),
    journals: Object.freeze(journals.map(mapDbJournal)),
    journalEntries: Object.freeze(entries.map((entry) => mapDbEntry(entry, reversalByOriginal))),
    periods: Object.freeze(periods.map(mapDbPeriod)),
    commercialPostingSettings: settings ? mapDbCommercialSettings(settings) : undefined,
    apPostingSettings: apSettings ? mapDbApSettings(apSettings) : undefined,
    commercialSources: sourceStatuses,
    apSources: apSourceStatuses
  });
}

export async function persistAccountingRecord(scope: PersistenceTenantScope, resource: AccountingPersistenceResource, record: unknown) {
  if (resource === "account") return persistAccountingAccount(scope, record as AccountingAccount);
  if (resource === "journal") return persistAccountingJournal(scope, record as AccountingJournal);
  if (resource === "journalEntryDraft") return persistAccountingJournalEntryDraft(scope, record as AccountingJournalEntry);
  if (resource === "period") return persistAccountingPeriod(scope, record as AccountingPeriod);
  throw new Error("Ressource comptable inconnue.");
}

export async function postAccountingEntry(scope: PersistenceTenantScope, id: AccountingJournalEntryId) {
  const snapshot = await loadAccountingSnapshot(scope);
  const existing = snapshot.journalEntries.find((entry) => entry.id === id);
  if (!existing) throw new Error("Ecriture comptable introuvable.");

  const posted = postJournalEntry(existing, {
    accounts: snapshot.accounts,
    journals: snapshot.journals,
    periods: snapshot.periods,
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

export async function reverseAccountingEntry(scope: PersistenceTenantScope, payload: { entryId: AccountingJournalEntryId; reversalDate: string; reason: string }) {
  const snapshot = await loadAccountingSnapshot(scope);
  const original = snapshot.journalEntries.find((entry) => entry.id === payload.entryId);
  if (!original) throw new Error("Ecriture comptable introuvable.");
  if (original.tenantCompanyId !== scope.companyId) throw new Error("Acces refuse: cette ecriture appartient a une autre entreprise.");
  const existingReversal = snapshot.journalEntries.find((entry) => entry.reversalOfEntryId === original.id || (entry.sourceType === "accounting.reversal" && entry.sourceId === original.id));
  if (existingReversal) throw new Error("Cette ecriture a deja ete contrepassee.");
  assertPostingDateIsOpen(payload.reversalDate, snapshot.periods);
  const reversal = createReversalJournalEntry(original, {
    id: createServerId("accounting-reversal") as AccountingJournalEntryId,
    number: await nextReversalNumber(scope, original.number),
    reversalDate: payload.reversalDate,
    reason: payload.reason,
    createdBy: scope.userId,
    now: () => new Date().toISOString()
  });
  validateCommercialPostedEntry(reversal, snapshot);
  await insertGeneratedJournalEntry(scope, reversal);
  const saved = await prisma.accountingJournalEntry.findUnique({
    where: { id: reversal.id },
    include: { lines: { orderBy: { position: "asc" } } }
  });
  if (!saved) throw new Error("Contrepassation introuvable apres creation.");
  return mapDbEntry(saved, new Map([[original.id, saved.id]]));
}

export async function closeAccountingPeriod(scope: PersistenceTenantScope, id: AccountingPeriodId) {
  const existing = await prisma.accountingPeriod.findUnique({ where: { id } });
  if (!existing) throw new Error("Periode comptable introuvable.");
  assertTenantOwner(scope, existing.tenantCompanyId);
  const now = new Date();
  const saved = await prisma.accountingPeriod.update({
    where: { id },
    data: { status: "closed", closedAt: now, closedBy: scope.userId, updatedBy: scope.userId, updatedAt: now }
  });
  return mapDbPeriod(saved);
}

export async function reopenAccountingPeriod(scope: PersistenceTenantScope, id: AccountingPeriodId) {
  const existing = await prisma.accountingPeriod.findUnique({ where: { id } });
  if (!existing) throw new Error("Periode comptable introuvable.");
  assertTenantOwner(scope, existing.tenantCompanyId);
  const now = new Date();
  const saved = await prisma.accountingPeriod.update({
    where: { id },
    data: { status: "open", reopenedAt: now, reopenedBy: scope.userId, updatedBy: scope.userId, updatedAt: now }
  });
  return mapDbPeriod(saved);
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

export async function persistApPostingSettings(scope: PersistenceTenantScope, settings: AccountingApPostingSettings) {
  const scoped = {
    ...settings,
    tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
    functionalCurrency: normalizeCurrency(settings.functionalCurrency)
  };
  await assertApPostingSettingsTenant(scope, scoped);
  const now = new Date().toISOString();

  const saved = await prisma.accountingApPostingSettings.upsert({
    where: { tenantCompanyId: scope.companyId },
    update: apSettingsWriteData({ ...scoped, updatedAt: now }, scope),
    create: {
      tenantCompanyId: scope.companyId,
      ...apSettingsWriteData({ ...scoped, createdAt: settings.createdAt || now, updatedAt: now }, scope)
    }
  });

  return mapDbApSettings(saved);
}

export async function postSalesInvoiceToAccounting(scope: PersistenceTenantScope, invoiceId: string) {
  const existing = await findCommercialSourceEntry(scope, "sales.invoice", invoiceId);
  if (existing) {
    if (await findReversalOfEntry(scope, existing.id)) throw new Error("Cette facture a deja ete contrepassee. La recomptabilisation controlee est differee.");
    return mapDbEntry(existing);
  }

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
  assertPostingDateIsOpen(posted.entryDate, snapshot.periods);
  validateCommercialPostedEntry(posted, snapshot);
  await insertGeneratedJournalEntry(scope, posted);
  const saved = await findCommercialSourceEntry(scope, "sales.invoice", invoiceId);
  if (!saved) throw new Error("Ecriture comptable générée introuvable après comptabilisation.");
  return mapDbEntry(saved);
}

export async function postSalesPaymentToAccounting(scope: PersistenceTenantScope, paymentId: string) {
  const existing = await findCommercialSourceEntry(scope, "sales.payment", paymentId);
  if (existing) {
    if (await findReversalOfEntry(scope, existing.id)) throw new Error("Ce reglement a deja ete contrepassé. La recomptabilisation controlee est differee.");
    return mapDbEntry(existing);
  }

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
  assertPostingDateIsOpen(posted.entryDate, snapshot.periods);
  validateCommercialPostedEntry(posted, snapshot);
  await insertGeneratedJournalEntry(scope, posted);
  const saved = await findCommercialSourceEntry(scope, "sales.payment", paymentId);
  if (!saved) throw new Error("Ecriture comptable générée introuvable après comptabilisation.");
  return mapDbEntry(saved);
}

export async function postSupplierBillToAccounting(scope: PersistenceTenantScope, supplierBillId: string) {
  const existing = await findCommercialSourceEntry(scope, "procurement.supplier-bill", supplierBillId);
  if (existing) {
    if (await findReversalOfEntry(scope, existing.id)) throw new Error("Cette facture fournisseur a deja ete contrepassee. La recomptabilisation controlee est differee.");
    return mapDbEntry(existing);
  }

  const [settings, bill, snapshot] = await Promise.all([
    requireApPostingSettings(scope),
    prisma.procurementSupplierBill.findFirst({
      where: { tenantCompanyId: scope.companyId, id: supplierBillId },
      include: { lines: { orderBy: { position: "asc" } } }
    }),
    loadAccountingSnapshot(scope)
  ]);
  if (!bill) throw new Error("Facture fournisseur introuvable pour cette entreprise.");

  const supplierBill = mapDbSupplierBill(bill);
  const posted = createSupplierBillAccountingEntry(supplierBill, settings, {
    tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    userId: scope.userId as AccountingJournalEntry["postedBy"],
    now: () => new Date().toISOString()
  });
  assertPostingDateIsOpen(posted.entryDate, snapshot.periods);
  validateCommercialPostedEntry(posted, snapshot);
  await insertGeneratedJournalEntry(scope, posted);
  await prisma.procurementSupplierBill.update({
    where: { id: supplierBillId },
    data: { status: "accounted", accountedAt: parseOptionalDate(posted.postedAt), updatedAt: new Date() }
  });
  const saved = await findCommercialSourceEntry(scope, "procurement.supplier-bill", supplierBillId);
  if (!saved) throw new Error("Ecriture fournisseur générée introuvable après comptabilisation.");
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

async function persistAccountingPeriod(scope: PersistenceTenantScope, period: AccountingPeriod) {
  const now = new Date().toISOString();
  const scoped = Object.freeze({
    ...period,
    tenantCompanyId: scope.companyId as AccountingTenantCompanyId,
    name: period.name.trim(),
    status: period.status ?? "open",
    updatedAt: now,
    createdAt: period.createdAt || now
  });
  const existing = await prisma.accountingPeriod.findUnique({ where: { id: scoped.id }, select: { tenantCompanyId: true, status: true } });
  assertTenantOwner(scope, existing?.tenantCompanyId);
  const currentPeriods = (await prisma.accountingPeriod.findMany({ where: { tenantCompanyId: scope.companyId } })).map(mapDbPeriod);
  const validation = validateAccountingPeriod(scoped, currentPeriods);
  if (!validation.valid) throw new AccountingDomainError("Periode comptable invalide.", validation.issues);

  const saved = await prisma.accountingPeriod.upsert({
    where: { id: scoped.id },
    update: periodWriteData(scoped, scope),
    create: { id: scoped.id, tenantCompanyId: scope.companyId, ...periodWriteData(scoped, scope) }
  });
  return mapDbPeriod(saved);
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

async function assertApPostingSettingsTenant(scope: PersistenceTenantScope, settings: AccountingApPostingSettings) {
  if (settings.purchaseJournalId) await assertJournalTenant(scope, settings.purchaseJournalId, { requireExisting: true });
  if (settings.payableAccountId) await assertAccountTenant(scope, settings.payableAccountId, { requireExisting: true });
  if (settings.expenseAccountId) await assertAccountTenant(scope, settings.expenseAccountId, { requireExisting: true });
  if (settings.settlementAccountId) await assertAccountTenant(scope, settings.settlementAccountId, { requireExisting: true });
  if (settings.taxRecoverableAccountId) await assertAccountTenant(scope, settings.taxRecoverableAccountId, { requireExisting: true });
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
    reversalOfEntryId: entry.reversalOfEntryId ?? null,
    correctedByEntryId: entry.correctedByEntryId ?? null,
    correctionReason: entry.correctionReason ?? null,
    correctionType: entry.correctionType ?? null,
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

function periodWriteData(period: AccountingPeriod, scope: PersistenceTenantScope) {
  return {
    name: period.name,
    startDate: parseDate(period.startDate),
    endDate: parseDate(period.endDate),
    status: period.status,
    closedAt: parseOptionalDate(period.closedAt),
    closedBy: period.closedBy ?? null,
    reopenedAt: parseOptionalDate(period.reopenedAt),
    reopenedBy: period.reopenedBy ?? null,
    createdBy: period.createdBy ?? scope.userId,
    updatedBy: period.updatedBy ?? scope.userId,
    createdAt: parseDate(period.createdAt),
    updatedAt: parseDate(period.updatedAt)
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

function apSettingsWriteData(settings: AccountingApPostingSettings, scope: PersistenceTenantScope) {
  return {
    purchaseJournalId: settings.purchaseJournalId ?? null,
    payableAccountId: settings.payableAccountId ?? null,
    expenseAccountId: settings.expenseAccountId ?? null,
    settlementAccountId: settings.settlementAccountId ?? null,
    taxRecoverableAccountId: settings.taxRecoverableAccountId ?? null,
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

async function requireApPostingSettings(scope: PersistenceTenantScope) {
  const settings = await prisma.accountingApPostingSettings.findUnique({ where: { tenantCompanyId: scope.companyId } });
  if (!settings) throw new Error("Configuration de comptabilisation achats manquante.");
  return mapDbApSettings(settings);
}

async function findCommercialSourceEntry(scope: PersistenceTenantScope, sourceType: "sales.invoice" | "sales.payment" | "procurement.supplier-bill", sourceId: string) {
  return await prisma.accountingJournalEntry.findFirst({
    where: { tenantCompanyId: scope.companyId, sourceType, sourceId },
    include: { lines: { orderBy: { position: "asc" } } }
  });
}

async function findReversalOfEntry(scope: PersistenceTenantScope, entryId: string) {
  return await prisma.accountingJournalEntry.findFirst({
    where: { tenantCompanyId: scope.companyId, sourceType: "accounting.reversal", sourceId: entryId },
    select: { id: true, postedAt: true }
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

function mapDbEntry(row: DbEntry, reversalByOriginal: Map<string | null, string> = new Map()): AccountingJournalEntry {
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
    reversalOfEntryId: row.reversalOfEntryId as AccountingJournalEntry["reversalOfEntryId"] | undefined,
    reversedByEntryId: reversalByOriginal.get(row.id) as AccountingJournalEntry["reversedByEntryId"] | undefined,
    correctedByEntryId: row.correctedByEntryId as AccountingJournalEntry["correctedByEntryId"] | undefined,
    correctionReason: row.correctionReason ?? undefined,
    correctionType: row.correctionType as AccountingJournalEntry["correctionType"] | undefined,
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

function mapDbPeriod(row: DbPeriod): AccountingPeriod {
  return Object.freeze({
    id: row.id as AccountingPeriod["id"],
    tenantCompanyId: row.tenantCompanyId as AccountingPeriod["tenantCompanyId"],
    name: row.name,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    status: row.status as AccountingPeriod["status"],
    closedAt: row.closedAt?.toISOString(),
    closedBy: row.closedBy as AccountingPeriod["closedBy"] | undefined,
    reopenedAt: row.reopenedAt?.toISOString(),
    reopenedBy: row.reopenedBy as AccountingPeriod["reopenedBy"] | undefined,
    createdBy: row.createdBy as AccountingPeriod["createdBy"] | undefined,
    updatedBy: row.updatedBy as AccountingPeriod["updatedBy"] | undefined,
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

function mapDbApSettings(row: DbApSettings): AccountingApPostingSettings {
  return Object.freeze({
    tenantCompanyId: row.tenantCompanyId as AccountingTenantCompanyId,
    purchaseJournalId: row.purchaseJournalId as AccountingApPostingSettings["purchaseJournalId"] | undefined,
    payableAccountId: row.payableAccountId as AccountingApPostingSettings["payableAccountId"] | undefined,
    expenseAccountId: row.expenseAccountId as AccountingApPostingSettings["expenseAccountId"] | undefined,
    settlementAccountId: row.settlementAccountId as AccountingApPostingSettings["settlementAccountId"] | undefined,
    taxRecoverableAccountId: row.taxRecoverableAccountId as AccountingApPostingSettings["taxRecoverableAccountId"] | undefined,
    functionalCurrency: row.functionalCurrency,
    updatedBy: row.updatedBy as AccountingApPostingSettings["updatedBy"] | undefined,
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

function mapDbSupplierBill(row: DbSupplierBill): SupplierBill {
  return Object.freeze({
    id: row.id as SupplierBill["id"],
    workspaceId: row.workspaceId as SupplierBill["workspaceId"],
    number: row.number,
    supplierId: row.supplierId as SupplierBill["supplierId"],
    supplierName: row.supplierName,
    purchaseOrderId: row.purchaseOrderId as SupplierBill["purchaseOrderId"] | undefined,
    purchaseOrderNumber: row.purchaseOrderNumber ?? undefined,
    goodsReceiptId: row.goodsReceiptId as SupplierBill["goodsReceiptId"] | undefined,
    goodsReceiptNumber: row.goodsReceiptNumber ?? undefined,
    billDate: row.billDate.toISOString(),
    dueDate: row.dueDate?.toISOString(),
    currency: row.currency,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status as SupplierBill["status"],
    lines: Object.freeze(row.lines.map((line) => Object.freeze({
      id: line.id as SupplierBill["lines"][number]["id"],
      purchaseOrderLineId: line.purchaseOrderLineId as SupplierBill["lines"][number]["purchaseOrderLineId"] | undefined,
      goodsReceiptLineId: line.goodsReceiptLineId as SupplierBill["lines"][number]["goodsReceiptLineId"] | undefined,
      productId: line.productId as SupplierBill["lines"][number]["productId"] | undefined,
      productSku: line.productSku ?? undefined,
      productName: line.productName ?? undefined,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      discountRate: line.discountRate,
      taxRate: line.taxRate
    }))),
    discountRate: row.discountRate,
    accountedAt: row.accountedAt?.toISOString(),
    archivedAt: row.archivedAt?.toISOString(),
    ownerId: row.ownerId as SupplierBill["ownerId"] | undefined,
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
  const reversals = entries.length === 0 ? [] : await prisma.accountingJournalEntry.findMany({
    where: { tenantCompanyId: scope.companyId, sourceType: "accounting.reversal", sourceId: { in: entries.map((entry) => entry.id) } },
    select: { id: true, sourceId: true, postedAt: true }
  });
  const reversalByEntry = new Map(reversals.map((entry) => [entry.sourceId, entry]));
  const entryBySource = new Map(entries.map((entry) => [`${entry.sourceType}:${entry.sourceId}`, entry]));
  return Object.freeze({
    invoices: Object.freeze(invoices.map((invoice) => mapSourceStatus("sales.invoice", invoice.id, entryBySource, reversalByEntry))),
    payments: Object.freeze(payments.map((payment) => mapSourceStatus("sales.payment", payment.id, entryBySource, reversalByEntry)))
  });
}

async function loadApSourceStatuses(scope: PersistenceTenantScope): Promise<AccountingPersistenceSnapshot["apSources"]> {
  const [supplierBills, entries] = await Promise.all([
    prisma.procurementSupplierBill.findMany({ where: { tenantCompanyId: scope.companyId }, select: { id: true } }),
    prisma.accountingJournalEntry.findMany({
      where: { tenantCompanyId: scope.companyId, sourceType: "procurement.supplier-bill" },
      select: { id: true, number: true, sourceType: true, sourceId: true, status: true, postedAt: true }
    })
  ]);
  const reversals = entries.length === 0 ? [] : await prisma.accountingJournalEntry.findMany({
    where: { tenantCompanyId: scope.companyId, sourceType: "accounting.reversal", sourceId: { in: entries.map((entry) => entry.id) } },
    select: { id: true, sourceId: true, postedAt: true }
  });
  const reversalByEntry = new Map(reversals.map((entry) => [entry.sourceId, entry]));
  const entryBySource = new Map(entries.map((entry) => [`${entry.sourceType}:${entry.sourceId}`, entry]));
  return Object.freeze({
    supplierBills: Object.freeze(supplierBills.map((bill) => mapSourceStatus("procurement.supplier-bill", bill.id, entryBySource, reversalByEntry)))
  });
}

function mapSourceStatus<TSourceType extends "sales.invoice" | "sales.payment" | "procurement.supplier-bill">(
  sourceType: TSourceType,
  sourceId: string,
  entryBySource: Map<string, { id: string; number: string; status: string; postedAt: Date | null }>,
  reversalByEntry: Map<string | null, { id: string; sourceId: string | null; postedAt: Date | null }>
) {
  const entry = entryBySource.get(`${sourceType}:${sourceId}`);
  const reversal = entry ? reversalByEntry.get(entry.id) : undefined;
  return Object.freeze({
    sourceType,
    sourceId,
    journalEntryId: entry?.id as AccountingJournalEntryId | undefined,
    journalEntryNumber: entry?.number,
    status: entry ? reversal ? "reversed" : entry.status === "posted" ? "posted" : "draft" : "not_posted",
    postedAt: entry?.postedAt?.toISOString(),
    reversedAt: reversal?.postedAt?.toISOString()
  } as const);
}

async function nextReversalNumber(scope: PersistenceTenantScope, originalNumber: string) {
  const base = `${originalNumber}-REV`;
  const existing = await prisma.accountingJournalEntry.count({
    where: { tenantCompanyId: scope.companyId, number: { startsWith: base } }
  });
  return existing === 0 ? base : `${base}-${existing + 1}`;
}

function createServerId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
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
