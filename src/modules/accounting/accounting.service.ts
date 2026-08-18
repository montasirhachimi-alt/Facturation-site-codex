import { ACCOUNTING_WORKSPACE_ID, DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY } from "./accounting.constants";
import type {
  AccountingAccount,
  AccountingAccountId,
  AccountingJournal,
  AccountingJournalEntry,
  AccountingJournalEntryId,
  AccountingJournalId,
  AccountingPeriod,
  AccountingPeriodId,
  CreateAccountingAccountInput,
  CreateAccountingJournalEntryInput,
  CreateAccountingJournalInput,
  CreateAccountingPeriodInput
} from "./accounting.types";
import {
  AccountingDomainError,
  assertCanUpdateJournalEntry,
  assertPostingDateIsOpen,
  createReversalJournalEntry,
  normalizeJournalEntry,
  postJournalEntry,
  validateAccount,
  validateJournal,
  validateJournalEntry,
  validateAccountingPeriod
} from "./accounting.utils";

export class AccountingService {
  private readonly accounts = new Map<AccountingAccountId, AccountingAccount>();
  private readonly journals = new Map<AccountingJournalId, AccountingJournal>();
  private readonly entries = new Map<AccountingJournalEntryId, AccountingJournalEntry>();
  private readonly periods = new Map<AccountingPeriodId, AccountingPeriod>();
  private readonly now: () => string;

