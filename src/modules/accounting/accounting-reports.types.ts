import type {
  AccountingAccount,
  AccountingAccountId,
  AccountingAmount,
  AccountingJournalId,
  AccountingJournalEntryId,
  AccountingJournalEntryLineId,
  AccountingJournalType,
  AccountingSourceType,
  AccountingTenantCompanyId
} from "./accounting.types";

export type AccountingReportDateScope = Readonly<{
  fromDate?: string;
  toDate?: string;
}>;

export type AccountingReportQuery = AccountingReportDateScope & Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  accountIds?: readonly AccountingAccountId[];
  journalIds?: readonly AccountingJournalId[];
}>;

export type AccountingBalanceSide = "debit" | "credit" | "zero";

export type AccountingBalanceColumns = Readonly<{
  debitAmount: AccountingAmount;
  creditAmount: AccountingAmount;
  balanceAmount: AccountingAmount;
  balanceSide: AccountingBalanceSide;
}>;

export type GeneralLedgerMovement = Readonly<{
  accountId: AccountingAccountId;
  accountCode: string;
  accountName: string;
  journalId: AccountingJournalId;
  journalCode: string;
  journalName: string;
  journalType: AccountingJournalType;
  journalEntryId: AccountingJournalEntryId;
  journalEntryLineId: AccountingJournalEntryLineId;
  entryNumber: string;
  entryDate: string;
  postedAt?: string;
  description?: string;
  reference?: string;
  sourceType?: AccountingSourceType;
  sourceId?: string;
  label: string;
  functionalCurrency: string;
  debitAmount: AccountingAmount;
  creditAmount: AccountingAmount;
  runningBalance: AccountingAmount;
  runningBalanceSide: AccountingBalanceSide;
}>;

export type GeneralLedgerAccount = Readonly<{
  account: AccountingAccount;
  functionalCurrency: string;
  opening: AccountingBalanceColumns;
  periodDebit: AccountingAmount;
  periodCredit: AccountingAmount;
  closing: AccountingBalanceColumns;
  movements: readonly GeneralLedgerMovement[];
}>;

export type GeneralLedgerReport = AccountingReportDateScope & Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  accounts: readonly GeneralLedgerAccount[];
  periodDebitTotal: AccountingAmount;
  periodCreditTotal: AccountingAmount;
  generatedAt: string;
}>;

export type TrialBalanceRow = Readonly<{
  account: AccountingAccount;
  functionalCurrency: string;
  opening: AccountingBalanceColumns;
  periodDebit: AccountingAmount;
  periodCredit: AccountingAmount;
  closing: AccountingBalanceColumns;
}>;

export type TrialBalanceReport = AccountingReportDateScope & Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  rows: readonly TrialBalanceRow[];
  periodDebitTotal: AccountingAmount;
  periodCreditTotal: AccountingAmount;
  closingDebitTotal: AccountingAmount;
  closingCreditTotal: AccountingAmount;
  balanced: boolean;
  generatedAt: string;
}>;

export type ProfitLossAccountRow = Readonly<{
  account: AccountingAccount;
  functionalCurrency: string;
  debitAmount: AccountingAmount;
  creditAmount: AccountingAmount;
  amount: AccountingAmount;
  movementCount: number;
}>;

export type ProfitLossSection = Readonly<{
  label: string;
  accountType: "income" | "expense";
  rows: readonly ProfitLossAccountRow[];
  total: AccountingAmount;
}>;

export type ProfitLossReport = AccountingReportDateScope & Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  functionalCurrency: string;
  revenue: ProfitLossSection;
  expenses: ProfitLossSection;
  netResult: AccountingAmount;
  netResultSide: "profit" | "loss" | "break_even";
  generatedAt: string;
}>;

export type BalanceSheetAccountRow = Readonly<{
  account: AccountingAccount;
  functionalCurrency: string;
  debitAmount: AccountingAmount;
  creditAmount: AccountingAmount;
  amount: AccountingAmount;
  balanceSide: AccountingBalanceSide;
}>;

export type BalanceSheetSection = Readonly<{
  label: string;
  accountType: "asset" | "liability" | "equity";
  rows: readonly BalanceSheetAccountRow[];
  total: AccountingAmount;
}>;

export type BalanceSheetReport = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  asOfDate?: string;
  periodStartDate?: string;
  functionalCurrency: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  currentPeriodResult: AccountingAmount;
  currentPeriodResultSide: "profit" | "loss" | "break_even";
  totalAssets: AccountingAmount;
  totalLiabilitiesAndEquity: AccountingAmount;
  reconciliationDifference: AccountingAmount;
  reconciled: boolean;
  formula: "assets = liabilities + equity + currentPeriodResult";
  generatedAt: string;
}>;
