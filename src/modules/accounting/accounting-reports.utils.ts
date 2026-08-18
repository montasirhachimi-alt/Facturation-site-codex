import type {
  AccountingAccount,
  AccountingAmount,
  AccountingJournal,
  AccountingJournalEntry
} from "./accounting.types";
import {
  accountingAmountFromMinorUnits,
  accountingAmountToMinorUnits,
  zeroAccountingAmount
} from "./accounting.utils";
import type {
  AccountingBalanceColumns,
  AccountingReportQuery,
  BalanceSheetReport,
  BalanceSheetSection,
  GeneralLedgerAccount,
  GeneralLedgerMovement,
  GeneralLedgerReport,
  ProfitLossReport,
  ProfitLossSection,
  TrialBalanceReport
} from "./accounting-reports.types";

type MovementCandidate = Readonly<{
  account: AccountingAccount;
  entry: AccountingJournalEntry;
  journal: AccountingJournal;
  line: AccountingJournalEntry["lines"][number];
  debitMinor: bigint;
  creditMinor: bigint;
}>;

export function createGeneralLedgerReport(input: {
  accounts: readonly AccountingAccount[];
  journals: readonly AccountingJournal[];
  journalEntries: readonly AccountingJournalEntry[];
  query: AccountingReportQuery;
  now?: () => string;
}): GeneralLedgerReport {
  const accountIds = new Set(input.query.accountIds ?? []);
  const journalIds = new Set(input.query.journalIds ?? []);
  const accounts = input.accounts
    .filter((account) => account.tenantCompanyId === input.query.tenantCompanyId)
    .filter((account) => accountIds.size === 0 || accountIds.has(account.id))
    .sort((left, right) => left.code.localeCompare(right.code, "fr"));
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const journals = input.journals.filter((journal) => journal.tenantCompanyId === input.query.tenantCompanyId);
  const journalById = new Map(journals.map((journal) => [journal.id, journal]));
  const scope = normalizeReportDateScope(input.query);
  const buckets = new Map<string, {
    account: AccountingAccount;
    currency?: string;
    openingDebitMinor: bigint;
    openingCreditMinor: bigint;
    periodDebitMinor: bigint;
    periodCreditMinor: bigint;
    periodMovements: MovementCandidate[];
  }>();

  for (const account of accounts) {
    buckets.set(account.id, {
      account,
      openingDebitMinor: BigInt(0),
      openingCreditMinor: BigInt(0),
      periodDebitMinor: BigInt(0),
      periodCreditMinor: BigInt(0),
      periodMovements: []
    });
  }

  const postedEntries = input.journalEntries
    .filter((entry) => entry.tenantCompanyId === input.query.tenantCompanyId && entry.status === "posted")
    .filter((entry) => journalIds.size === 0 || journalIds.has(entry.journalId))
    .sort(compareEntries);

  for (const entry of postedEntries) {
    const journal = journalById.get(entry.journalId);
    if (!journal) continue;
    const placement = getEntryDatePlacement(entry.entryDate, scope);
    if (placement === "after") continue;

    for (const line of entry.lines) {
      const account = accountById.get(line.accountId);
      if (!account) continue;
      const bucket = buckets.get(account.id);
      if (!bucket) continue;
      const debitMinor = accountingAmountToMinorUnits(line.debitAmount);
      const creditMinor = accountingAmountToMinorUnits(line.creditAmount);
      bucket.currency ??= entry.functionalCurrency;

      if (placement === "opening") {
        bucket.openingDebitMinor += debitMinor;
        bucket.openingCreditMinor += creditMinor;
      } else {
        bucket.periodDebitMinor += debitMinor;
        bucket.periodCreditMinor += creditMinor;
        bucket.periodMovements.push(Object.freeze({ account, entry, journal, line, debitMinor, creditMinor }));
      }
    }
  }

  const ledgerAccounts = Object.freeze([...buckets.values()].map((bucket) => buildLedgerAccount(bucket)));
  const periodDebitTotal = sumAmounts(ledgerAccounts.map((account) => account.periodDebit));
  const periodCreditTotal = sumAmounts(ledgerAccounts.map((account) => account.periodCredit));

  return Object.freeze({
    tenantCompanyId: input.query.tenantCompanyId,
    fromDate: input.query.fromDate,
    toDate: input.query.toDate,
    accounts: ledgerAccounts,
    periodDebitTotal,
    periodCreditTotal,
    generatedAt: input.now?.() ?? new Date().toISOString()
  });
}

