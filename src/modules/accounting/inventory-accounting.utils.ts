import {
  accountingAmountFromMinorUnits,
  accountingAmountToMinorUnits,
  AccountingDomainError,
  normalizeJournalEntry
} from "./accounting.utils";
import type { AccountingJournalEntry, AccountingJournalEntryLine } from "./accounting.types";
import type { InventoryCogsAccountingInput, InventoryReceiptAccountingInput } from "./inventory-accounting.types";

export function createInventoryCogsAccountingEntry(input: InventoryCogsAccountingInput): AccountingJournalEntry {
  const { context, settings, valuationEvent } = input;
  const issues = [];
  if (valuationEvent.eventType !== "OUTBOUND") {
    issues.push({ code: "invalid-entry" as const, message: "Seuls les événements de sortie de stock génèrent le COGS V1." });
  }
  if (!settings.inventoryJournalId) issues.push({ code: "invalid-journal" as const, message: "Journal stock manquant." });
  if (!settings.inventoryAssetAccountId) issues.push({ code: "invalid-account" as const, message: "Compte Stock manquant." });
  if (!settings.cogsAccountId) issues.push({ code: "invalid-account" as const, message: "Compte COGS manquant." });
  if (valuationEvent.currency !== settings.functionalCurrency) {
    issues.push({ code: "invalid-currency" as const, message: "La devise de valorisation diffère de la devise fonctionnelle." });
  }
  const amountMinor = accountingAmountToMinorUnits(valuationEvent.totalValue);
  if (amountMinor <= BigInt(0)) issues.push({ code: "invalid-amount" as const, message: "La valeur COGS doit être positive." });
  if (issues.length) throw new AccountingDomainError("Comptabilisation COGS invalide.", issues);

  const now = context.now?.() ?? new Date().toISOString();
  const amount = accountingAmountFromMinorUnits(amountMinor);
  const lines: readonly AccountingJournalEntryLine[] = Object.freeze([
    {
      id: `line-cogs-${valuationEvent.id}` as AccountingJournalEntryLine["id"],
      accountId: settings.cogsAccountId!,
      label: `COGS · ${valuationEvent.sourceType} · ${valuationEvent.sourceId}`,
      debitAmount: amount,
      creditAmount: "0.00" as AccountingJournalEntryLine["creditAmount"],
      metadata: { valuationEventId: valuationEvent.id, movementId: valuationEvent.movementId }
    },
    {
      id: `line-inventory-${valuationEvent.id}` as AccountingJournalEntryLine["id"],
      accountId: settings.inventoryAssetAccountId!,
      label: `Sortie stock · ${valuationEvent.sourceType} · ${valuationEvent.sourceId}`,
      debitAmount: "0.00" as AccountingJournalEntryLine["debitAmount"],
      creditAmount: amount,
      metadata: { valuationEventId: valuationEvent.id, movementId: valuationEvent.movementId }
    }
  ]);

  return normalizeJournalEntry({
    id: `inventory-cogs-${valuationEvent.id}` as AccountingJournalEntry["id"],
    tenantCompanyId: context.tenantCompanyId,
    workspaceId: context.workspaceId,
    journalId: settings.inventoryJournalId!,
    number: `COGS-${valuationEvent.sourceId}`,
    entryDate: valuationEvent.occurredAt,
    status: "posted",
    description: `Coût des marchandises vendues · ${valuationEvent.sourceType}`,
    reference: valuationEvent.sourceId,
    sourceType: "inventory.cogs",
    sourceId: valuationEvent.id,
    functionalCurrency: settings.functionalCurrency,
    transactionCurrency: valuationEvent.currency,
    exchangeRate: "1.00" as AccountingJournalEntry["exchangeRate"],
    debitTotal: amount,
    creditTotal: amount,
    lines,
    postedAt: now,
    postedBy: context.userId,
    createdBy: context.userId,
    updatedBy: context.userId,
    createdAt: now,
    updatedAt: now
  });
}

export function createInventoryReceiptAccountingEntry(input: InventoryReceiptAccountingInput): AccountingJournalEntry {
  const { context, settings, valuationEvent } = input;
  const issues = [];
  if (valuationEvent.eventType !== "INBOUND") {
    issues.push({ code: "invalid-entry" as const, message: "Seuls les événements d'entrée de stock génèrent la réception GRNI V1." });
  }
  if (!settings.inventoryJournalId) issues.push({ code: "invalid-journal" as const, message: "Journal stock manquant." });
  if (!settings.inventoryAssetAccountId) issues.push({ code: "invalid-account" as const, message: "Compte Stock manquant." });
  if (!settings.grniClearingAccountId) issues.push({ code: "invalid-account" as const, message: "Compte GRNI / réception à recevoir manquant." });
  if (valuationEvent.currency !== settings.functionalCurrency) {
    issues.push({ code: "invalid-currency" as const, message: "La devise de valorisation diffère de la devise fonctionnelle." });
  }
  const amountMinor = accountingAmountToMinorUnits(valuationEvent.totalValue);
  if (amountMinor <= BigInt(0)) issues.push({ code: "invalid-amount" as const, message: "La valeur de réception stock doit être positive." });
  if (issues.length) throw new AccountingDomainError("Comptabilisation réception stock invalide.", issues);

  const now = context.now?.() ?? new Date().toISOString();
  const amount = accountingAmountFromMinorUnits(amountMinor);
  const lines: readonly AccountingJournalEntryLine[] = Object.freeze([
    {
      id: `line-receipt-inventory-${valuationEvent.id}` as AccountingJournalEntryLine["id"],
      accountId: settings.inventoryAssetAccountId!,
      label: `Entrée stock · ${valuationEvent.sourceType} · ${valuationEvent.sourceId}`,
      debitAmount: amount,
      creditAmount: "0.00" as AccountingJournalEntryLine["creditAmount"],
      metadata: { valuationEventId: valuationEvent.id, movementId: valuationEvent.movementId }
    },
    {
      id: `line-receipt-grni-${valuationEvent.id}` as AccountingJournalEntryLine["id"],
      accountId: settings.grniClearingAccountId!,
      label: `GRNI · ${valuationEvent.sourceType} · ${valuationEvent.sourceId}`,
      debitAmount: "0.00" as AccountingJournalEntryLine["debitAmount"],
      creditAmount: amount,
      metadata: { valuationEventId: valuationEvent.id, movementId: valuationEvent.movementId }
    }
  ]);

  return normalizeJournalEntry({
    id: `inventory-receipt-${valuationEvent.id}` as AccountingJournalEntry["id"],
    tenantCompanyId: context.tenantCompanyId,
    workspaceId: context.workspaceId,
    journalId: settings.inventoryJournalId!,
    number: `GRNI-${valuationEvent.sourceId}`,
    entryDate: valuationEvent.occurredAt,
    status: "posted",
    description: `Comptabilisation réception stock · ${valuationEvent.sourceType}`,
    reference: valuationEvent.sourceId,
    sourceType: "inventory.receipt-valuation",
    sourceId: valuationEvent.id,
    functionalCurrency: settings.functionalCurrency,
    transactionCurrency: valuationEvent.currency,
    exchangeRate: "1.00" as AccountingJournalEntry["exchangeRate"],
    debitTotal: amount,
    creditTotal: amount,
    lines,
    postedAt: now,
    postedBy: context.userId,
    createdBy: context.userId,
    updatedBy: context.userId,
    createdAt: now,
    updatedAt: now
  });
}
