export type AccountingWorkspaceId = string & { readonly __brand: "AccountingWorkspaceId" };
export type AccountingAccountId = string & { readonly __brand: "AccountingAccountId" };
export type AccountingJournalId = string & { readonly __brand: "AccountingJournalId" };
export type AccountingJournalEntryId = string & { readonly __brand: "AccountingJournalEntryId" };
export type AccountingJournalEntryLineId = string & { readonly __brand: "AccountingJournalEntryLineId" };
export type AccountingPeriodId = string & { readonly __brand: "AccountingPeriodId" };
export type AccountingUserId = string & { readonly __brand: "AccountingUserId" };
export type AccountingTenantCompanyId = string & { readonly __brand: "AccountingTenantCompanyId" };

export type AccountingAmount = string & { readonly __brand: "AccountingAmount" };

export type AccountingAccountType =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense";

export type AccountingNormalBalance = "debit" | "credit";

export type AccountingJournalType =
  | "sales"
  | "purchase"
  | "bank"
  | "cash"
  | "general";

export type AccountingJournalEntryStatus = "draft" | "posted";
export type AccountingPeriodStatus = "open" | "closed";

export type AccountingSourceType =
  | "manual"
  | "accounting.reversal"
  | "accounting.correction"
  | "sales.invoice"
  | "sales.payment"
  | "procurement.supplier-bill"
  | "procurement.supplier-invoice"
  | "inventory.valuation"
  | "inventory.receipt-valuation"
  | "inventory.cogs"
  | (string & {});