export function createTrialBalanceReport(input: {
  accounts: readonly AccountingAccount[];
  journals: readonly AccountingJournal[];
  journalEntries: readonly AccountingJournalEntry[];
  query: AccountingReportQuery;
  now?: () => string;
}): TrialBalanceReport {
  const ledger = createGeneralLedgerReport(input);
  const rows = Object.freeze(ledger.accounts.map((account) => Object.freeze({
    account: account.account,
    functionalCurrency: account.functionalCurrency,
    opening: account.opening,
    periodDebit: account.periodDebit,
    periodCredit: account.periodCredit,
    closing: account.closing
  })));
  const closingDebitTotal = sumAmounts(rows.map((row) => row.closing.debitAmount));
  const closingCreditTotal = sumAmounts(rows.map((row) => row.closing.creditAmount));

  return Object.freeze({
    tenantCompanyId: ledger.tenantCompanyId,
    fromDate: ledger.fromDate,
    toDate: ledger.toDate,
    rows,
    periodDebitTotal: ledger.periodDebitTotal,
    periodCreditTotal: ledger.periodCreditTotal,
    closingDebitTotal,
    closingCreditTotal,
    balanced: accountingAmountToMinorUnits(ledger.periodDebitTotal) === accountingAmountToMinorUnits(ledger.periodCreditTotal)
      && accountingAmountToMinorUnits(closingDebitTotal) === accountingAmountToMinorUnits(closingCreditTotal),
    generatedAt: ledger.generatedAt
  });
}

export function createProfitLossReport(input: {
  accounts: readonly AccountingAccount[];
  journals: readonly AccountingJournal[];
  journalEntries: readonly AccountingJournalEntry[];
  query: AccountingReportQuery;
  now?: () => string;
}): ProfitLossReport {
  const ledger = createGeneralLedgerReport(input);
  const revenue = createProfitLossSection("Produits", "income", ledger.accounts);
  const expenses = createProfitLossSection("Charges", "expense", ledger.accounts);
  const revenueMinor = accountingAmountToMinorUnits(revenue.total);
  const expenseMinor = accountingAmountToMinorUnits(expenses.total);
  const netMinor = revenueMinor - expenseMinor;

  return Object.freeze({
    tenantCompanyId: ledger.tenantCompanyId,
    fromDate: ledger.fromDate,
    toDate: ledger.toDate,
    functionalCurrency: resolveReportCurrency(ledger.accounts),
    revenue,
    expenses,
    netResult: accountingAmountFromMinorUnits(absMinor(netMinor)),
    netResultSide: netMinor > BigInt(0) ? "profit" : netMinor < BigInt(0) ? "loss" : "break_even",
    generatedAt: ledger.generatedAt
  });
}

export function createBalanceSheetReport(input: {
  accounts: readonly AccountingAccount[];
  journals: readonly AccountingJournal[];
  journalEntries: readonly AccountingJournalEntry[];
  query: Omit<AccountingReportQuery, "toDate"> & { asOfDate?: string; toDate?: string };
  now?: () => string;
}): BalanceSheetReport {
  const asOfDate = input.query.asOfDate ?? input.query.toDate;
  const ledger = createGeneralLedgerReport({
    ...input,
    query: {
      ...input.query,
      fromDate: undefined,
      toDate: asOfDate
    }
  });
  const profitLoss = createProfitLossReport({
    ...input,
    query: {
      ...input.query,
      fromDate: input.query.fromDate,
      toDate: asOfDate
    }
  });
  const assets = createBalanceSheetSection("Actif", "asset", ledger.accounts);
  const liabilities = createBalanceSheetSection("Dettes", "liability", ledger.accounts);
  const equity = createBalanceSheetSection("Capitaux propres", "equity", ledger.accounts);
  const currentResultMinor = signedProfitLossMinor(profitLoss);
  const totalAssetsMinor = accountingAmountToMinorUnits(assets.total);
  const totalLiabilityEquityMinor = accountingAmountToMinorUnits(liabilities.total)
    + accountingAmountToMinorUnits(equity.total)
    + currentResultMinor;
  const differenceMinor = totalAssetsMinor - totalLiabilityEquityMinor;

  return Object.freeze({
    tenantCompanyId: ledger.tenantCompanyId,
    asOfDate,
    periodStartDate: input.query.fromDate,
    functionalCurrency: resolveReportCurrency(ledger.accounts),
    assets,
    liabilities,
    equity,
    currentPeriodResult: accountingAmountFromMinorUnits(absMinor(currentResultMinor)),
    currentPeriodResultSide: currentResultMinor > BigInt(0) ? "profit" : currentResultMinor < BigInt(0) ? "loss" : "break_even",
    totalAssets: assets.total,
    totalLiabilitiesAndEquity: accountingAmountFromMinorUnits(absMinor(totalLiabilityEquityMinor)),
    reconciliationDifference: accountingAmountFromMinorUnits(absMinor(differenceMinor)),
    reconciled: differenceMinor === BigInt(0),
    formula: "assets = liabilities + equity + currentPeriodResult",
    generatedAt: ledger.generatedAt
  });
}

