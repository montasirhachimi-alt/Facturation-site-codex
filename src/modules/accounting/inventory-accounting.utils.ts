import {
  accountingAmountFromMinorUnits,
  accountingAmountToMinorUnits,
  AccountingDomainError,
  normalizeJournalEntry
} from "./accounting.utils";
import type { AccountingJournalEntry, AccountingJournalEntryLine } from "./accounting.types";
import type { InventoryCogsAccountingInput } from "./inventory-accounting.types";

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
