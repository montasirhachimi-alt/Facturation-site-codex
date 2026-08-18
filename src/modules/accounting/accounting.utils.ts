import { ACCOUNTING_ACCOUNT_TYPES, ACCOUNTING_AMOUNT_SCALE, ACCOUNTING_JOURNAL_ENTRY_STATUSES, ACCOUNTING_JOURNAL_TYPES } from "./accounting.constants";
import type {
  AccountingAccount,
  AccountingAmount,
  AccountingJournal,
  AccountingJournalEntry,
  AccountingJournalEntryLine,
  AccountingUserId,
  AccountingValidationIssue,
  AccountingValidationResult
} from "./accounting.types";

export class AccountingDomainError extends Error {
  readonly issues: readonly AccountingValidationIssue[];

  constructor(message: string, issues: readonly AccountingValidationIssue[]) {
    super(message);
    this.name = "AccountingDomainError";
    this.issues = Object.freeze([...issues]);
  }
}

export function normalizeAccountingAmount(value: string | number | bigint): AccountingAmount {
  const raw = typeof value === "bigint" ? value.toString() : String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error("Montant comptable invalide.");
  }

  const [units, decimals = ""] = raw.split(".");
  return `${Number(units)}.${decimals.padEnd(ACCOUNTING_AMOUNT_SCALE, "0")}` as AccountingAmount;
}

export function zeroAccountingAmount() {
  return "0.00" as AccountingAmount;
}

export function accountingAmountToMinorUnits(amount: string | number | bigint) {
  const normalized = normalizeAccountingAmount(amount);
  const [units, decimals] = normalized.split(".");
  return BigInt(units) * BigInt(100) + BigInt(decimals);
}

export function accountingAmountFromMinorUnits(value: bigint) {
  if (value < BigInt(0)) throw new Error("Montant comptable negatif.");
  const units = value / BigInt(100);
  const decimals = value % BigInt(100);
  return `${units.toString()}.${decimals.toString().padStart(ACCOUNTING_AMOUNT_SCALE, "0")}` as AccountingAmount;
}

export function addAccountingAmounts(values: readonly (string | number | bigint)[]) {
  const total = values.reduce<bigint>((sum, value) => sum + accountingAmountToMinorUnits(value), BigInt(0));
  return accountingAmountFromMinorUnits(total);
}

export function calculateJournalEntryTotals(lines: readonly AccountingJournalEntryLine[]) {
  return Object.freeze({
    debitTotal: addAccountingAmounts(lines.map((line) => line.debitAmount)),
    creditTotal: addAccountingAmounts(lines.map((line) => line.creditAmount))
  });
}

export function isJournalEntryBalanced(entry: Pick<AccountingJournalEntry, "lines">) {
  const totals = calculateJournalEntryTotals(entry.lines);
  return accountingAmountToMinorUnits(totals.debitTotal) === accountingAmountToMinorUnits(totals.creditTotal);
}

export function normalizeJournalEntry(entry: AccountingJournalEntry) {
  const lines = Object.freeze(entry.lines.map((line) => normalizeJournalEntryLine(line)));
  const totals = calculateJournalEntryTotals(lines);
  return Object.freeze({
    ...entry,
    functionalCurrency: normalizeCurrency(entry.functionalCurrency),
    transactionCurrency: entry.transactionCurrency ? normalizeCurrency(entry.transactionCurrency) : undefined,
    exchangeRate: entry.exchangeRate ? normalizeAccountingAmount(entry.exchangeRate) : undefined,
    debitTotal: totals.debitTotal,
    creditTotal: totals.creditTotal,
    lines
  });
}

export function normalizeJournalEntryLine(line: AccountingJournalEntryLine) {
  return Object.freeze({
    ...line,
    label: line.label.trim(),
    debitAmount: normalizeAccountingAmount(line.debitAmount),
    creditAmount: normalizeAccountingAmount(line.creditAmount)
  });
}

export function validateAccount(account: AccountingAccount): AccountingValidationResult {
  const issues: AccountingValidationIssue[] = [];
  if (!account.id || !account.tenantCompanyId || !account.code.trim() || !account.name.trim()) {
    issues.push({ code: "invalid-account", message: "Compte comptable invalide: identifiant, code, nom et entreprise sont requis." });
  }
  if (!ACCOUNTING_ACCOUNT_TYPES.includes(account.type)) {
    issues.push({ code: "invalid-account", message: "Type de compte comptable invalide." });
  }
  if (account.normalBalance !== "debit" && account.normalBalance !== "credit") {
    issues.push({ code: "invalid-account", message: "Sens normal du compte invalide." });
  }
  if (account.currency) validateCurrency(account.currency, issues);
  return freezeValidation(issues);
}

export function validateJournal(journal: AccountingJournal): AccountingValidationResult {
  const issues: AccountingValidationIssue[] = [];
  if (!journal.id || !journal.tenantCompanyId || !journal.code.trim() || !journal.name.trim()) {
    issues.push({ code: "invalid-journal", message: "Journal comptable invalide: identifiant, code, nom et entreprise sont requis." });
  }
  if (!ACCOUNTING_JOURNAL_TYPES.includes(journal.type)) {
    issues.push({ code: "invalid-journal", message: "Type de journal comptable invalide." });
  }
  return freezeValidation(issues);
}