function buildLedgerAccount(bucket: {
  account: AccountingAccount;
  currency?: string;
  openingDebitMinor: bigint;
  openingCreditMinor: bigint;
  periodDebitMinor: bigint;
  periodCreditMinor: bigint;
  periodMovements: MovementCandidate[];
}): GeneralLedgerAccount {
  let runningNetMinor = bucket.openingDebitMinor - bucket.openingCreditMinor;
  const movements = Object.freeze(bucket.periodMovements
    .sort(compareMovementCandidates)
    .map((movement): GeneralLedgerMovement => {
      runningNetMinor += movement.debitMinor - movement.creditMinor;
      const running = toBalanceColumns(runningNetMinor);
      return Object.freeze({
        accountId: movement.account.id,
        accountCode: movement.account.code,
        accountName: movement.account.name,
        journalId: movement.journal.id,
        journalCode: movement.journal.code,
        journalName: movement.journal.name,
        journalType: movement.journal.type,
        journalEntryId: movement.entry.id,
        journalEntryLineId: movement.line.id,
        entryNumber: movement.entry.number,
        entryDate: movement.entry.entryDate,
        postedAt: movement.entry.postedAt,
        description: movement.entry.description,
        reference: movement.entry.reference,
        sourceType: movement.entry.sourceType,
        sourceId: movement.entry.sourceId,
        label: movement.line.label,
        functionalCurrency: movement.entry.functionalCurrency,
        debitAmount: movement.line.debitAmount,
        creditAmount: movement.line.creditAmount,
        runningBalance: running.balanceAmount,
        runningBalanceSide: running.balanceSide
      });
    }));
  const closingNetMinor = bucket.openingDebitMinor - bucket.openingCreditMinor + bucket.periodDebitMinor - bucket.periodCreditMinor;

  return Object.freeze({
    account: bucket.account,
    functionalCurrency: bucket.currency ?? bucket.account.currency ?? "MAD",
    opening: toBalanceColumns(bucket.openingDebitMinor - bucket.openingCreditMinor),
    periodDebit: accountingAmountFromMinorUnits(bucket.periodDebitMinor),
    periodCredit: accountingAmountFromMinorUnits(bucket.periodCreditMinor),
    closing: toBalanceColumns(closingNetMinor),
    movements
  });
}

function createProfitLossSection(label: string, accountType: "income" | "expense", accounts: readonly GeneralLedgerAccount[]): ProfitLossSection {
  const rows = Object.freeze(accounts
    .filter((account) => account.account.type === accountType)
    .map((account) => {
      const debitMinor = accountingAmountToMinorUnits(account.periodDebit);
      const creditMinor = accountingAmountToMinorUnits(account.periodCredit);
      const amountMinor = accountType === "income" ? creditMinor - debitMinor : debitMinor - creditMinor;
      return Object.freeze({
        account: account.account,
        functionalCurrency: account.functionalCurrency,
        debitAmount: account.periodDebit,
        creditAmount: account.periodCredit,
        amount: accountingAmountFromMinorUnits(absMinor(amountMinor)),
        movementCount: account.movements.length
      });
    })
    .filter((row) => accountingAmountToMinorUnits(row.amount) > BigInt(0))
    .sort(compareStatementAccountRows));
  return Object.freeze({
    label,
    accountType,
    rows,
    total: accountingAmountFromMinorUnits(rows.reduce((sum, row) => sum + accountingAmountToMinorUnits(row.amount), BigInt(0)))
  });
}

