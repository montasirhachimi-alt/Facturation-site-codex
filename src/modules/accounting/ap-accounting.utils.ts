import { ACCOUNTING_WORKSPACE_ID } from "./accounting.constants";
import {
  accountingAmountToMinorUnits,
  calculateJournalEntryTotals,
  normalizeAccountingAmount,
  postJournalEntry
} from "./accounting.utils";
import { moneyToAccountingAmount } from "./commercial-accounting.utils";
import type { AccountingAmount, AccountingJournalEntry, AccountingJournalEntryLine } from "./accounting.types";
import type { ApAccountingPostingContext, ApAccountingPostingSettings } from "./ap-accounting.types";
import type { SupplierBill } from "@/modules/procurement";
import { calculateSupplierBillTotals } from "@/modules/procurement";

export class ApAccountingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApAccountingError";
  }
}

export function createSupplierBillAccountingEntry(
  bill: SupplierBill,
  settings: ApAccountingPostingSettings,
  context: ApAccountingPostingContext,
  reconciliation: { stockClearingAmount?: number; priceVarianceAmount?: number } = {}
) {
  assertFinalSupplierBill(bill);
  assertCurrencyMatches(bill.currency, settings.functionalCurrency);
  assertRequiredSetting(settings.purchaseJournalId, "Journal d'achats non configuré.");
  assertRequiredSetting(settings.payableAccountId, "Compte fournisseurs à payer non configuré.");

  const totals = calculateSupplierBillTotals(bill);
  const netSubtotalAmount = Math.max(0, roundMoney(totals.subtotal - totals.discount));
  const stockClearingAmount = Math.min(netSubtotalAmount, Math.max(0, roundMoney(reconciliation.stockClearingAmount ?? 0)));
  const expenseAmount = roundMoney(netSubtotalAmount - stockClearingAmount);
  if (stockClearingAmount > 0) assertRequiredSetting(settings.grniClearingAccountId, "Compte GRNI / réception à recevoir requis pour une facture fournisseur stockée.");
  if (expenseAmount > 0) assertRequiredSetting(settings.expenseAccountId, "Compte d'achat ou de charge non configuré.");
  if (Math.abs(reconciliation.priceVarianceAmount ?? 0) >= 0.01) {
    throw new ApAccountingError("Écart de prix détecté entre réception valorisée et facture fournisseur. Le traitement des écarts de prix est différé en V1.");
  }
  const stockClearing = moneyToAccountingAmount(stockClearingAmount);
  const expense = moneyToAccountingAmount(expenseAmount);
  const tax = moneyToAccountingAmount(totals.tax);
  const total = moneyToAccountingAmount(totals.total);
  if (accountingAmountToMinorUnits(total) <= BigInt(0)) throw new ApAccountingError("La facture fournisseur ne porte aucun montant à comptabiliser.");
  if (accountingAmountToMinorUnits(tax) > BigInt(0)) {
    assertRequiredSetting(settings.taxRecoverableAccountId, "Compte de TVA récupérable requis pour une facture fournisseur avec TVA.");
  }

  const label = `Facture fournisseur ${bill.number} · ${bill.supplierName}`;
  const lines: AccountingJournalEntryLine[] = [];
  if (accountingAmountToMinorUnits(stockClearing) > BigInt(0) && settings.grniClearingAccountId) {
    lines.push(createLine(bill.id, "grni", settings.grniClearingAccountId, `Apurement GRNI · ${bill.number}`, stockClearing, "0.00" as AccountingAmount));
  }
  if (accountingAmountToMinorUnits(expense) > BigInt(0) && settings.expenseAccountId) {
    lines.push(createLine(bill.id, "expense", settings.expenseAccountId, label, expense, "0.00" as AccountingAmount));
  }
  if (accountingAmountToMinorUnits(tax) > BigInt(0) && settings.taxRecoverableAccountId) {
    lines.push(createLine(bill.id, "tax", settings.taxRecoverableAccountId, `TVA récupérable · ${bill.number}`, tax, "0.00" as AccountingAmount));
  }
  lines.push(createLine(bill.id, "payable", settings.payableAccountId, label, "0.00" as AccountingAmount, total));

  return postApEntry({
    id: `accounting-ap-supplier-bill-${bill.id}`,
    journalId: settings.purchaseJournalId,
    number: `AP-${bill.number}`,
    entryDate: bill.billDate,
    description: `Comptabilisation facture fournisseur ${bill.number}`,
    reference: bill.reference || bill.number,
    sourceType: "procurement.supplier-bill",
    sourceId: bill.id,
    functionalCurrency: settings.functionalCurrency,
    transactionCurrency: bill.currency,
    lines,
    context
  });
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function postApEntry(input: {
  id: string;
  journalId: NonNullable<ApAccountingPostingSettings["purchaseJournalId"]>;
  number: string;
  entryDate: string;
  description: string;
  reference: string;
  sourceType: "procurement.supplier-bill";
  sourceId: string;
  functionalCurrency: string;
  transactionCurrency: string;
  lines: AccountingJournalEntryLine[];
  context: ApAccountingPostingContext;
}) {
  const now = input.context.now?.() ?? new Date().toISOString();
  const totals = calculateJournalEntryTotals(input.lines);
  const draft: AccountingJournalEntry = {
    id: input.id as AccountingJournalEntry["id"],
    tenantCompanyId: input.context.tenantCompanyId,
    workspaceId: input.context.workspaceId || ACCOUNTING_WORKSPACE_ID,
    journalId: input.journalId,
    number: input.number,
    entryDate: new Date(input.entryDate).toISOString(),
    status: "draft",
    description: input.description,
    reference: input.reference,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    functionalCurrency: input.functionalCurrency,
    transactionCurrency: input.transactionCurrency,
    debitTotal: totals.debitTotal,
    creditTotal: totals.creditTotal,
    lines: input.lines,
    createdBy: input.context.userId,
    updatedBy: input.context.userId,
    createdAt: now,
    updatedAt: now
  };
  return postJournalEntry(draft, { postedBy: input.context.userId, now: () => now });
}

function createLine(sourceId: string, kind: string, accountId: string, label: string, debitAmount: AccountingAmount, creditAmount: AccountingAmount): AccountingJournalEntryLine {
  return Object.freeze({
    id: `line-ap-${kind}-${sourceId}` as AccountingJournalEntryLine["id"],
    accountId: accountId as AccountingJournalEntryLine["accountId"],
    label,
    debitAmount: normalizeAccountingAmount(debitAmount),
    creditAmount: normalizeAccountingAmount(creditAmount),
    metadata: { generatedBy: "ap-accounting" }
  });
}

function assertFinalSupplierBill(bill: SupplierBill) {
  if (bill.archivedAt || bill.status === "draft" || bill.status === "cancelled" || bill.status === "archived") {
    throw new ApAccountingError("Seule une facture fournisseur finalisée peut être comptabilisée.");
  }
}

function assertCurrencyMatches(sourceCurrency: string, functionalCurrency: string) {
  if (sourceCurrency.trim().toUpperCase() !== functionalCurrency.trim().toUpperCase()) {
    throw new ApAccountingError("La devise fournisseur ne correspond pas à la devise fonctionnelle configurée. Les écarts de change ne sont pas gérés en V1.");
  }
}

function assertRequiredSetting<T>(value: T | undefined, message: string): asserts value is T {
  if (!value) throw new ApAccountingError(message);
}