export function validateJournalEntry(
  entry: AccountingJournalEntry,
  context: { accounts?: readonly AccountingAccount[]; journals?: readonly AccountingJournal[]; requireBalanced?: boolean } = {}
): AccountingValidationResult {
  const normalized = normalizeJournalEntry(entry);
  const issues: AccountingValidationIssue[] = [];
  const accounts = new Map((context.accounts ?? []).map((account) => [account.id, account]));
  const journals = new Map((context.journals ?? []).map((journal) => [journal.id, journal]));
  const journal = journals.get(normalized.journalId);

  if (!normalized.id || !normalized.tenantCompanyId || !normalized.workspaceId || !normalized.number.trim()) {
    issues.push({ code: "invalid-entry", message: "Ecriture comptable invalide: identifiant, numero, espace et entreprise sont requis." });
  }
  if (!ACCOUNTING_JOURNAL_ENTRY_STATUSES.includes(normalized.status)) {
    issues.push({ code: "invalid-entry", message: "Statut d'ecriture comptable invalide." });
  }
  validateCurrency(normalized.functionalCurrency, issues);
  if (normalized.transactionCurrency) validateCurrency(normalized.transactionCurrency, issues);

  if (context.journals && !journal) issues.push({ code: "invalid-journal", message: "Journal comptable introuvable." });
  if (journal && journal.tenantCompanyId !== normalized.tenantCompanyId) {
    issues.push({ code: "tenant-mismatch", message: "Le journal appartient a une autre entreprise." });
  }
  if (journal && !journal.active) issues.push({ code: "invalid-journal", message: "Le journal comptable est inactif." });

  if (normalized.lines.length < 2 && (context.requireBalanced || normalized.status === "posted")) {
    issues.push({ code: "invalid-entry", message: "Une ecriture postee doit contenir au moins deux lignes." });
  }

  normalized.lines.forEach((line) => {
    const account = accounts.get(line.accountId);
    const debit = accountingAmountToMinorUnits(line.debitAmount);
    const credit = accountingAmountToMinorUnits(line.creditAmount);
    if (!line.id || !line.accountId || !line.label.trim()) {
      issues.push({ code: "invalid-line", message: "Ligne comptable invalide: compte, libelle et identifiant sont requis.", lineId: line.id });
    }
    if (debit === BigInt(0) && credit === BigInt(0)) {
      issues.push({ code: "invalid-amount", message: "Une ligne comptable doit porter un debit ou un credit.", lineId: line.id });
    }
    if (debit > BigInt(0) && credit > BigInt(0)) {
      issues.push({ code: "invalid-amount", message: "Une ligne comptable ne peut pas etre debit et credit a la fois.", lineId: line.id });
    }
    if (context.accounts && !account) {
      issues.push({ code: "invalid-account", message: "Compte comptable introuvable.", lineId: line.id });
    }
    if (account && account.tenantCompanyId !== normalized.tenantCompanyId) {
      issues.push({ code: "tenant-mismatch", message: "Une ligne reference un compte d'une autre entreprise.", lineId: line.id });
    }
    if (account && !account.active) {
      issues.push({ code: "inactive-account", message: "Une ligne reference un compte inactif.", lineId: line.id });
    }
  });

  if ((context.requireBalanced || normalized.status === "posted") && !isJournalEntryBalanced(normalized)) {
    issues.push({ code: "not-balanced", message: "Une ecriture postee doit etre equilibree: total debit = total credit." });
  }

  return freezeValidation(issues);
}

export function assertCanUpdateJournalEntry(existing: AccountingJournalEntry) {
  if (existing.status === "posted") {
    throw new AccountingDomainError("Une ecriture comptable postee ne peut pas etre modifiee silencieusement.", [
      { code: "posted-entry-locked", message: "Une ecriture postee doit etre corrigee par une future ecriture de correction ou de contrepassation." }
    ]);
  }
}

export function postJournalEntry(entry: AccountingJournalEntry, context: { accounts?: readonly AccountingAccount[]; journals?: readonly AccountingJournal[]; postedBy?: string; now?: () => string } = {}) {
  const normalized = normalizeJournalEntry(entry);
  if (normalized.status === "posted") return normalized;

  const validation = validateJournalEntry(normalized, { accounts: context.accounts, journals: context.journals, requireBalanced: true });
  if (!validation.valid) {
    throw new AccountingDomainError("L'ecriture comptable ne peut pas etre postee.", validation.issues);
  }

  const now = context.now?.() ?? new Date().toISOString();
  return Object.freeze({
    ...normalized,
    status: "posted" as const,
    postedAt: now,
    postedBy: context.postedBy as AccountingUserId | undefined,
    updatedAt: now
  });
}

function normalizeCurrency(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Devise invalide.");
  return normalized;
}

function validateCurrency(value: string, issues: AccountingValidationIssue[]) {
  try {
    normalizeCurrency(value);
  } catch {
    issues.push({ code: "invalid-currency", message: "Devise comptable invalide. Utilisez un code ISO a trois lettres." });
  }
}

function freezeValidation(issues: AccountingValidationIssue[]): AccountingValidationResult {
  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues) });
}
