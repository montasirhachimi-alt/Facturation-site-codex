import { ACCOUNTING_WORKSPACE_ID, DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY } from "./accounting.constants";
import type {
  AccountingAccount,
  AccountingAccountId,
  AccountingJournal,
  AccountingJournalEntry,
  AccountingJournalEntryId,
  AccountingJournalId,
  CreateAccountingAccountInput,
  CreateAccountingJournalEntryInput,
  CreateAccountingJournalInput
} from "./accounting.types";
import {
  AccountingDomainError,
  assertCanUpdateJournalEntry,
  normalizeJournalEntry,
  postJournalEntry,
  validateAccount,
  validateJournal,
  validateJournalEntry
} from "./accounting.utils";

export class AccountingService {
  private readonly accounts = new Map<AccountingAccountId, AccountingAccount>();
  private readonly journals = new Map<AccountingJournalId, AccountingJournal>();
  private readonly entries = new Map<AccountingJournalEntryId, AccountingJournalEntry>();
  private readonly now: () => string;

  constructor(options: { accounts?: readonly AccountingAccount[]; journals?: readonly AccountingJournal[]; journalEntries?: readonly AccountingJournalEntry[]; now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    options.accounts?.forEach((account) => this.accounts.set(account.id, freezeAccount(account)));
    options.journals?.forEach((journal) => this.journals.set(journal.id, freezeJournal(journal)));
    options.journalEntries?.forEach((entry) => this.entries.set(entry.id, freezeEntry(normalizeJournalEntry(entry))));
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
      postedBy,
      now: this.now
    });
    this.entries.set(posted.id, freezeEntry(posted));
    return posted;
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