export type AccountingAccount = Readonly<{
  id: AccountingAccountId;
  tenantCompanyId: AccountingTenantCompanyId;
  code: string;
  name: string;
  type: AccountingAccountType;
  normalBalance: AccountingNormalBalance;
  parentAccountId?: AccountingAccountId;
  currency?: string;
  active: boolean;
  archivedAt?: string;
  createdBy?: AccountingUserId;
  updatedBy?: AccountingUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type AccountingJournal = Readonly<{
  id: AccountingJournalId;
  tenantCompanyId: AccountingTenantCompanyId;
  code: string;
  name: string;
  type: AccountingJournalType;
  active: boolean;
  archivedAt?: string;
  createdBy?: AccountingUserId;
  updatedBy?: AccountingUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type AccountingJournalEntryLine = Readonly<{
  id: AccountingJournalEntryLineId;
  accountId: AccountingAccountId;
  label: string;
  debitAmount: AccountingAmount;
  creditAmount: AccountingAmount;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type AccountingJournalEntry = Readonly<{
  id: AccountingJournalEntryId;
  tenantCompanyId: AccountingTenantCompanyId;
  workspaceId: AccountingWorkspaceId;
  journalId: AccountingJournalId;
  number: string;
  entryDate: string;
  status: AccountingJournalEntryStatus;
  description?: string;
  reference?: string;
  sourceType?: AccountingSourceType;
  sourceId?: string;
  reversalOfEntryId?: AccountingJournalEntryId;
  reversedByEntryId?: AccountingJournalEntryId;
  correctionReason?: string;
  correctionType?: "reversal" | "correction";
  correctedByEntryId?: AccountingJournalEntryId;
  functionalCurrency: string;
  transactionCurrency?: string;
  exchangeRate?: AccountingAmount;
  debitTotal: AccountingAmount;
  creditTotal: AccountingAmount;
  lines: readonly AccountingJournalEntryLine[];
  postedAt?: string;
  postedBy?: AccountingUserId;
  createdBy?: AccountingUserId;
  updatedBy?: AccountingUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type AccountingPeriod = Readonly<{
  id: AccountingPeriodId;
  tenantCompanyId: AccountingTenantCompanyId;
  name: string;
  startDate: string;
  endDate: string;
  status: AccountingPeriodStatus;
  closedAt?: string;
  closedBy?: AccountingUserId;
  reopenedAt?: string;
  reopenedBy?: AccountingUserId;
  createdBy?: AccountingUserId;
  updatedBy?: AccountingUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type AccountingSnapshot = Readonly<{
  accounts: readonly AccountingAccount[];
  journals: readonly AccountingJournal[];
  journalEntries: readonly AccountingJournalEntry[];
  periods?: readonly AccountingPeriod[];
  commercialPostingSettings?: AccountingCommercialPostingSettings;
  commercialSources?: AccountingCommercialSources;
  apPostingSettings?: AccountingApPostingSettings;
  apSources?: AccountingApSources;
  inventoryPostingSettings?: AccountingInventoryPostingSettings;
  inventorySources?: AccountingInventorySources;
}>;

export type AccountingCommercialPostingSettings = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  salesJournalId?: AccountingJournalId;
  receivableAccountId?: AccountingAccountId;
  revenueAccountId?: AccountingAccountId;
  settlementAccountId?: AccountingAccountId;
  taxPayableAccountId?: AccountingAccountId;
  functionalCurrency: string;
  updatedBy?: AccountingUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type AccountingSourcePostingStatus = Readonly<{
  sourceType: AccountingSourceType;
  sourceId: string;
  journalEntryId?: AccountingJournalEntryId;
  journalEntryNumber?: string;
  status: "not_posted" | "draft" | "posted" | "reversed";
  postedAt?: string;
  reversedAt?: string;
}>;

export type AccountingCommercialSources = Readonly<{
  invoices: readonly AccountingSourcePostingStatus[];
  payments: readonly AccountingSourcePostingStatus[];
}>;

export type AccountingApPostingSettings = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  purchaseJournalId?: AccountingJournalId;
  payableAccountId?: AccountingAccountId;
  expenseAccountId?: AccountingAccountId;
  grniClearingAccountId?: AccountingAccountId;
  settlementAccountId?: AccountingAccountId;
  taxRecoverableAccountId?: AccountingAccountId;
  functionalCurrency: string;
  updatedBy?: AccountingUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type AccountingApSources = Readonly<{
  supplierBills: readonly AccountingSourcePostingStatus[];
}>;

export type AccountingInventoryPostingSettings = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  inventoryJournalId?: AccountingJournalId;
  inventoryAssetAccountId?: AccountingAccountId;
  cogsAccountId?: AccountingAccountId;
  grniClearingAccountId?: AccountingAccountId;
  functionalCurrency: string;
  updatedBy?: AccountingUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type AccountingInventorySources = Readonly<{
  receiptEvents: readonly AccountingSourcePostingStatus[];
  cogsEvents: readonly AccountingSourcePostingStatus[];
}>;

export type AccountingValidationIssue = Readonly<{
  code:
    | "inactive-account"
    | "invalid-account"
    | "invalid-amount"
    | "invalid-currency"
    | "invalid-entry"
    | "invalid-journal"
    | "invalid-line"
    | "invalid-period"
    | "not-balanced"
    | "period-closed"
    | "period-overlap"
    | "posted-entry-locked"
    | "reversal-not-allowed"
    | "tenant-mismatch";
  message: string;
  lineId?: AccountingJournalEntryLineId;
}>;

export type AccountingValidationResult = Readonly<{
  valid: boolean;
  issues: readonly AccountingValidationIssue[];
}>;

export type CreateAccountingAccountInput = Readonly<Omit<AccountingAccount, "id" | "active" | "archivedAt" | "createdAt" | "updatedAt"> & {
  id?: AccountingAccountId;
  active?: boolean;
}>;

export type CreateAccountingJournalInput = Readonly<Omit<AccountingJournal, "id" | "active" | "archivedAt" | "createdAt" | "updatedAt"> & {
  id?: AccountingJournalId;
  active?: boolean;
}>;

export type CreateAccountingJournalEntryInput = Readonly<Omit<AccountingJournalEntry, "id" | "status" | "debitTotal" | "creditTotal" | "postedAt" | "postedBy" | "createdAt" | "updatedAt"> & {
  id?: AccountingJournalEntryId;
  status?: AccountingJournalEntryStatus;
}>;

export type CreateAccountingPeriodInput = Readonly<Omit<AccountingPeriod, "id" | "status" | "closedAt" | "closedBy" | "reopenedAt" | "reopenedBy" | "createdAt" | "updatedAt"> & {
  id?: AccountingPeriodId;
  status?: AccountingPeriodStatus;
}>;