function createBalanceSheetSection(label: string, accountType: "asset" | "liability" | "equity", accounts: readonly GeneralLedgerAccount[]): BalanceSheetSection {
  const rows = Object.freeze(accounts
    .filter((account) => account.account.type === accountType)
    .map((account) => {
      const signedMinor = accountingAmountToMinorUnits(account.closing.debitAmount) - accountingAmountToMinorUnits(account.closing.creditAmount);
      const amountMinor = accountType === "asset" ? signedMinor : -signedMinor;
      return Object.freeze({
        account: account.account,
        functionalCurrency: account.functionalCurrency,
        debitAmount: account.closing.debitAmount,
        creditAmount: account.closing.creditAmount,
        amount: accountingAmountFromMinorUnits(absMinor(amountMinor)),
        balanceSide: account.closing.balanceSide
      });
    })
    .filter((row) => accountingAmountToMinorUnits(row.amount) > BigInt(0))
    .sort(compareStatementAccountRows));
  return Object.freeze({
    label,
    accountType,
    rows,
    total: accountingAmountFromMinorUnits(rows.reduce((sum, row) => sum + accountingAmountToMinorUnits(row.amount), BigInt(0)))
  });
}

function signedProfitLossMinor(report: ProfitLossReport) {
  const revenue = accountingAmountToMinorUnits(report.revenue.total);
  const expenses = accountingAmountToMinorUnits(report.expenses.total);
  return revenue - expenses;
}

function absMinor(value: bigint) {
  return value < BigInt(0) ? -value : value;
}

function resolveReportCurrency(accounts: readonly GeneralLedgerAccount[]) {
  return accounts.find((account) => account.functionalCurrency)?.functionalCurrency ?? "MAD";
}

function compareStatementAccountRows(
  left: { account: AccountingAccount },
  right: { account: AccountingAccount }
) {
  return left.account.code.localeCompare(right.account.code, "fr")
    || left.account.id.localeCompare(right.account.id);
}

function toBalanceColumns(netMinor: bigint): AccountingBalanceColumns {
  if (netMinor === BigInt(0)) {
    return Object.freeze({
      debitAmount: zeroAccountingAmount(),
      creditAmount: zeroAccountingAmount(),
      balanceAmount: zeroAccountingAmount(),
      balanceSide: "zero" as const
    });
  }

  const amount = accountingAmountFromMinorUnits(netMinor < BigInt(0) ? -netMinor : netMinor);
  return Object.freeze({
    debitAmount: netMinor > BigInt(0) ? amount : zeroAccountingAmount(),
    creditAmount: netMinor < BigInt(0) ? amount : zeroAccountingAmount(),
    balanceAmount: amount,
    balanceSide: netMinor > BigInt(0) ? "debit" as const : "credit" as const
  });
}

function sumAmounts(values: readonly AccountingAmount[]) {
  return accountingAmountFromMinorUnits(values.reduce((sum, value) => sum + accountingAmountToMinorUnits(value), BigInt(0)));
}

function normalizeReportDateScope(query: AccountingReportQuery) {
  return Object.freeze({
    fromDate: query.fromDate ? parseBoundaryDate(query.fromDate, "from") : undefined,
    toDate: query.toDate ? parseBoundaryDate(query.toDate, "to") : undefined
  });
}

function parseBoundaryDate(value: string, boundary: "from" | "to") {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${boundary === "from" ? "00:00:00.000" : "23:59:59.999"}Z`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error("Periode comptable invalide.");
  return date;
}

function getEntryDatePlacement(entryDate: string, scope: { fromDate?: Date; toDate?: Date }) {
  const date = new Date(entryDate);
  if (Number.isNaN(date.getTime())) throw new Error("Date d'ecriture comptable invalide.");
  if (scope.fromDate && date < scope.fromDate) return "opening";
  if (scope.toDate && date > scope.toDate) return "after";
  return "period";
}

function compareEntries(left: AccountingJournalEntry, right: AccountingJournalEntry) {
  return left.entryDate.localeCompare(right.entryDate)
    || left.number.localeCompare(right.number, "fr")
    || left.id.localeCompare(right.id);
}

function compareMovementCandidates(left: MovementCandidate, right: MovementCandidate) {
  return compareEntries(left.entry, right.entry)
    || left.line.id.localeCompare(right.line.id);
}