  constructor(options: { accounts?: readonly AccountingAccount[]; journals?: readonly AccountingJournal[]; journalEntries?: readonly AccountingJournalEntry[]; periods?: readonly AccountingPeriod[]; now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    options.accounts?.forEach((account) => this.accounts.set(account.id, freezeAccount(account)));
    options.journals?.forEach((journal) => this.journals.set(journal.id, freezeJournal(journal)));
    options.journalEntries?.forEach((entry) => this.entries.set(entry.id, freezeEntry(normalizeJournalEntry(entry))));
    options.periods?.forEach((period) => this.periods.set(period.id, freezePeriod(period)));
  }

  listAccounts(tenantCompanyId?: string) {
    const accounts = [...this.accounts.values()]
      .filter((account) => !tenantCompanyId || account.tenantCompanyId === tenantCompanyId)
      .sort((left, right) => left.code.localeCompare(right.code, "fr"));
    return Object.freeze(accounts);
  }

  listJournals(tenantCompanyId?: string) {
    const journals = [...this.journals.values()]
      .filter((journal) => !tenantCompanyId || journal.tenantCompanyId === tenantCompanyId)
      .sort((left, right) => left.code.localeCompare(right.code, "fr"));
    return Object.freeze(journals);
  }

  listJournalEntries(tenantCompanyId?: string) {
    const entries = [...this.entries.values()]
      .filter((entry) => !tenantCompanyId || entry.tenantCompanyId === tenantCompanyId)
      .sort((left, right) => right.entryDate.localeCompare(left.entryDate));
    return Object.freeze(entries);
  }

  listPeriods(tenantCompanyId?: string) {
    const periods = [...this.periods.values()]
      .filter((period) => !tenantCompanyId || period.tenantCompanyId === tenantCompanyId)
      .sort((left, right) => left.startDate.localeCompare(right.startDate));
    return Object.freeze(periods);
  }

  getJournalEntry(id: AccountingJournalEntryId) {
    return this.entries.get(id);
  }

  createAccount(input: CreateAccountingAccountInput) {
    const timestamp = this.now();
    const account = freezeAccount({
      ...input,
      id: input.id ?? (`account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as AccountingAccountId),
      code: input.code.trim(),
      name: input.name.trim(),
      active: input.active ?? true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    const validation = validateAccount(account);
    if (!validation.valid) throw new AccountingDomainError("Compte comptable invalide.", validation.issues);
    this.accounts.set(account.id, account);
    return account;
  }

  createJournal(input: CreateAccountingJournalInput) {
    const timestamp = this.now();
    const journal = freezeJournal({
      ...input,
      id: input.id ?? (`journal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as AccountingJournalId),
      code: input.code.trim(),
      name: input.name.trim(),
      active: input.active ?? true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    const validation = validateJournal(journal);
    if (!validation.valid) throw new AccountingDomainError("Journal comptable invalide.", validation.issues);
    this.journals.set(journal.id, journal);
    return journal;
  }

  createPeriod(input: CreateAccountingPeriodInput) {
    const timestamp = this.now();
    const period = freezePeriod({
      ...input,
      id: input.id ?? (`period-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as AccountingPeriodId),
      name: input.name.trim(),
      status: input.status ?? "open",
      createdAt: timestamp,
      updatedAt: timestamp
    });
    const validation = validateAccountingPeriod(period, this.listPeriods(period.tenantCompanyId));
    if (!validation.valid) throw new AccountingDomainError("Periode comptable invalide.", validation.issues);
    this.periods.set(period.id, period);
    return period;
  }

  closePeriod(id: AccountingPeriodId, closedBy?: string) {
    const existing = this.periods.get(id);
    if (!existing) throw new AccountingDomainError("Periode comptable introuvable.", [{ code: "invalid-period", message: "Periode comptable introuvable." }]);
    const timestamp = this.now();
    const period = freezePeriod({
      ...existing,
      status: "closed",
      closedAt: timestamp,
      closedBy: closedBy as AccountingPeriod["closedBy"],
      updatedBy: closedBy as AccountingPeriod["updatedBy"],
      updatedAt: timestamp
    });
    this.periods.set(id, period);
    return period;
  }

  reopenPeriod(id: AccountingPeriodId, reopenedBy?: string) {
    const existing = this.periods.get(id);
    if (!existing) throw new AccountingDomainError("Periode comptable introuvable.", [{ code: "invalid-period", message: "Periode comptable introuvable." }]);
    const timestamp = this.now();
    const period = freezePeriod({
      ...existing,
      status: "open",
      reopenedAt: timestamp,
      reopenedBy: reopenedBy as AccountingPeriod["reopenedBy"],
      updatedBy: reopenedBy as AccountingPeriod["updatedBy"],
      updatedAt: timestamp
    });
    this.periods.set(id, period);
    return period;
  }

  createDraftEntry(input: CreateAccountingJournalEntryInput) {
    const timestamp = this.now();
    const entry = normalizeJournalEntry({
      ...input,
      id: input.id ?? (`entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as AccountingJournalEntryId),
      workspaceId: input.workspaceId ?? ACCOUNTING_WORKSPACE_ID,
      status: input.status ?? "draft",
      sourceType: input.sourceType ?? "manual",
      functionalCurrency: input.functionalCurrency || DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY,
      debitTotal: "0.00" as never,
      creditTotal: "0.00" as never,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    const validation = validateJournalEntry(entry, {
      accounts: this.listAccounts(),
      journals: this.listJournals(),
      requireBalanced: entry.status === "posted"
    });
    if (!validation.valid) throw new AccountingDomainError("Ecriture comptable invalide.", validation.issues);
    this.entries.set(entry.id, freezeEntry(entry));
    return entry;
  }

  updateDraftEntry(entry: AccountingJournalEntry) {
    const existing = this.entries.get(entry.id);
    if (existing) assertCanUpdateJournalEntry(existing);
    const normalized = normalizeJournalEntry({ ...entry, status: "draft", updatedAt: this.now() });
    const validation = validateJournalEntry(normalized, {
      accounts: this.listAccounts(),
      journals: this.listJournals()
    });
    if (!validation.valid) throw new AccountingDomainError("Ecriture comptable invalide.", validation.issues);
    this.entries.set(normalized.id, freezeEntry(normalized));
    return normalized;
  }

  postEntry(id: AccountingJournalEntryId, postedBy?: string) {
    const existing = this.entries.get(id);
    if (!existing) throw new AccountingDomainError("Ecriture comptable introuvable.", [{ code: "invalid-entry", message: "Ecriture comptable introuvable." }]);
    const posted = postJournalEntry(existing, {
      accounts: this.listAccounts(),
      journals: this.listJournals(),
      periods: this.listPeriods(existing.tenantCompanyId),
      postedBy,
      now: this.now
    });
    this.entries.set(posted.id, freezeEntry(posted));
    return posted;
  }

  reverseEntry(id: AccountingJournalEntryId, input: { reversalDate: string; reason: string; userId?: string }) {
    const existing = this.entries.get(id);
    if (!existing) throw new AccountingDomainError("Ecriture comptable introuvable.", [{ code: "invalid-entry", message: "Ecriture comptable introuvable." }]);
    if ([...this.entries.values()].some((entry) => entry.reversalOfEntryId === id || (entry.sourceType === "accounting.reversal" && entry.sourceId === id))) {
      throw new AccountingDomainError("Cette ecriture a deja ete contrepassee.", [{ code: "reversal-not-allowed", message: "Une seule contrepassation canonique est autorisee en V1." }]);
    }
    assertPostingDateIsOpen(input.reversalDate, this.listPeriods(existing.tenantCompanyId));
    const reversal = createReversalJournalEntry(existing, {
      id: `reversal-${id}`,
      number: `${existing.number}-REV`,
      reversalDate: input.reversalDate,
      reason: input.reason,
      createdBy: input.userId,
      now: this.now
    });
    const original = freezeEntry({ ...existing, reversedByEntryId: reversal.id, updatedAt: this.now() });
    this.entries.set(original.id, original);
    this.entries.set(reversal.id, freezeEntry(reversal));
    return reversal;
  }
}

function freezeAccount(account: AccountingAccount) {
  return Object.freeze({ ...account });
}

function freezeJournal(journal: AccountingJournal) {
  return Object.freeze({ ...journal });
}

function freezeEntry(entry: AccountingJournalEntry) {
  return Object.freeze({
    ...entry,
    lines: Object.freeze(entry.lines.map((line) => Object.freeze({ ...line })))
  });
}

function freezePeriod(period: AccountingPeriod) {
  return Object.freeze({ ...period });
}
