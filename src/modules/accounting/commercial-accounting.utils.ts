import {
  ACCOUNTING_WORKSPACE_ID
} from "./accounting.constants";
import {
  accountingAmountFromMinorUnits,
  accountingAmountToMinorUnits,
  calculateJournalEntryTotals,
  normalizeAccountingAmount,
  postJournalEntry
} from "./accounting.utils";
import type {
  AccountingAmount,
  AccountingJournalEntry,
  AccountingJournalEntryLine
} from "./accounting.types";
import type { Invoice } from "@/modules/sales/invoices";
import { getInvoiceTotals } from "@/modules/sales/invoices";
import type { Payment } from "@/modules/sales/payments";
import type { CommercialAccountingPostingContext, CommercialAccountingPostingSettings } from "./commercial-accounting.types";

export class CommercialAccountingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommercialAccountingError";
  }
}

export function createSalesInvoiceAccountingEntry(invoice: Invoice, settings: CommercialAccountingPostingSettings, context: CommercialAccountingPostingContext) {
  assertFinalInvoice(invoice);
  assertCurrencyMatches(invoice.currency, settings.functionalCurrency);
  assertRequiredSetting(settings.salesJournalId, "Journal de ventes non configuré.");
  assertRequiredSetting(settings.receivableAccountId, "Compte client à recevoir non configuré.");
  assertRequiredSetting(settings.revenueAccountId, "Compte de chiffre d'affaires non configuré.");

  const totals = getInvoiceTotals(invoice);
  const subtotal = moneyToAccountingAmount(totals.subtotal - totals.discount);
  const tax = moneyToAccountingAmount(totals.tax);
  const total = moneyToAccountingAmount(totals.total);
  if (accountingAmountToMinorUnits(total) <= BigInt(0)) throw new CommercialAccountingError("La facture ne porte aucun montant à comptabiliser.");
  if (accountingAmountToMinorUnits(tax) > BigInt(0)) {
    assertRequiredSetting(settings.taxPayableAccountId, "Compte de taxe collectée requis pour une facture avec TVA.");
  }

  const label = `Facture ${invoice.number} · ${invoice.companyName || invoice.customerName}`;
  const lines: AccountingJournalEntryLine[] = [
    createLine(invoice.id, "receivable", settings.receivableAccountId, label, total, "0.00" as AccountingAmount)
  ];
  if (accountingAmountToMinorUnits(subtotal) > BigInt(0)) {
    lines.push(createLine(invoice.id, "revenue", settings.revenueAccountId, label, "0.00" as AccountingAmount, subtotal));
  }
  if (accountingAmountToMinorUnits(tax) > BigInt(0) && settings.taxPayableAccountId) {
    lines.push(createLine(invoice.id, "tax", settings.taxPayableAccountId, `TVA collectée · ${invoice.number}`, "0.00" as AccountingAmount, tax));
  }

  return postCommercialEntry({
    id: `accounting-sales-invoice-${invoice.id}`,
    journalId: settings.salesJournalId,
    number: `AC-${invoice.number}`,
    entryDate: invoice.issueDate,
    description: `Comptabilisation facture ${invoice.number}`,
    reference: invoice.number,
    sourceType: "sales.invoice",
    sourceId: invoice.id,
    functionalCurrency: settings.functionalCurrency,
    transactionCurrency: invoice.currency,
    lines,
    context
  });
}

export function createSalesPaymentAccountingEntry(payment: Payment, settings: CommercialAccountingPostingSettings, context: CommercialAccountingPostingContext) {
  assertFinalPayment(payment);
  assertCurrencyMatches(payment.currency, settings.functionalCurrency);
  assertRequiredSetting(settings.salesJournalId, "Journal de ventes non configuré.");
  assertRequiredSetting(settings.receivableAccountId, "Compte client à recevoir non configuré.");
  assertRequiredSetting(settings.settlementAccountId, "Compte de règlement non configuré.");

  const amount = moneyToAccountingAmount(payment.amount);
  if (accountingAmountToMinorUnits(amount) <= BigInt(0)) throw new CommercialAccountingError("Le règlement ne porte aucun montant à comptabiliser.");

  const label = `Règlement ${payment.number} · ${payment.invoiceNumber}`;
  return postCommercialEntry({
    id: `accounting-sales-payment-${payment.id}`,
    journalId: settings.salesJournalId,
    number: `AC-${payment.number}`,
    entryDate: payment.receivedAt,
    description: `Comptabilisation règlement ${payment.number}`,
    reference: payment.reference || payment.number,
    sourceType: "sales.payment",
    sourceId: payment.id,
    functionalCurrency: settings.functionalCurrency,
    transactionCurrency: payment.currency,
    lines: [
      createLine(payment.id, "settlement", settings.settlementAccountId, label, amount, "0.00" as AccountingAmount),
      createLine(payment.id, "receivable", settings.receivableAccountId, label, "0.00" as AccountingAmount, amount)
    ],
    context
  });
}

export function moneyToAccountingAmount(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new CommercialAccountingError("Montant commercial invalide.");
  return accountingAmountFromMinorUnits(BigInt(Math.round(value * 100)));
}

function postCommercialEntry(input: {
  id: string;
  journalId: NonNullable<CommercialAccountingPostingSettings["salesJournalId"]>;
  number: string;
  entryDate: string;
  description: string;
  reference: string;
  sourceType: "sales.invoice" | "sales.payment";
  sourceId: string;
  functionalCurrency: string;
  transactionCurrency: string;
  lines: AccountingJournalEntryLine[];
  context: CommercialAccountingPostingContext;
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

function createLine(sourceId: string, kind: string, accountId: NonNullable<CommercialAccountingPostingSettings["receivableAccountId"]>, label: string, debitAmount: AccountingAmount, creditAmount: AccountingAmount): AccountingJournalEntryLine {
  return Object.freeze({
    id: `line-${kind}-${sourceId}` as AccountingJournalEntryLine["id"],
    accountId,
    label,
    debitAmount: normalizeAccountingAmount(debitAmount),
    creditAmount: normalizeAccountingAmount(creditAmount),
    metadata: { generatedBy: "commercial-accounting" }
  });
}

function assertRequiredSetting<T>(value: T | undefined, message: string): asserts value is T {
  if (!value) throw new CommercialAccountingError(message);
}

function assertCurrencyMatches(sourceCurrency: string, functionalCurrency: string) {
  if (sourceCurrency.trim().toUpperCase() !== functionalCurrency.trim().toUpperCase()) {
    throw new CommercialAccountingError("La devise commerciale ne correspond pas à la devise fonctionnelle configurée. Les écarts de change ne sont pas gérés en V1.");
  }
}

function assertFinalInvoice(invoice: Invoice) {
  if (invoice.archivedAt || invoice.status === "draft" || invoice.status === "cancelled") {
    throw new CommercialAccountingError("Seule une facture émise, partiellement payée, payée ou échue peut être comptabilisée.");
  }
}

function assertFinalPayment(payment: Payment) {
  if (payment.archivedAt || payment.status === "draft" || payment.status === "cancelled") {
    throw new CommercialAccountingError("Seul un règlement enregistré ou rapproché peut être comptabilisé.");
  }
}
