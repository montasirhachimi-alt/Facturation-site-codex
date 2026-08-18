"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, CalendarClock, CheckCircle2, Edit3, FileSpreadsheet, Landmark, Link2, LockKeyhole, Plus, RefreshCw, RotateCcw, Save, Scale, Search, ShieldCheck, ShoppingCart, Unlock } from "lucide-react";
import { clsx } from "clsx";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import {
  getAccountingBalanceSheet,
  getAccountingGeneralLedger,
  getAccountingProfitLoss,
  getAccountingTrialBalance,
  loadAccountingPersistenceSnapshot,
  persistAccountingRecord,
  postAccountingJournalEntry,
  postSalesInvoiceToAccounting,
  postSalesPaymentToAccounting,
  postSupplierBillToAccounting,
  closeAccountingPeriod,
  reopenAccountingPeriod,
  reverseAccountingJournalEntry,
  saveApPostingSettings,
  saveCommercialPostingSettings
} from "@/platform/persistence/accounting-persistence.client";
import type { CrmSalesPersistenceSnapshot } from "@/platform/persistence/crm-sales-persistence.client";
import type { ProcurementSnapshot } from "@/platform/persistence/procurement-persistence.client";
import { getInvoiceTotals, type Invoice } from "@/modules/sales/invoices";
import type { Payment } from "@/modules/sales/payments";
import { calculateSupplierBillTotals, type SupplierBill } from "@/modules/procurement";
import {
  ACCOUNTING_WORKSPACE_ID,
  DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY,
  accountingAmountToMinorUnits,
  calculateJournalEntryTotals,
  type AccountingAccount,
  type AccountingApPostingSettings,
  type AccountingAccountId,
  type AccountingCommercialPostingSettings,
  type AccountingAccountType,
  type AccountingAmount,
  type AccountingJournal,
  type AccountingJournalEntry,
  type AccountingJournalEntryId,
  type AccountingJournalEntryLine,
  type AccountingJournalId,
  type AccountingJournalType,
  type AccountingNormalBalance,
  type AccountingPeriod,
  type AccountingPeriodId,
  type AccountingPeriodStatus,
  type AccountingSnapshot,
  type BalanceSheetReport,
  type GeneralLedgerReport,
  type ProfitLossReport,
  type TrialBalanceReport
} from "@/modules/accounting";

type FinanceTab = "overview" | "accounts" | "journals" | "entries" | "periods" | "sales-integration" | "ap-integration" | "ledger" | "trial-balance" | "profit-loss" | "balance-sheet";
type Notice = { tone: "success" | "error"; message: string };
type AccountForm = {
  id?: AccountingAccountId;
  code: string;
  name: string;
  type: AccountingAccountType;
  normalBalance: AccountingNormalBalance;
  currency: string;
  active: boolean;
};
type JournalForm = {
  id?: AccountingJournalId;
  code: string;
  name: string;
  type: AccountingJournalType;
  active: boolean;
};
type EntryLineForm = {
  id: string;
  accountId: string;
  label: string;
  debitAmount: string;
  creditAmount: string;
};
type EntryForm = {
  id?: AccountingJournalEntryId;
  journalId: string;
  number: string;
  entryDate: string;
  reference: string;
  description: string;
  functionalCurrency: string;
  lines: EntryLineForm[];
};
type CommercialSettingsForm = {
  salesJournalId: string;
  receivableAccountId: string;
  revenueAccountId: string;
  settlementAccountId: string;
  taxPayableAccountId: string;
  functionalCurrency: string;
};
type ApSettingsForm = {
  purchaseJournalId: string;
  payableAccountId: string;
  expenseAccountId: string;
  settlementAccountId: string;
  taxRecoverableAccountId: string;
  functionalCurrency: string;
};
type PeriodForm = {
  id?: AccountingPeriodId;
  name: string;
  startDate: string;
  endDate: string;
  status: AccountingPeriodStatus;
};
type ReversalForm = {
  entry?: AccountingJournalEntry;
  reversalDate: string;
  reason: string;
};

const tabs = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "accounts", label: "Plan comptable" },
  { id: "journals", label: "Journaux" },
  { id: "entries", label: "Écritures" },
  { id: "periods", label: "Périodes" },
  { id: "sales-integration", label: "Intégration ventes" },
  { id: "ap-integration", label: "Intégration achats" },
  { id: "ledger", label: "Grand livre" },
  { id: "trial-balance", label: "Balance" },
  { id: "profit-loss", label: "Résultat" },
  { id: "balance-sheet", label: "Bilan" }
] satisfies readonly { id: FinanceTab; label: string }[];

const accountTypeLabels: Record<AccountingAccountType, string> = {
  asset: "Actif",
  liability: "Passif",
  equity: "Capitaux propres",
  income: "Produit",
  expense: "Charge"
};

const journalTypeLabels: Record<AccountingJournalType, string> = {
  sales: "Ventes",
  purchase: "Achats",
  bank: "Banque",
  cash: "Caisse",
  general: "Général"
};

const statusLabels: Record<AccountingJournalEntry["status"], string> = {
  draft: "Brouillon",
  posted: "Comptabilisé"
};

const emptyAccountForm: AccountForm = {
  code: "",
  name: "",
  type: "asset",
  normalBalance: "debit",
  currency: DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY,
  active: true
};

const emptyJournalForm: JournalForm = {
  code: "",
  name: "",
  type: "general",
  active: true
};

const emptyCommercialSettingsForm: CommercialSettingsForm = {
  salesJournalId: "",
  receivableAccountId: "",
  revenueAccountId: "",
  settlementAccountId: "",
  taxPayableAccountId: "",
  functionalCurrency: DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY
};

const emptyApSettingsForm: ApSettingsForm = {
  purchaseJournalId: "",
  payableAccountId: "",
  expenseAccountId: "",
  settlementAccountId: "",
  taxRecoverableAccountId: "",
  functionalCurrency: DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY
};

const emptyPeriodForm: PeriodForm = {
  name: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  status: "open"
};

export function AccountingWorkspace() {
  const [snapshot, setSnapshot] = useState<AccountingSnapshot>({ accounts: [], journals: [], journalEntries: [] });
  const [activeTab, setActiveTab] = useState<FinanceTab>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [journalForm, setJournalForm] = useState<JournalForm>(emptyJournalForm);
  const [entryForm, setEntryForm] = useState<EntryForm>(() => createEmptyEntryForm());
  const [periodForm, setPeriodForm] = useState<PeriodForm>(emptyPeriodForm);
  const [reversalForm, setReversalForm] = useState<ReversalForm>({ reversalDate: new Date().toISOString().slice(0, 10), reason: "" });
  const [editingEntry, setEditingEntry] = useState<AccountingJournalEntry | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [ledgerAccountId, setLedgerAccountId] = useState("");
  const [ledger, setLedger] = useState<GeneralLedgerReport | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceReport | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetReport | null>(null);
  const [salesSnapshot, setSalesSnapshot] = useState<Pick<CrmSalesPersistenceSnapshot, "invoices" | "payments">>({ invoices: [], payments: [] });
  const [procurementSnapshot, setProcurementSnapshot] = useState<Pick<ProcurementSnapshot, "supplierBills">>({ supplierBills: [] });
  const [commercialSettingsForm, setCommercialSettingsForm] = useState<CommercialSettingsForm>(emptyCommercialSettingsForm);
  const [apSettingsForm, setApSettingsForm] = useState<ApSettingsForm>(emptyApSettingsForm);

  const refreshReports = useCallback(async () => {
    const payload = {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      accountIds: ledgerAccountId ? [ledgerAccountId] : undefined
    };
    const [nextLedger, nextTrialBalance, nextProfitLoss, nextBalanceSheet] = await Promise.all([
      getAccountingGeneralLedger(payload),
      getAccountingTrialBalance({ fromDate: payload.fromDate, toDate: payload.toDate }),
      getAccountingProfitLoss({ fromDate: payload.fromDate, toDate: payload.toDate }),
      getAccountingBalanceSheet({ fromDate: payload.fromDate, asOfDate: payload.toDate })
    ]);
    setLedger(nextLedger);
    setTrialBalance(nextTrialBalance);
    setProfitLoss(nextProfitLoss);
    setBalanceSheet(nextBalanceSheet);
  }, [fromDate, ledgerAccountId, toDate]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const nextSnapshot = await loadAccountingPersistenceSnapshot();
      setSnapshot(nextSnapshot);
      setCommercialSettingsForm(settingsToForm(nextSnapshot.commercialPostingSettings));
      setApSettingsForm(apSettingsToForm(nextSnapshot.apPostingSettings));
      setSalesSnapshot(await loadSalesSources());
      setProcurementSnapshot(await loadProcurementSources());
      await refreshReports();
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Chargement Finance impossible." });
    } finally {
      setLoading(false);
    }
  }, [refreshReports]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  async function saveAccount() {
    setSaving(true);
    setNotice(null);
    try {
      const now = new Date().toISOString();
      const existing = accountForm.id ? snapshot.accounts.find((account) => account.id === accountForm.id) : undefined;
      const account: AccountingAccount = {
        id: accountForm.id ?? createId("account"),
        tenantCompanyId: "" as AccountingAccount["tenantCompanyId"],
        code: accountForm.code.trim(),
        name: accountForm.name.trim(),
        type: accountForm.type,
        normalBalance: accountForm.normalBalance,
        currency: accountForm.currency.trim().toUpperCase() || undefined,
        active: accountForm.active,
        archivedAt: accountForm.active ? undefined : existing?.archivedAt ?? now,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const response = await persistAccountingRecord("account", account);
      setSnapshot(response.snapshot);
      setAccountDialogOpen(false);
      setNotice({ tone: "success", message: accountForm.id ? "Compte comptable enregistré." : "Compte comptable créé." });
      await refreshReports();
      return true;
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Compte comptable non enregistré." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveJournal() {
    setSaving(true);
    setNotice(null);
    try {
      const now = new Date().toISOString();
      const existing = journalForm.id ? snapshot.journals.find((journal) => journal.id === journalForm.id) : undefined;
      const journal: AccountingJournal = {
        id: journalForm.id ?? createId("journal"),
        tenantCompanyId: "" as AccountingJournal["tenantCompanyId"],
        code: journalForm.code.trim(),
        name: journalForm.name.trim(),
        type: journalForm.type,
        active: journalForm.active,
        archivedAt: journalForm.active ? undefined : existing?.archivedAt ?? now,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const response = await persistAccountingRecord("journal", journal);
      setSnapshot(response.snapshot);
      setJournalDialogOpen(false);
      setNotice({ tone: "success", message: journalForm.id ? "Journal enregistré." : "Journal créé." });
      await refreshReports();
      return true;
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Journal non enregistré." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveEntryDraft() {
    setSaving(true);
    setNotice(null);
    try {
      const entry = preserveEntryCreation(entryFormToRecord(entryForm, "draft"), editingEntry);
      const response = await persistAccountingRecord("journalEntryDraft", entry);
      setSnapshot(response.snapshot);
      setEntryDialogOpen(false);
      setEditingEntry(null);
      setNotice({ tone: "success", message: "Écriture brouillon enregistrée." });
      await refreshReports();
      return true;
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Écriture non enregistrée." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function postEntry(entry: AccountingJournalEntry) {
    setSaving(true);
    setNotice(null);
    try {
      const response = await postAccountingJournalEntry(entry.id);
      setSnapshot(response.snapshot);
      setNotice({ tone: "success", message: "Écriture comptabilisée." });
      await refreshReports();
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Comptabilisation refusée." });
    } finally {
      setSaving(false);
    }
  }

  async function savePeriod() {
    setSaving(true);
    setNotice(null);
    try {
      const now = new Date().toISOString();
      const existing = periodForm.id ? snapshot.periods?.find((period) => period.id === periodForm.id) : undefined;
      const period: AccountingPeriod = {
        id: periodForm.id ?? createId("period") as AccountingPeriodId,
        tenantCompanyId: "" as AccountingPeriod["tenantCompanyId"],
        name: periodForm.name.trim(),
        startDate: periodForm.startDate,
        endDate: periodForm.endDate,
        status: periodForm.status,
        closedAt: existing?.closedAt,
        closedBy: existing?.closedBy,
        reopenedAt: existing?.reopenedAt,
        reopenedBy: existing?.reopenedBy,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const response = await persistAccountingRecord("period", period);
      setSnapshot(response.snapshot);
      setPeriodDialogOpen(false);
      setNotice({ tone: "success", message: periodForm.id ? "Période comptable enregistrée." : "Période comptable créée." });
      return true;
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Période comptable non enregistrée." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function transitionPeriod(period: AccountingPeriod) {
    setSaving(true);
    setNotice(null);
    try {
      const response = period.status === "closed" ? await reopenAccountingPeriod(period.id) : await closeAccountingPeriod(period.id);
      setSnapshot(response.snapshot);
      setNotice({ tone: "success", message: period.status === "closed" ? "Période comptable rouverte." : "Période comptable clôturée." });
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Changement de période refusé." });
    } finally {
      setSaving(false);
    }
  }

  async function reverseEntry() {
    if (!reversalForm.entry) return false;
    setSaving(true);
    setNotice(null);
    try {
      const response = await reverseAccountingJournalEntry({
        entryId: reversalForm.entry.id,
        reversalDate: reversalForm.reversalDate,
        reason: reversalForm.reason
      });
      setSnapshot(response.snapshot);
      setReversalDialogOpen(false);
      setReversalForm({ reversalDate: new Date().toISOString().slice(0, 10), reason: "" });
      setNotice({ tone: "success", message: "Écriture contrepassee." });
      await refreshReports();
      return true;
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Contrepassation refusée." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveCommercialSettings() {
    setSaving(true);
    setNotice(null);
    try {
      const now = new Date().toISOString();
      const existing = snapshot.commercialPostingSettings;
      const settings: AccountingCommercialPostingSettings = {
        tenantCompanyId: "" as AccountingCommercialPostingSettings["tenantCompanyId"],
        salesJournalId: optionalId(commercialSettingsForm.salesJournalId) as AccountingCommercialPostingSettings["salesJournalId"] | undefined,
        receivableAccountId: optionalId(commercialSettingsForm.receivableAccountId) as AccountingCommercialPostingSettings["receivableAccountId"] | undefined,
        revenueAccountId: optionalId(commercialSettingsForm.revenueAccountId) as AccountingCommercialPostingSettings["revenueAccountId"] | undefined,
        settlementAccountId: optionalId(commercialSettingsForm.settlementAccountId) as AccountingCommercialPostingSettings["settlementAccountId"] | undefined,
        taxPayableAccountId: optionalId(commercialSettingsForm.taxPayableAccountId) as AccountingCommercialPostingSettings["taxPayableAccountId"] | undefined,
        functionalCurrency: commercialSettingsForm.functionalCurrency.trim().toUpperCase() || DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const response = await saveCommercialPostingSettings(settings);
      setSnapshot(response.snapshot);
      setCommercialSettingsForm(settingsToForm(response.record));
      setNotice({ tone: "success", message: "Configuration ventes enregistrée." });
      await refreshReports();
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Configuration ventes non enregistrée." });
    } finally {
      setSaving(false);
    }
  }

  async function saveApSettings() {
    setSaving(true);
    setNotice(null);
    try {
      const now = new Date().toISOString();
      const existing = snapshot.apPostingSettings;
      const settings: AccountingApPostingSettings = {
        tenantCompanyId: "" as AccountingApPostingSettings["tenantCompanyId"],
        purchaseJournalId: optionalId(apSettingsForm.purchaseJournalId) as AccountingApPostingSettings["purchaseJournalId"] | undefined,
        payableAccountId: optionalId(apSettingsForm.payableAccountId) as AccountingApPostingSettings["payableAccountId"] | undefined,
        expenseAccountId: optionalId(apSettingsForm.expenseAccountId) as AccountingApPostingSettings["expenseAccountId"] | undefined,
        settlementAccountId: optionalId(apSettingsForm.settlementAccountId) as AccountingApPostingSettings["settlementAccountId"] | undefined,
        taxRecoverableAccountId: optionalId(apSettingsForm.taxRecoverableAccountId) as AccountingApPostingSettings["taxRecoverableAccountId"] | undefined,
        functionalCurrency: apSettingsForm.functionalCurrency.trim().toUpperCase() || DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const response = await saveApPostingSettings(settings);
      setSnapshot(response.snapshot);
      setApSettingsForm(apSettingsToForm(response.record));
      setNotice({ tone: "success", message: "Configuration achats enregistrée." });
      await refreshReports();
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Configuration achats non enregistrée." });
    } finally {
      setSaving(false);
    }
  }

  async function postCommercialSource(kind: "invoice" | "payment", id: string) {
    setSaving(true);
    setNotice(null);
    try {
      const response = kind === "invoice" ? await postSalesInvoiceToAccounting(id) : await postSalesPaymentToAccounting(id);
      setSnapshot(response.snapshot);
      setNotice({ tone: "success", message: kind === "invoice" ? "Facture comptabilisée." : "Règlement comptabilisé." });
      await refreshReports();
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Comptabilisation commerciale refusée." });
    } finally {
      setSaving(false);
    }
  }

  async function postApSource(id: string) {
    setSaving(true);
    setNotice(null);
    try {
      const response = await postSupplierBillToAccounting(id);
      setSnapshot(response.snapshot);
      setProcurementSnapshot(await loadProcurementSources());
      setNotice({ tone: "success", message: "Facture fournisseur comptabilisée." });
      await refreshReports();
    } catch (caught) {
      setNotice({ tone: "error", message: caught instanceof Error ? caught.message : "Comptabilisation achats refusée." });
    } finally {
      setSaving(false);
    }
  }

  const filteredAccounts = useMemo(() => {
    const needle = normalizeSearch(query);
    return snapshot.accounts.filter((account) => {
      if (!needle) return true;
      return normalizeSearch(`${account.code} ${account.name} ${accountTypeLabels[account.type]}`).includes(needle);
    });
  }, [query, snapshot.accounts]);

  const filteredJournals = useMemo(() => {
    const needle = normalizeSearch(query);
    return snapshot.journals.filter((journal) => {
      if (!needle) return true;
      return normalizeSearch(`${journal.code} ${journal.name} ${journalTypeLabels[journal.type]}`).includes(needle);
    });
  }, [query, snapshot.journals]);

  const filteredEntries = useMemo(() => {
    const needle = normalizeSearch(query);
    return snapshot.journalEntries.filter((entry) => {
      if (!needle) return true;
      return normalizeSearch(`${entry.number} ${entry.description ?? ""} ${entry.reference ?? ""} ${entry.status}`).includes(needle);
    });
  }, [query, snapshot.journalEntries]);

  const entryTotals = useMemo(() => safeEntryTotals(entryForm.lines), [entryForm.lines]);
  const hasAccounts = snapshot.accounts.length > 0;
  const hasJournals = snapshot.journals.length > 0;

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-5 text-hicotech-navy dark:bg-hicotech-dark-page dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <section className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(10,30,63,0.08)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-hicotech-blue">Finance</p>
              <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-hicotech-navy dark:text-white">Comptabilité opérationnelle</h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">
                Configurez les comptes, saisissez des écritures manuelles puis consultez le Grand livre et la Balance dérivés des écritures comptabilisées.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openEntryDialog()} disabled={!hasAccounts || !hasJournals} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20 disabled:cursor-not-allowed disabled:opacity-50">
                <Plus size={16} /> Nouvelle écriture
              </button>
              <button type="button" onClick={refreshAll} disabled={loading} className={secondaryButtonClassName}>
                <RefreshCw size={16} className={clsx(loading && "animate-spin")} /> Actualiser
              </button>
            </div>
          </div>
          <div className="border-t border-slate-200 px-5 pb-4 pt-3 dark:border-hicotech-dark-border">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={clsx("rounded-xl px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10", activeTab === tab.id ? "bg-hicotech-navy text-white dark:bg-white dark:text-hicotech-navy" : "text-slate-500 hover:bg-slate-100 hover:text-hicotech-navy dark:hover:bg-white/10 dark:hover:text-white")}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {notice && <NoticeBanner notice={notice} />}

        {activeTab === "overview" && <OverviewSection snapshot={snapshot} ledger={ledger} profitLoss={profitLoss} balanceSheet={balanceSheet} trialBalance={trialBalance} onCreateAccount={() => openAccountDialog()} onCreateJournal={() => openJournalDialog()} onCreateEntry={() => openEntryDialog()} />}
        {activeTab === "accounts" && <AccountsSection accounts={filteredAccounts} query={query} setQuery={setQuery} onCreate={() => openAccountDialog()} onEdit={openAccountDialog} />}
        {activeTab === "journals" && <JournalsSection journals={filteredJournals} query={query} setQuery={setQuery} onCreate={() => openJournalDialog()} onEdit={openJournalDialog} />}
        {activeTab === "entries" && <EntriesSection entries={filteredEntries} journals={snapshot.journals} accounts={snapshot.accounts} query={query} setQuery={setQuery} saving={saving} onCreate={() => openEntryDialog()} onEdit={openEntryDialog} onPost={postEntry} onReverse={openReversalDialog} />}
        {activeTab === "periods" && <PeriodsSection periods={snapshot.periods ?? []} query={query} setQuery={setQuery} saving={saving} onCreate={() => openPeriodDialog()} onEdit={openPeriodDialog} onTransition={transitionPeriod} />}
        {activeTab === "sales-integration" && <SalesIntegrationSection accounts={snapshot.accounts} journals={snapshot.journals} settings={commercialSettingsForm} onSettingsChange={setCommercialSettingsForm} onSaveSettings={saveCommercialSettings} invoices={salesSnapshot.invoices} payments={salesSnapshot.payments} statuses={snapshot.commercialSources} saving={saving} onPost={postCommercialSource} />}
        {activeTab === "ap-integration" && <ApIntegrationSection accounts={snapshot.accounts} journals={snapshot.journals} settings={apSettingsForm} onSettingsChange={setApSettingsForm} onSaveSettings={saveApSettings} supplierBills={procurementSnapshot.supplierBills} statuses={snapshot.apSources} saving={saving} onPost={postApSource} />}
        {activeTab === "ledger" && <LedgerSection accounts={snapshot.accounts} ledger={ledger} fromDate={fromDate} toDate={toDate} accountId={ledgerAccountId} onAccountChange={setLedgerAccountId} onFromDateChange={setFromDate} onToDateChange={setToDate} onRefresh={refreshReports} />}
        {activeTab === "trial-balance" && <TrialBalanceSection trialBalance={trialBalance} fromDate={fromDate} toDate={toDate} onFromDateChange={setFromDate} onToDateChange={setToDate} onRefresh={refreshReports} />}
        {activeTab === "profit-loss" && <ProfitLossSection profitLoss={profitLoss} fromDate={fromDate} toDate={toDate} onFromDateChange={setFromDate} onToDateChange={setToDate} onRefresh={refreshReports} />}
        {activeTab === "balance-sheet" && <BalanceSheetSection balanceSheet={balanceSheet} fromDate={fromDate} toDate={toDate} onFromDateChange={setFromDate} onToDateChange={setToDate} onRefresh={refreshReports} />}
      </div>

      <EntityDialog
        open={accountDialogOpen}
        eyebrow="Plan comptable"
        title={accountForm.id ? "Modifier le compte" : "Créer un compte"}
        description="Compte global, sans modèle comptable pays spécifique."
        error={notice?.tone === "error" && accountDialogOpen ? notice.message : null}
        onClose={() => setAccountDialogOpen(false)}
        onSubmit={saveAccount}
        size="md"
        footer={<DialogFooter primaryLabel="Enregistrer" onCancel={() => setAccountDialogOpen(false)} saving={saving} />}
      >
        <AccountFormFields form={accountForm} onChange={setAccountForm} />
      </EntityDialog>

      <EntityDialog
        open={journalDialogOpen}
        eyebrow="Journaux"
        title={journalForm.id ? "Modifier le journal" : "Créer un journal"}
        description="Journal global utilisé pour regrouper les écritures manuelles."
        error={notice?.tone === "error" && journalDialogOpen ? notice.message : null}
        onClose={() => setJournalDialogOpen(false)}
        onSubmit={saveJournal}
        size="md"
        footer={<DialogFooter primaryLabel="Enregistrer" onCancel={() => setJournalDialogOpen(false)} saving={saving} />}
      >
        <JournalFormFields form={journalForm} onChange={setJournalForm} />
      </EntityDialog>

      <EntityDialog
        open={entryDialogOpen}
        eyebrow="Écritures comptables"
        title={editingEntry?.status === "posted" ? "Écriture comptabilisée" : editingEntry ? "Modifier le brouillon" : "Nouvelle écriture"}
        description={editingEntry?.status === "posted" ? "Une écriture comptabilisée est consultable mais ne peut pas être modifiée silencieusement." : "Saisissez les lignes débit/crédit puis enregistrez le brouillon avant comptabilisation."}
        error={notice?.tone === "error" && entryDialogOpen ? notice.message : null}
        onClose={() => setEntryDialogOpen(false)}
        onSubmit={editingEntry?.status === "posted" ? () => false : saveEntryDraft}
        size="xl"
        footer={<EntryDialogFooter posted={editingEntry?.status === "posted"} totals={entryTotals} saving={saving} onCancel={() => setEntryDialogOpen(false)} onPost={editingEntry && editingEntry.status === "draft" ? () => postEntry(editingEntry) : undefined} />}
      >
        <EntryFormFields accounts={snapshot.accounts} journals={snapshot.journals} form={entryForm} onChange={setEntryForm} readOnly={editingEntry?.status === "posted"} totals={entryTotals} />
      </EntityDialog>

      <EntityDialog
        open={periodDialogOpen}
        eyebrow="Contrôle des périodes"
        title={periodForm.id ? "Modifier la période" : "Créer une période"}
        description="Une période fermée bloque les nouvelles comptabilisations sur ses dates, sans empêcher la lecture des rapports."
        error={notice?.tone === "error" && periodDialogOpen ? notice.message : null}
        onClose={() => setPeriodDialogOpen(false)}
        onSubmit={savePeriod}
        size="md"
        footer={<DialogFooter primaryLabel="Enregistrer" onCancel={() => setPeriodDialogOpen(false)} saving={saving} />}
      >
        <PeriodFormFields form={periodForm} onChange={setPeriodForm} />
      </EntityDialog>

      <EntityDialog
        open={reversalDialogOpen}
        eyebrow="Contrepassation"
        title="Contrepasser l'écriture"
        description="Cette action crée une nouvelle écriture opposée. L'écriture d'origine reste conservée dans l'historique."
        error={notice?.tone === "error" && reversalDialogOpen ? notice.message : null}
        onClose={() => setReversalDialogOpen(false)}
        onSubmit={reverseEntry}
        size="md"
        footer={<DialogFooter primaryLabel="Créer la contrepassation" onCancel={() => setReversalDialogOpen(false)} saving={saving} />}
      >
        <ReversalFormFields form={reversalForm} onChange={setReversalForm} />
      </EntityDialog>
    </main>
  );

  function openAccountDialog(account?: AccountingAccount) {
    setNotice(null);
    setAccountForm(account ? {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      normalBalance: account.normalBalance,
      currency: account.currency ?? DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY,
      active: account.active
    } : emptyAccountForm);
    setAccountDialogOpen(true);
  }

  function openJournalDialog(journal?: AccountingJournal) {
    setNotice(null);
    setJournalForm(journal ? {
      id: journal.id,
      code: journal.code,
      name: journal.name,
      type: journal.type,
      active: journal.active
    } : emptyJournalForm);
    setJournalDialogOpen(true);
  }

  function openEntryDialog(entry?: AccountingJournalEntry) {
    setNotice(null);
    setEditingEntry(entry ?? null);
    setEntryForm(entry ? recordToEntryForm(entry) : createEmptyEntryForm(snapshot.journals[0]?.id));
    setEntryDialogOpen(true);
  }

  function openPeriodDialog(period?: AccountingPeriod) {
    setNotice(null);
    setPeriodForm(period ? {
      id: period.id,
      name: period.name,
      startDate: period.startDate.slice(0, 10),
      endDate: period.endDate.slice(0, 10),
      status: period.status
    } : emptyPeriodForm);
    setPeriodDialogOpen(true);
  }

  function openReversalDialog(entry: AccountingJournalEntry) {
    setNotice(null);
    setReversalForm({ entry, reversalDate: new Date().toISOString().slice(0, 10), reason: "" });
    setReversalDialogOpen(true);
  }
}

function OverviewSection({ balanceSheet, ledger, onCreateAccount, onCreateEntry, onCreateJournal, profitLoss, snapshot, trialBalance }: {
  balanceSheet: BalanceSheetReport | null;
  ledger: GeneralLedgerReport | null;
  onCreateAccount: () => void;
  onCreateEntry: () => void;
  onCreateJournal: () => void;
  profitLoss: ProfitLossReport | null;
  snapshot: AccountingSnapshot;
  trialBalance: TrialBalanceReport | null;
}) {
  const postedEntries = snapshot.journalEntries.filter((entry) => entry.status === "posted").length;
  const draftEntries = snapshot.journalEntries.filter((entry) => entry.status === "draft").length;
  const cards = [
    { label: "Comptes", value: snapshot.accounts.length, helper: "Plan comptable global", icon: Landmark },
    { label: "Journaux", value: snapshot.journals.length, helper: "Registres disponibles", icon: BookOpen },
    { label: "Brouillons", value: draftEntries, helper: "Sans impact comptable", icon: FileSpreadsheet },
    { label: "Comptabilisées", value: postedEntries, helper: "Dans le Grand livre", icon: ShieldCheck }
  ];
  const statementCards = [
    { label: "Produits période", value: formatAccountingAmount(profitLoss?.revenue.total ?? "0.00", profitLoss?.functionalCurrency ?? DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY), helper: "Écritures POSTED seulement" },
    { label: "Charges période", value: formatAccountingAmount(profitLoss?.expenses.total ?? "0.00", profitLoss?.functionalCurrency ?? DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY), helper: "Écritures POSTED seulement" },
    { label: "Résultat net", value: formatSignedResult(profitLoss), helper: profitLoss?.netResultSide === "loss" ? "Perte sur la période" : "Résultat de la période" },
    { label: "Bilan", value: balanceSheet?.reconciled ? "Équilibré" : "À vérifier", helper: "Actif = Passif + résultat" }
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:col-span-2">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
                <p className="mt-2 font-display text-2xl font-black text-hicotech-navy dark:text-white">{card.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{card.helper}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-hicotech-blue/10 text-hicotech-blue"><card.icon size={18} /></span>
            </div>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <h2 className="font-display text-lg font-black">Actions Finance</h2>
        <div className="mt-4 grid gap-2">
          <ActionButton label="Créer un compte" onClick={onCreateAccount} />
          <ActionButton label="Créer un journal" onClick={onCreateJournal} />
          <ActionButton label="Nouvelle écriture" onClick={onCreateEntry} disabled={snapshot.accounts.length === 0 || snapshot.journals.length === 0} />
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <h2 className="font-display text-lg font-black">Équilibre comptable</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">La Balance et le Grand livre sont calculés depuis les écritures comptabilisées.</p>
        <div className="mt-4 grid gap-3">
          <SummaryRow label="Débit période" value={formatAccountingAmount(ledger?.periodDebitTotal ?? "0.00", DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY)} />
          <SummaryRow label="Crédit période" value={formatAccountingAmount(ledger?.periodCreditTotal ?? "0.00", DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY)} />
          <SummaryRow label="Réconciliation" value={trialBalance?.balanced ? "Équilibrée" : "À vérifier"} tone={trialBalance?.balanced ? "ok" : "warning"} />
        </div>
      </section>
      <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <h2 className="font-display text-lg font-black">Intelligence Finance</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Lecture de gestion dérivée des écritures comptabilisées, sans données commerciales non postées.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statementCards.map((card) => <SummaryRow key={card.label} label={card.label} value={card.value} tone={card.label === "Bilan" ? balanceSheet?.reconciled ? "ok" : "warning" : undefined} />)}
        </div>
      </section>
    </div>
  );
}

function AccountsSection({ accounts, onCreate, onEdit, query, setQuery }: { accounts: readonly AccountingAccount[]; onCreate: () => void; onEdit: (account: AccountingAccount) => void; query: string; setQuery: (value: string) => void }) {
  return (
    <section className={panelClassName}>
      <SectionToolbar title="Plan comptable" description="Comptes globaux utilisés par les écritures manuelles.">
        <SearchControl value={query} onChange={setQuery} placeholder="Code, nom, type..." />
        <button type="button" onClick={onCreate} className={primaryButtonClassName}><Plus size={16} /> Créer un compte</button>
      </SectionToolbar>
      <TableShell empty={accounts.length === 0} emptyTitle="Aucun compte comptable" emptyDescription="Créez votre premier compte comptable pour commencer à structurer votre comptabilité.">
        <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Compte</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Sens</th><th className="px-4 py-3">Devise</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody className={tableBodyClassName}>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td className="px-4 py-3"><p className="font-black text-hicotech-navy dark:text-white">{account.code}</p><p className="text-xs font-semibold text-slate-500">{account.name}</p></td>
              <td className="px-4 py-3">{accountTypeLabels[account.type]}</td>
              <td className="px-4 py-3">{account.normalBalance === "debit" ? "Débit" : "Crédit"}</td>
              <td className="px-4 py-3">{account.currency ?? "-"}</td>
              <td className="px-4 py-3"><StatusBadge label={account.active ? "Actif" : "Archivé"} tone={account.active ? "ok" : "muted"} /></td>
              <td className="px-4 py-3"><div className="flex justify-end"><button type="button" onClick={() => onEdit(account)} className={iconButtonClassName} title="Modifier le compte" aria-label="Modifier le compte"><Edit3 size={16} /></button></div></td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </section>
  );
}

function JournalsSection({ journals, onCreate, onEdit, query, setQuery }: { journals: readonly AccountingJournal[]; onCreate: () => void; onEdit: (journal: AccountingJournal) => void; query: string; setQuery: (value: string) => void }) {
  return (
    <section className={panelClassName}>
      <SectionToolbar title="Journaux" description="Registres comptables globaux, sans modèle localisé imposé.">
        <SearchControl value={query} onChange={setQuery} placeholder="Code, nom, type..." />
        <button type="button" onClick={onCreate} className={primaryButtonClassName}><Plus size={16} /> Créer un journal</button>
      </SectionToolbar>
      <TableShell empty={journals.length === 0} emptyTitle="Aucun journal" emptyDescription="Créez un journal avant de saisir vos premières écritures.">
        <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Journal</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody className={tableBodyClassName}>
          {journals.map((journal) => (
            <tr key={journal.id}>
              <td className="px-4 py-3"><p className="font-black text-hicotech-navy dark:text-white">{journal.code}</p><p className="text-xs font-semibold text-slate-500">{journal.name}</p></td>
              <td className="px-4 py-3">{journalTypeLabels[journal.type]}</td>
              <td className="px-4 py-3"><StatusBadge label={journal.active ? "Actif" : "Archivé"} tone={journal.active ? "ok" : "muted"} /></td>
              <td className="px-4 py-3"><div className="flex justify-end"><button type="button" onClick={() => onEdit(journal)} className={iconButtonClassName} title="Modifier le journal" aria-label="Modifier le journal"><Edit3 size={16} /></button></div></td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </section>
  );
}

function EntriesSection({ accounts, entries, journals, onCreate, onEdit, onPost, onReverse, query, saving, setQuery }: {
  accounts: readonly AccountingAccount[];
  entries: readonly AccountingJournalEntry[];
  journals: readonly AccountingJournal[];
  onCreate: () => void;
  onEdit: (entry: AccountingJournalEntry) => void;
  onPost: (entry: AccountingJournalEntry) => void;
  onReverse: (entry: AccountingJournalEntry) => void;
  query: string;
  saving: boolean;
  setQuery: (value: string) => void;
}) {
  const journalById = new Map(journals.map((journal) => [journal.id, journal]));
  return (
    <section className={panelClassName}>
      <SectionToolbar title="Écritures comptables" description="Les brouillons sont modifiables; les écritures comptabilisées sont protégées.">
        <SearchControl value={query} onChange={setQuery} placeholder="Numéro, référence, description..." />
        <button type="button" onClick={onCreate} disabled={accounts.length === 0 || journals.length === 0} className={primaryButtonClassName}><Plus size={16} /> Nouvelle écriture</button>
      </SectionToolbar>
      <TableShell empty={entries.length === 0} emptyTitle="Aucune écriture comptable" emptyDescription="Créez un brouillon pour préparer votre première écriture manuelle.">
        <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Écriture</th><th className="px-4 py-3">Journal</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Débit</th><th className="px-4 py-3 text-right">Crédit</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody className={tableBodyClassName}>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3"><p className="font-black text-hicotech-navy dark:text-white">{entry.number}</p><p className="text-xs font-semibold text-slate-500">{entry.description || entry.reference || "Écriture manuelle"}</p></td>
              <td className="px-4 py-3">{journalById.get(entry.journalId)?.code ?? "-"}</td>
              <td className="px-4 py-3">{formatDate(entry.entryDate)}</td>
              <td className="px-4 py-3"><StatusBadge label={getEntryStatusLabel(entry)} tone={entry.status === "posted" ? entry.reversedByEntryId ? "muted" : "ok" : "warning"} /></td>
              <td className="px-4 py-3 text-right font-bold">{formatAccountingAmount(entry.debitTotal, entry.functionalCurrency)}</td>
              <td className="px-4 py-3 text-right font-bold">{formatAccountingAmount(entry.creditTotal, entry.functionalCurrency)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => onEdit(entry)} className={iconButtonClassName} title={entry.status === "posted" ? "Consulter l'écriture" : "Modifier le brouillon"} aria-label={entry.status === "posted" ? "Consulter l'écriture" : "Modifier le brouillon"}><Edit3 size={16} /></button>
                  {entry.status === "draft" && <button type="button" onClick={() => onPost(entry)} disabled={saving} className={iconButtonClassName} title="Comptabiliser l'écriture" aria-label="Comptabiliser l'écriture"><CheckCircle2 size={16} /></button>}
                  {entry.status === "posted" && !entry.reversalOfEntryId && !entry.reversedByEntryId && <button type="button" onClick={() => onReverse(entry)} disabled={saving} className={iconButtonClassName} title="Contrepasser l'écriture" aria-label="Contrepasser l'écriture"><RotateCcw size={16} /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </section>
  );
}

function PeriodsSection({ onCreate, onEdit, onTransition, periods, query, saving, setQuery }: {
  onCreate: () => void;
  onEdit: (period: AccountingPeriod) => void;
  onTransition: (period: AccountingPeriod) => void;
  periods: readonly AccountingPeriod[];
  query: string;
  saving: boolean;
  setQuery: (value: string) => void;
}) {
  const needle = normalizeSearch(query);
  const filtered = periods.filter((period) => !needle || normalizeSearch(`${period.name} ${period.status}`).includes(needle));
  return (
    <section className={panelClassName}>
      <SectionToolbar title="Périodes comptables" description="Les périodes fermées empêchent toute nouvelle comptabilisation sur leurs dates. Les rapports restent consultables.">
        <SearchControl value={query} onChange={setQuery} placeholder="Nom, statut..." />
        <button type="button" onClick={onCreate} className={primaryButtonClassName}><CalendarClock size={16} /> Créer une période</button>
      </SectionToolbar>
      <TableShell empty={filtered.length === 0} emptyTitle="Aucune période comptable" emptyDescription="Créez une période pour contrôler les dates de comptabilisation.">
        <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Période</th><th className="px-4 py-3">Début</th><th className="px-4 py-3">Fin</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Audit</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody className={tableBodyClassName}>
          {filtered.map((period) => (
            <tr key={period.id}>
              <td className="px-4 py-3"><p className="font-black text-hicotech-navy dark:text-white">{period.name}</p></td>
              <td className="px-4 py-3">{formatDate(period.startDate)}</td>
              <td className="px-4 py-3">{formatDate(period.endDate)}</td>
              <td className="px-4 py-3"><StatusBadge label={period.status === "closed" ? "Fermée" : "Ouverte"} tone={period.status === "closed" ? "warning" : "ok"} /></td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-500">{period.status === "closed" ? `Clôturée ${period.closedAt ? formatDate(period.closedAt) : ""}` : period.reopenedAt ? `Rouverte ${formatDate(period.reopenedAt)}` : "Disponible"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => onEdit(period)} disabled={saving} className={iconButtonClassName} title="Modifier la période" aria-label="Modifier la période"><Edit3 size={16} /></button>
                  <button type="button" onClick={() => onTransition(period)} disabled={saving} className={iconButtonClassName} title={period.status === "closed" ? "Rouvrir la période" : "Clôturer la période"} aria-label={period.status === "closed" ? "Rouvrir la période" : "Clôturer la période"}>{period.status === "closed" ? <Unlock size={16} /> : <LockKeyhole size={16} />}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </section>
  );
}

function LedgerSection({ accountId, accounts, fromDate, ledger, onAccountChange, onFromDateChange, onRefresh, onToDateChange, toDate }: {
  accountId: string;
  accounts: readonly AccountingAccount[];
  fromDate: string;
  ledger: GeneralLedgerReport | null;
  onAccountChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onRefresh: () => Promise<void>;
  onToDateChange: (value: string) => void;
  toDate: string;
}) {
  return (
    <section className={panelClassName}>
      <SectionToolbar title="Grand livre" description="Mouvements et soldes courants dérivés des écritures comptabilisées.">
        <DateControls fromDate={fromDate} toDate={toDate} onFromDateChange={onFromDateChange} onToDateChange={onToDateChange} />
        <select value={accountId} onChange={(event) => onAccountChange(event.target.value)} className={inputClassName}>
          <option value="">Tous les comptes</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}
        </select>
        <button type="button" onClick={() => void onRefresh()} className={secondaryButtonClassName}><RefreshCw size={16} /> Appliquer</button>
      </SectionToolbar>
      <div className="grid gap-4 p-4">
        {ledger?.accounts.map((account) => (
          <div key={account.account.id} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-hicotech-dark-border">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3 dark:bg-hicotech-dark-page/40">
              <div><p className="font-black">{account.account.code} · {account.account.name}</p><p className="text-xs font-semibold text-slate-500">Ouverture {formatBalance(account.opening, account.functionalCurrency)} · Clôture {formatBalance(account.closing, account.functionalCurrency)}</p></div>
              <StatusBadge label={`${account.movements.length} mouvement(s)`} tone="muted" />
            </div>
            <TableShell empty={account.movements.length === 0} emptyTitle="Aucun mouvement" emptyDescription="Aucune ligne comptabilisée pour ce compte sur la période.">
              <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Écriture</th><th className="px-4 py-3">Libellé</th><th className="px-4 py-3 text-right">Débit</th><th className="px-4 py-3 text-right">Crédit</th><th className="px-4 py-3 text-right">Solde</th></tr></thead>
              <tbody className={tableBodyClassName}>
                {account.movements.map((movement) => (
                  <tr key={movement.journalEntryLineId}>
                    <td className="px-4 py-3">{formatDate(movement.entryDate)}</td>
                    <td className="px-4 py-3"><p className="font-bold">{movement.entryNumber}</p><p className="text-xs text-slate-500">{movement.journalCode}</p></td>
                    <td className="px-4 py-3">{movement.label}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatAccountingAmount(movement.debitAmount, movement.functionalCurrency)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatAccountingAmount(movement.creditAmount, movement.functionalCurrency)}</td>
                    <td className="px-4 py-3 text-right font-black">{formatAccountingAmount(movement.runningBalance, movement.functionalCurrency)} {movement.runningBalanceSide === "credit" ? "Cr" : movement.runningBalanceSide === "debit" ? "Db" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
        ))}
        {(!ledger || ledger.accounts.length === 0) && <EmptyState title="Grand livre vide" description="Comptabilisez une écriture pour afficher les mouvements officiels." />}
      </div>
    </section>
  );
}

function TrialBalanceSection({ fromDate, onFromDateChange, onRefresh, onToDateChange, toDate, trialBalance }: {
  fromDate: string;
  onFromDateChange: (value: string) => void;
  onRefresh: () => Promise<void>;
  onToDateChange: (value: string) => void;
  toDate: string;
  trialBalance: TrialBalanceReport | null;
}) {
  return (
    <section className={panelClassName}>
      <SectionToolbar title="Balance" description="Ouverture, mouvements et soldes de clôture calculés depuis le Grand livre.">
        <DateControls fromDate={fromDate} toDate={toDate} onFromDateChange={onFromDateChange} onToDateChange={onToDateChange} />
        <button type="button" onClick={() => void onRefresh()} className={secondaryButtonClassName}><RefreshCw size={16} /> Appliquer</button>
      </SectionToolbar>
      <TableShell empty={!trialBalance || trialBalance.rows.length === 0} emptyTitle="Balance vide" emptyDescription="Aucune écriture comptabilisée ne contribue à la Balance.">
        <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Compte</th><th className="px-4 py-3 text-right">Ouverture</th><th className="px-4 py-3 text-right">Débit période</th><th className="px-4 py-3 text-right">Crédit période</th><th className="px-4 py-3 text-right">Solde débit</th><th className="px-4 py-3 text-right">Solde crédit</th></tr></thead>
        <tbody className={tableBodyClassName}>
          {trialBalance?.rows.map((row) => (
            <tr key={row.account.id}>
              <td className="px-4 py-3"><p className="font-black">{row.account.code}</p><p className="text-xs font-semibold text-slate-500">{row.account.name}</p></td>
              <td className="px-4 py-3 text-right">{formatBalance(row.opening, row.functionalCurrency)}</td>
              <td className="px-4 py-3 text-right font-bold">{formatAccountingAmount(row.periodDebit, row.functionalCurrency)}</td>
              <td className="px-4 py-3 text-right font-bold">{formatAccountingAmount(row.periodCredit, row.functionalCurrency)}</td>
              <td className="px-4 py-3 text-right font-black">{formatAccountingAmount(row.closing.debitAmount, row.functionalCurrency)}</td>
              <td className="px-4 py-3 text-right font-black">{formatAccountingAmount(row.closing.creditAmount, row.functionalCurrency)}</td>
            </tr>
          ))}
        </tbody>
        {trialBalance && (
          <tfoot className="bg-slate-50 text-sm font-black dark:bg-hicotech-dark-page/40">
            <tr><td className="px-4 py-3">Totaux</td><td className="px-4 py-3" /><td className="px-4 py-3 text-right">{formatAccountingAmount(trialBalance.periodDebitTotal, DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY)}</td><td className="px-4 py-3 text-right">{formatAccountingAmount(trialBalance.periodCreditTotal, DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY)}</td><td className="px-4 py-3 text-right">{formatAccountingAmount(trialBalance.closingDebitTotal, DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY)}</td><td className="px-4 py-3 text-right">{formatAccountingAmount(trialBalance.closingCreditTotal, DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY)}</td></tr>
          </tfoot>
        )}
      </TableShell>
      {trialBalance && <div className="border-t border-slate-200 p-4 dark:border-hicotech-dark-border"><StatusBadge label={trialBalance.balanced ? "Balance équilibrée" : "Balance à vérifier"} tone={trialBalance.balanced ? "ok" : "warning"} /></div>}
    </section>
  );
}

function ProfitLossSection({ fromDate, onFromDateChange, onRefresh, onToDateChange, profitLoss, toDate }: {
  fromDate: string;
  onFromDateChange: (value: string) => void;
  onRefresh: () => Promise<void>;
  onToDateChange: (value: string) => void;
  profitLoss: ProfitLossReport | null;
  toDate: string;
}) {
  return (
    <section className={panelClassName}>
      <SectionToolbar title="Compte de résultat" description="Produits, charges et résultat net sur la période sélectionnée.">
        <DateControls fromDate={fromDate} toDate={toDate} onFromDateChange={onFromDateChange} onToDateChange={onToDateChange} />
        <button type="button" onClick={() => void onRefresh()} className={secondaryButtonClassName}><RefreshCw size={16} /> Appliquer</button>
      </SectionToolbar>
      {!profitLoss ? <EmptyState title="Compte de résultat indisponible" description="Actualisez la Finance pour calculer le résultat depuis les écritures comptabilisées." /> : (
        <div className="grid gap-5 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <StatementMetric label="Total produits" value={formatAccountingAmount(profitLoss.revenue.total, profitLoss.functionalCurrency)} />
            <StatementMetric label="Total charges" value={formatAccountingAmount(profitLoss.expenses.total, profitLoss.functionalCurrency)} />
            <StatementMetric label="Résultat net" value={formatSignedResult(profitLoss)} tone={profitLoss.netResultSide === "loss" ? "warning" : "ok"} />
          </div>
          <StatementAccountSection title="Produits" rows={profitLoss.revenue.rows} total={profitLoss.revenue.total} currency={profitLoss.functionalCurrency} empty="Aucun produit comptabilisé sur cette période." />
          <StatementAccountSection title="Charges" rows={profitLoss.expenses.rows} total={profitLoss.expenses.total} currency={profitLoss.functionalCurrency} empty="Aucune charge comptabilisée sur cette période." />
        </div>
      )}
    </section>
  );
}

function BalanceSheetSection({ balanceSheet, fromDate, onFromDateChange, onRefresh, onToDateChange, toDate }: {
  balanceSheet: BalanceSheetReport | null;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  onRefresh: () => Promise<void>;
  onToDateChange: (value: string) => void;
  toDate: string;
}) {
  return (
    <section className={panelClassName}>
      <SectionToolbar title="Bilan" description="Position financière cumulée à la date sélectionnée.">
        <DateControls fromDate={fromDate} toDate={toDate} onFromDateChange={onFromDateChange} onToDateChange={onToDateChange} />
        <button type="button" onClick={() => void onRefresh()} className={secondaryButtonClassName}><RefreshCw size={16} /> Appliquer</button>
      </SectionToolbar>
      {!balanceSheet ? <EmptyState title="Bilan indisponible" description="Actualisez la Finance pour calculer la position depuis les écritures comptabilisées." /> : (
        <div className="grid gap-5 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <StatementMetric label="Total actif" value={formatAccountingAmount(balanceSheet.totalAssets, balanceSheet.functionalCurrency)} />
            <StatementMetric label="Dettes + capitaux" value={formatAccountingAmount(balanceSheet.totalLiabilitiesAndEquity, balanceSheet.functionalCurrency)} />
            <StatementMetric label="Résultat période" value={formatBalanceSheetResult(balanceSheet)} tone={balanceSheet.currentPeriodResultSide === "loss" ? "warning" : "ok"} />
            <StatementMetric label="Équilibre" value={balanceSheet.reconciled ? "Équilibré" : formatAccountingAmount(balanceSheet.reconciliationDifference, balanceSheet.functionalCurrency)} tone={balanceSheet.reconciled ? "ok" : "warning"} />
          </div>
          <StatementAccountSection title="Actif" rows={balanceSheet.assets.rows} total={balanceSheet.assets.total} currency={balanceSheet.functionalCurrency} empty="Aucun actif comptabilisé à cette date." />
          <StatementAccountSection title="Dettes" rows={balanceSheet.liabilities.rows} total={balanceSheet.liabilities.total} currency={balanceSheet.functionalCurrency} empty="Aucune dette comptabilisée à cette date." />
          <StatementAccountSection title="Capitaux propres" rows={balanceSheet.equity.rows} total={balanceSheet.equity.total} currency={balanceSheet.functionalCurrency} empty="Aucun compte de capitaux propres comptabilisé à cette date." />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
            <p className="text-sm font-black text-hicotech-navy dark:text-white">Formule V1</p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">Actif = Dettes + Capitaux propres + Résultat de la période sélectionnée.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function StatementMetric({ label, tone, value }: { label: string; tone?: "ok" | "warning"; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"><SummaryRow label={label} value={value} tone={tone} /></div>;
}

function StatementAccountSection({ currency, empty, rows, title, total }: {
  currency: string;
  empty: string;
  rows: readonly { account: AccountingAccount; amount: string; debitAmount: string; creditAmount: string }[];
  title: string;
  total: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-hicotech-dark-border">
      <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3 dark:bg-hicotech-dark-page/40">
        <h3 className="font-display text-base font-black">{title}</h3>
        <p className="font-display text-lg font-black">{formatAccountingAmount(total, currency)}</p>
      </div>
      {rows.length === 0 ? <EmptyState title={title} description={empty} /> : (
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-hicotech-dark-border">
          <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Compte</th><th className="px-4 py-3 text-right">Débit</th><th className="px-4 py-3 text-right">Crédit</th><th className="px-4 py-3 text-right">Montant</th></tr></thead>
          <tbody className={tableBodyClassName}>
            {rows.map((row) => (
              <tr key={row.account.id}>
                <td className="px-4 py-3"><p className="font-black">{row.account.code}</p><p className="text-xs font-semibold text-slate-500">{row.account.name}</p></td>
                <td className="px-4 py-3 text-right font-bold">{formatAccountingAmount(row.debitAmount, currency)}</td>
                <td className="px-4 py-3 text-right font-bold">{formatAccountingAmount(row.creditAmount, currency)}</td>
                <td className="px-4 py-3 text-right font-black">{formatAccountingAmount(row.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SalesIntegrationSection({ accounts, invoices, journals, onPost, onSaveSettings, onSettingsChange, payments, saving, settings, statuses }: {
  accounts: readonly AccountingAccount[];
  invoices: readonly Invoice[];
  journals: readonly AccountingJournal[];
  onPost: (kind: "invoice" | "payment", id: string) => void;
  onSaveSettings: () => void;
  onSettingsChange: (settings: CommercialSettingsForm) => void;
  payments: readonly Payment[];
  saving: boolean;
  settings: CommercialSettingsForm;
  statuses: AccountingSnapshot["commercialSources"] | undefined;
}) {
  const accountOptions = accounts.filter((account) => account.active).map((account) => [account.id, `${account.code} · ${account.name}`] as const);
  const salesJournalOptions = journals.filter((journal) => journal.active && (journal.type === "sales" || journal.type === "general")).map((journal) => [journal.id, `${journal.code} · ${journal.name}`] as const);
  const statusByInvoice = new Map((statuses?.invoices ?? []).map((status) => [status.sourceId, status]));
  const statusByPayment = new Map((statuses?.payments ?? []).map((status) => [status.sourceId, status]));
  const readyInvoices = invoices.filter((invoice) => !invoice.archivedAt && invoice.status !== "draft" && invoice.status !== "cancelled");
  const readyPayments = payments.filter((payment) => !payment.archivedAt && payment.status !== "draft" && payment.status !== "cancelled");

  return (
    <section className={panelClassName}>
      <SectionToolbar title="Intégration ventes" description="Comptabilisation contrôlée des factures et règlements commerciaux finalisés.">
        <button type="button" onClick={onSaveSettings} disabled={saving} className={primaryButtonClassName}><Save size={16} /> Enregistrer la configuration</button>
      </SectionToolbar>
      <div className="grid gap-5 p-4">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 md:grid-cols-3">
          <SelectField label="Journal de ventes" value={settings.salesJournalId} onChange={(salesJournalId) => onSettingsChange({ ...settings, salesJournalId })} options={[["", "Choisir un journal"], ...salesJournalOptions]} />
          <SelectField label="Compte clients à recevoir" value={settings.receivableAccountId} onChange={(receivableAccountId) => onSettingsChange({ ...settings, receivableAccountId })} options={[["", "Choisir un compte"], ...accountOptions]} />
          <SelectField label="Compte chiffre d'affaires" value={settings.revenueAccountId} onChange={(revenueAccountId) => onSettingsChange({ ...settings, revenueAccountId })} options={[["", "Choisir un compte"], ...accountOptions]} />
          <SelectField label="Compte de règlement" value={settings.settlementAccountId} onChange={(settlementAccountId) => onSettingsChange({ ...settings, settlementAccountId })} options={[["", "Choisir un compte"], ...accountOptions]} />
          <SelectField label="Compte TVA collectée" value={settings.taxPayableAccountId} onChange={(taxPayableAccountId) => onSettingsChange({ ...settings, taxPayableAccountId })} options={[["", "Non configuré"], ...accountOptions]} />
          <TextField label="Devise fonctionnelle" value={settings.functionalCurrency} onChange={(functionalCurrency) => onSettingsChange({ ...settings, functionalCurrency })} helper="Les écritures V1 refusent les devises différentes." />
        </div>

        <CommercialSourceTable
          title="Factures à comptabiliser"
          emptyTitle="Aucune facture finalisée"
          emptyDescription="Les factures brouillon ou annulées ne créent pas d'historique comptable officiel."
          rows={readyInvoices.map((invoice) => ({
            id: invoice.id,
            number: invoice.number,
            partner: invoice.companyName || invoice.customerName,
            date: invoice.issueDate,
            amount: getInvoiceTotals(invoice).total,
            currency: invoice.currency,
            status: invoice.status,
            postingStatus: statusByInvoice.get(invoice.id),
            actionLabel: "Comptabiliser la facture",
            onPost: () => onPost("invoice", invoice.id)
          }))}
          saving={saving}
        />

        <CommercialSourceTable
          title="Règlements à comptabiliser"
          emptyTitle="Aucun règlement enregistré"
          emptyDescription="Les règlements brouillon ou annulés restent hors comptabilité."
          rows={readyPayments.map((payment) => ({
            id: payment.id,
            number: payment.number,
            partner: payment.customerName,
            date: payment.receivedAt,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            postingStatus: statusByPayment.get(payment.id),
            actionLabel: "Comptabiliser le règlement",
            onPost: () => onPost("payment", payment.id)
          }))}
          saving={saving}
        />
      </div>
    </section>
  );
}

function CommercialSourceTable({ emptyDescription, emptyTitle, rows, saving, title }: {
  emptyDescription: string;
  emptyTitle: string;
  rows: readonly {
    id: string;
    number: string;
    partner: string;
    date: string;
    amount: number;
    currency: string;
    status: string;
    postingStatus?: { status: "not_posted" | "draft" | "posted" | "reversed"; journalEntryNumber?: string };
    actionLabel: string;
    onPost: () => void;
  }[];
  saving: boolean;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-hicotech-dark-border">
      <div className="bg-white px-4 py-3 dark:bg-hicotech-dark-card"><h3 className="font-display text-base font-black">{title}</h3></div>
      <TableShell empty={rows.length === 0} emptyTitle={emptyTitle} emptyDescription={emptyDescription}>
        <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Source</th><th className="px-4 py-3">Tiers</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Statut source</th><th className="px-4 py-3">Comptabilité</th><th className="px-4 py-3 text-right">Montant</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
        <tbody className={tableBodyClassName}>
          {rows.map((row) => {
            const posted = row.postingStatus?.status === "posted";
            const reversed = row.postingStatus?.status === "reversed";
            return (
              <tr key={row.id}>
                <td className="px-4 py-3"><p className="font-black text-hicotech-navy dark:text-white">{row.number}</p></td>
                <td className="px-4 py-3">{row.partner}</td>
                <td className="px-4 py-3">{formatDate(row.date)}</td>
                <td className="px-4 py-3"><StatusBadge label={row.status} tone="muted" /></td>
                <td className="px-4 py-3"><StatusBadge label={reversed ? `Contrepassé · ${row.postingStatus?.journalEntryNumber ?? ""}` : posted ? `Comptabilisé · ${row.postingStatus?.journalEntryNumber ?? ""}` : "Non comptabilisé"} tone={posted ? "ok" : reversed ? "muted" : "warning"} /></td>
                <td className="px-4 py-3 text-right font-black">{formatAccountingAmount(moneyToAmount(row.amount), row.currency)}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={row.onPost} disabled={saving || posted || reversed} className={posted || reversed ? secondaryButtonClassName : primaryButtonClassName} title={reversed ? "Source contrepassee, recomptabilisation différée" : row.actionLabel} aria-label={reversed ? "Source contrepassee, recomptabilisation différée" : row.actionLabel}>
                    <Link2 size={16} /> {reversed ? "Contrepassé" : posted ? "Déjà comptabilisé" : "Comptabiliser"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>
    </div>
  );
}

function ApIntegrationSection({ accounts, journals, onPost, onSaveSettings, onSettingsChange, saving, settings, statuses, supplierBills }: {
  accounts: readonly AccountingAccount[];
  journals: readonly AccountingJournal[];
  onPost: (id: string) => void;
  onSaveSettings: () => void;
  onSettingsChange: (settings: ApSettingsForm) => void;
  saving: boolean;
  settings: ApSettingsForm;
  statuses: AccountingSnapshot["apSources"] | undefined;
  supplierBills: readonly SupplierBill[];
}) {
  const accountOptions = accounts.filter((account) => account.active).map((account) => [account.id, `${account.code} · ${account.name}`] as const);
  const purchaseJournalOptions = journals.filter((journal) => journal.active && (journal.type === "purchase" || journal.type === "general")).map((journal) => [journal.id, `${journal.code} · ${journal.name}`] as const);
  const statusByBill = new Map((statuses?.supplierBills ?? []).map((status) => [status.sourceId, status]));
  const readyBills = supplierBills.filter((bill) => !bill.archivedAt && (bill.status === "finalized" || bill.status === "accounted"));

  return (
    <section className={panelClassName}>
      <SectionToolbar title="Intégration achats" description="Comptabilisation contrôlée des factures fournisseurs finalisées en comptes fournisseurs.">
        <button type="button" onClick={onSaveSettings} disabled={saving} className={primaryButtonClassName}><Save size={16} /> Enregistrer la configuration</button>
      </SectionToolbar>
      <div className="grid gap-5 p-4">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 md:grid-cols-3">
          <SelectField label="Journal d'achats" value={settings.purchaseJournalId} onChange={(purchaseJournalId) => onSettingsChange({ ...settings, purchaseJournalId })} options={[["", "Choisir un journal"], ...purchaseJournalOptions]} />
          <SelectField label="Compte fournisseurs à payer" value={settings.payableAccountId} onChange={(payableAccountId) => onSettingsChange({ ...settings, payableAccountId })} options={[["", "Choisir un compte"], ...accountOptions]} />
          <SelectField label="Compte achats / charges" value={settings.expenseAccountId} onChange={(expenseAccountId) => onSettingsChange({ ...settings, expenseAccountId })} options={[["", "Choisir un compte"], ...accountOptions]} />
          <SelectField label="Compte de règlement" value={settings.settlementAccountId} onChange={(settlementAccountId) => onSettingsChange({ ...settings, settlementAccountId })} options={[["", "Optionnel en V1"], ...accountOptions]} />
          <SelectField label="Compte TVA récupérable" value={settings.taxRecoverableAccountId} onChange={(taxRecoverableAccountId) => onSettingsChange({ ...settings, taxRecoverableAccountId })} options={[["", "Non configuré"], ...accountOptions]} />
          <TextField label="Devise fonctionnelle" value={settings.functionalCurrency} onChange={(functionalCurrency) => onSettingsChange({ ...settings, functionalCurrency })} helper="Les écritures AP V1 refusent les devises différentes." />
        </div>

        <ApSourceTable
          title="Factures fournisseurs à comptabiliser"
          emptyTitle="Aucune facture fournisseur finalisée"
          emptyDescription="Les factures fournisseur brouillon restent côté Achats tant qu'elles ne sont pas finalisées."
          rows={readyBills.map((bill) => {
            const totals = calculateSupplierBillTotals(bill);
            return {
              id: bill.id,
              number: bill.number,
              partner: bill.supplierName,
              date: bill.billDate,
              amount: totals.total,
              currency: bill.currency,
              status: bill.status,
              postingStatus: statusByBill.get(bill.id),
              actionLabel: "Comptabiliser la facture fournisseur",
              onPost: () => onPost(bill.id)
            };
          })}
          saving={saving}
        />

        <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border dark:text-slate-300">
          Les règlements fournisseurs AP sont différés en V1 : le modèle legacy CashEntry n&apos;est pas relié aux factures fournisseurs Procurement.
        </div>
      </div>
    </section>
  );
}

function ApSourceTable({ emptyDescription, emptyTitle, rows, saving, title }: {
  emptyDescription: string;
  emptyTitle: string;
  rows: readonly {
    id: string;
    number: string;
    partner: string;
    date: string;
    amount: number;
    currency: string;
    status: string;
    postingStatus?: { status: "not_posted" | "draft" | "posted" | "reversed"; journalEntryNumber?: string };
    actionLabel: string;
    onPost: () => void;
  }[];
  saving: boolean;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-hicotech-dark-border">
      <div className="bg-white px-4 py-3 dark:bg-hicotech-dark-card"><h3 className="font-display text-base font-black">{title}</h3></div>
      <TableShell empty={rows.length === 0} emptyTitle={emptyTitle} emptyDescription={emptyDescription}>
        <thead className={tableHeadClassName}><tr><th className="px-4 py-3">Source</th><th className="px-4 py-3">Fournisseur</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Statut source</th><th className="px-4 py-3">Comptabilité</th><th className="px-4 py-3 text-right">Montant</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
        <tbody className={tableBodyClassName}>
          {rows.map((row) => {
            const posted = row.postingStatus?.status === "posted";
            const reversed = row.postingStatus?.status === "reversed";
            return (
              <tr key={row.id}>
                <td className="px-4 py-3"><p className="font-black text-hicotech-navy dark:text-white">{row.number}</p></td>
                <td className="px-4 py-3">{row.partner}</td>
                <td className="px-4 py-3">{formatDate(row.date)}</td>
                <td className="px-4 py-3"><StatusBadge label={row.status === "finalized" ? "Finalisée" : row.status === "accounted" ? "Comptabilisée" : row.status} tone="muted" /></td>
                <td className="px-4 py-3"><StatusBadge label={reversed ? `Contrepassé · ${row.postingStatus?.journalEntryNumber ?? ""}` : posted ? `Comptabilisé · ${row.postingStatus?.journalEntryNumber ?? ""}` : "Non comptabilisé"} tone={posted ? "ok" : reversed ? "muted" : "warning"} /></td>
                <td className="px-4 py-3 text-right font-black">{formatAccountingAmount(moneyToAmount(row.amount), row.currency)}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={row.onPost} disabled={saving || posted || reversed} className={posted || reversed ? secondaryButtonClassName : primaryButtonClassName} title={reversed ? "Source contrepassee, recomptabilisation différée" : row.actionLabel} aria-label={reversed ? "Source contrepassee, recomptabilisation différée" : row.actionLabel}>
                    <ShoppingCart size={16} /> {reversed ? "Contrepassé" : posted ? "Déjà comptabilisé" : "Comptabiliser"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>
    </div>
  );
}

function AccountFormFields({ form, onChange }: { form: AccountForm; onChange: (form: AccountForm) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Code" value={form.code} onChange={(code) => onChange({ ...form, code })} required />
      <TextField label="Nom" value={form.name} onChange={(name) => onChange({ ...form, name })} required />
      <SelectField label="Type" value={form.type} onChange={(type) => onChange({ ...form, type: type as AccountingAccountType })} options={Object.entries(accountTypeLabels)} />
      <SelectField label="Sens normal" value={form.normalBalance} onChange={(normalBalance) => onChange({ ...form, normalBalance: normalBalance as AccountingNormalBalance })} options={[["debit", "Débit"], ["credit", "Crédit"]]} />
      <TextField label="Devise" value={form.currency} onChange={(currency) => onChange({ ...form, currency })} helper="Code ISO, par exemple MAD." />
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-hicotech-dark-border"><input type="checkbox" checked={form.active} onChange={(event) => onChange({ ...form, active: event.target.checked })} /> Compte actif</label>
    </div>
  );
}

function JournalFormFields({ form, onChange }: { form: JournalForm; onChange: (form: JournalForm) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Code" value={form.code} onChange={(code) => onChange({ ...form, code })} required />
      <TextField label="Nom" value={form.name} onChange={(name) => onChange({ ...form, name })} required />
      <SelectField label="Type" value={form.type} onChange={(type) => onChange({ ...form, type: type as AccountingJournalType })} options={Object.entries(journalTypeLabels)} />
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-hicotech-dark-border"><input type="checkbox" checked={form.active} onChange={(event) => onChange({ ...form, active: event.target.checked })} /> Journal actif</label>
    </div>
  );
}

function PeriodFormFields({ form, onChange }: { form: PeriodForm; onChange: (form: PeriodForm) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Nom" value={form.name} onChange={(name) => onChange({ ...form, name })} helper="Exemple : Août 2026 ou Exercice T1." required />
      <SelectField label="Statut" value={form.status} onChange={(status) => onChange({ ...form, status: status as AccountingPeriodStatus })} options={[["open", "Ouverte"], ["closed", "Fermée"]]} />
      <TextField label="Date de début" type="date" value={form.startDate} onChange={(startDate) => onChange({ ...form, startDate })} required />
      <TextField label="Date de fin" type="date" value={form.endDate} onChange={(endDate) => onChange({ ...form, endDate })} required />
    </div>
  );
}

function ReversalFormFields({ form, onChange }: { form: ReversalForm; onChange: (form: ReversalForm) => void }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
        <p className="font-black">{form.entry?.number ?? "Écriture"}</p>
        <p className="mt-1">La contrepassation inverse les débits et crédits. L&apos;écriture d&apos;origine reste visible et protégée.</p>
      </div>
      <TextField label="Date de contrepassation" type="date" value={form.reversalDate} onChange={(reversalDate) => onChange({ ...form, reversalDate })} helper="Choisissez une date appartenant à une période ouverte." required />
      <TextField label="Raison" value={form.reason} onChange={(reason) => onChange({ ...form, reason })} helper="Exemple : mauvais compte, montant incorrect, document annulé." required />
    </div>
  );
}

function EntryFormFields({ accounts, form, journals, onChange, readOnly, totals }: {
  accounts: readonly AccountingAccount[];
  form: EntryForm;
  journals: readonly AccountingJournal[];
  onChange: (form: EntryForm) => void;
  readOnly?: boolean;
  totals: { debitTotal: string; creditTotal: string; difference: string; balanced: boolean };
}) {
  function updateLine(id: string, patch: Partial<EntryLineForm>) {
    onChange({ ...form, lines: form.lines.map((line) => line.id === id ? { ...line, ...patch } : line) });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        <SelectField label="Journal" value={form.journalId} disabled={readOnly} onChange={(journalId) => onChange({ ...form, journalId })} options={journals.map((journal) => [journal.id, `${journal.code} · ${journal.name}`])} />
        <TextField label="Date comptable" type="date" value={form.entryDate} disabled={readOnly} onChange={(entryDate) => onChange({ ...form, entryDate })} />
        <TextField label="Numéro" value={form.number} disabled={readOnly} onChange={(number) => onChange({ ...form, number })} />
        <TextField label="Référence" value={form.reference} disabled={readOnly} onChange={(reference) => onChange({ ...form, reference })} />
        <div className="md:col-span-4"><TextField label="Description" value={form.description} disabled={readOnly} onChange={(description) => onChange({ ...form, description })} /></div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-hicotech-dark-border">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Compte</th><th className="px-3 py-3">Libellé</th><th className="px-3 py-3 text-right">Débit</th><th className="px-3 py-3 text-right">Crédit</th><th className="px-3 py-3 text-right">Action</th></tr></thead>
          <tbody className={tableBodyClassName}>
            {form.lines.map((line) => (
              <tr key={line.id}>
                <td className="px-3 py-2">
                  <select disabled={readOnly} value={line.accountId} onChange={(event) => updateLine(line.id, { accountId: event.target.value })} className={inputClassName}>
                    <option value="">Choisir un compte</option>
                    {accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2"><input disabled={readOnly} value={line.label} onChange={(event) => updateLine(line.id, { label: event.target.value })} className={inputClassName} placeholder="Libellé de ligne" /></td>
                <td className="px-3 py-2"><input disabled={readOnly} value={line.debitAmount} onChange={(event) => updateLine(line.id, { debitAmount: event.target.value })} className={`${inputClassName} text-right`} inputMode="decimal" placeholder="0.00" /></td>
                <td className="px-3 py-2"><input disabled={readOnly} value={line.creditAmount} onChange={(event) => updateLine(line.id, { creditAmount: event.target.value })} className={`${inputClassName} text-right`} inputMode="decimal" placeholder="0.00" /></td>
                <td className="px-3 py-2 text-right"><button type="button" disabled={readOnly || form.lines.length <= 2} onClick={() => onChange({ ...form, lines: form.lines.filter((candidate) => candidate.id !== line.id) })} className={iconButtonClassName} title="Supprimer la ligne" aria-label="Supprimer la ligne"><Archive size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && <button type="button" onClick={() => onChange({ ...form, lines: [...form.lines, createEmptyLine()] })} className={secondaryButtonClassName}><Plus size={16} /> Ajouter une ligne</button>}
      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 sm:grid-cols-4">
        <SummaryRow label="Total débit" value={formatAccountingAmount(totals.debitTotal, form.functionalCurrency)} />
        <SummaryRow label="Total crédit" value={formatAccountingAmount(totals.creditTotal, form.functionalCurrency)} />
        <SummaryRow label="Différence" value={formatAccountingAmount(totals.difference, form.functionalCurrency)} tone={totals.balanced ? "ok" : "warning"} />
        <SummaryRow label="Équation" value={totals.balanced ? "Équilibrée" : "À équilibrer"} tone={totals.balanced ? "ok" : "warning"} />
      </div>
    </div>
  );
}

function DialogFooter({ onCancel, primaryLabel, saving }: { onCancel: () => void; primaryLabel: string; saving: boolean }) {
  return <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-hicotech-dark-border"><button type="button" onClick={onCancel} className={secondaryButtonClassName}>Annuler</button><button type="submit" disabled={saving} className={primaryButtonClassName}><Save size={16} /> {saving ? "Enregistrement..." : primaryLabel}</button></div>;
}

function EntryDialogFooter({ onCancel, onPost, posted, saving, totals }: { onCancel: () => void; onPost?: () => void; posted?: boolean; saving: boolean; totals: { balanced: boolean } }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-hicotech-dark-border">
      <button type="button" onClick={onCancel} className={secondaryButtonClassName}>Fermer</button>
      {!posted && <button type="submit" disabled={saving} className={secondaryButtonClassName}><Save size={16} /> Enregistrer brouillon</button>}
      {!posted && onPost && <button type="button" onClick={onPost} disabled={saving || !totals.balanced} className={primaryButtonClassName}><CheckCircle2 size={16} /> Comptabiliser</button>}
    </div>
  );
}

function SectionToolbar({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-display text-lg font-black">{title}</h2><p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{description}</p></div><div className="flex flex-wrap gap-2">{children}</div></div>;
}

function SearchControl({ onChange, placeholder, value }: { onChange: (value: string) => void; placeholder: string; value: string }) {
  return <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${inputClassName} min-w-[18rem] pl-9`} /></label>;
}

function DateControls({ fromDate, onFromDateChange, onToDateChange, toDate }: { fromDate: string; onFromDateChange: (value: string) => void; onToDateChange: (value: string) => void; toDate: string }) {
  return <><input type="date" value={fromDate} onChange={(event) => onFromDateChange(event.target.value)} className={inputClassName} aria-label="Date de début" title="Date de début" /><input type="date" value={toDate} onChange={(event) => onToDateChange(event.target.value)} className={inputClassName} aria-label="Date de fin" title="Date de fin" /></>;
}

function TableShell({ children, empty, emptyDescription, emptyTitle }: { children: React.ReactNode; empty: boolean; emptyDescription: string; emptyTitle: string }) {
  return <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-hicotech-dark-border">{children}</table>{empty && <EmptyState title={emptyTitle} description={emptyDescription} />}</div>;
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return <div className="grid place-items-center px-4 py-10 text-center"><Scale className="mb-3 text-slate-400" size={28} /><p className="font-display text-base font-black text-hicotech-navy dark:text-white">{title}</p><p className="mt-1 max-w-xl text-sm font-semibold text-slate-500 dark:text-slate-300">{description}</p></div>;
}

function NoticeBanner({ notice }: { notice: Notice }) {
  return <div className={clsx("rounded-2xl border px-4 py-3 text-sm font-bold", notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200" : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200")}>{notice.message}</div>;
}

function StatusBadge({ label, tone }: { label: string; tone: "ok" | "warning" | "muted" }) {
  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-black", tone === "ok" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200", tone === "warning" && "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200", tone === "muted" && "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300")}>{label}</span>;
}

function getEntryStatusLabel(entry: AccountingJournalEntry) {
  if (entry.reversalOfEntryId || entry.sourceType === "accounting.reversal") return "Contrepassation";
  if (entry.reversedByEntryId) return "Contrepassée";
  return statusLabels[entry.status];
}

function SummaryRow({ label, tone, value }: { label: string; tone?: "ok" | "warning"; value: string }) {
  return <div><p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p><p className={clsx("mt-1 font-display text-base font-black", tone === "ok" && "text-emerald-700 dark:text-emerald-200", tone === "warning" && "text-amber-700 dark:text-amber-200", !tone && "text-hicotech-navy dark:text-white")}>{value}</p></div>;
}

function ActionButton({ disabled, label, onClick }: { disabled?: boolean; label: string; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex min-h-10 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">{label}<Plus size={16} /></button>;
}

function TextField({ disabled, helper, label, onChange, required, type = "text", value }: { disabled?: boolean; helper?: string; label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return <label className="block text-sm font-bold text-hicotech-navy dark:text-white">{label}{required && <span className="text-red-500"> *</span>}<input disabled={disabled} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClassName} mt-1 w-full`} />{helper && <span className="mt-1 block text-xs font-semibold text-slate-500">{helper}</span>}</label>;
}

function SelectField({ disabled, label, onChange, options, value }: { disabled?: boolean; label: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[]; value: string }) {
  return <label className="block text-sm font-bold text-hicotech-navy dark:text-white">{label}<select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClassName} mt-1 w-full`}>{options.map(([id, labelValue]) => <option key={id} value={id}>{labelValue}</option>)}</select></label>;
}

function settingsToForm(settings?: AccountingCommercialPostingSettings): CommercialSettingsForm {
  return {
    salesJournalId: settings?.salesJournalId ?? "",
    receivableAccountId: settings?.receivableAccountId ?? "",
    revenueAccountId: settings?.revenueAccountId ?? "",
    settlementAccountId: settings?.settlementAccountId ?? "",
    taxPayableAccountId: settings?.taxPayableAccountId ?? "",
    functionalCurrency: settings?.functionalCurrency ?? DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY
  };
}

function apSettingsToForm(settings?: AccountingApPostingSettings): ApSettingsForm {
  return {
    purchaseJournalId: settings?.purchaseJournalId ?? "",
    payableAccountId: settings?.payableAccountId ?? "",
    expenseAccountId: settings?.expenseAccountId ?? "",
    settlementAccountId: settings?.settlementAccountId ?? "",
    taxRecoverableAccountId: settings?.taxRecoverableAccountId ?? "",
    functionalCurrency: settings?.functionalCurrency ?? DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY
  };
}

function optionalId(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

async function loadSalesSources(): Promise<Pick<CrmSalesPersistenceSnapshot, "invoices" | "payments">> {
  const response = await fetch("/api/persistence/crm-sales", {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) return { invoices: [], payments: [] };
  const snapshot = await response.json() as CrmSalesPersistenceSnapshot;
  return { invoices: snapshot.invoices ?? [], payments: snapshot.payments ?? [] };
}

async function loadProcurementSources(): Promise<Pick<ProcurementSnapshot, "supplierBills">> {
  const response = await fetch("/api/persistence/procurement", {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) return { supplierBills: [] };
  const snapshot = await response.json() as ProcurementSnapshot;
  return { supplierBills: snapshot.supplierBills ?? [] };
}

function createEmptyEntryForm(journalId = ""): EntryForm {
  return {
    journalId,
    number: `JE-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    entryDate: new Date().toISOString().slice(0, 10),
    reference: "",
    description: "",
    functionalCurrency: DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY,
    lines: [createEmptyLine(), createEmptyLine()]
  };
}

function createEmptyLine(): EntryLineForm {
  return { id: createId("line"), accountId: "", label: "", debitAmount: "0.00", creditAmount: "0.00" };
}

function recordToEntryForm(entry: AccountingJournalEntry): EntryForm {
  return {
    id: entry.id,
    journalId: entry.journalId,
    number: entry.number,
    entryDate: entry.entryDate.slice(0, 10),
    reference: entry.reference ?? "",
    description: entry.description ?? "",
    functionalCurrency: entry.functionalCurrency,
    lines: entry.lines.map((line) => ({
      id: line.id,
      accountId: line.accountId,
      label: line.label,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount
    }))
  };
}

function entryFormToRecord(form: EntryForm, status: AccountingJournalEntry["status"]): AccountingJournalEntry {
  const now = new Date().toISOString();
  const lines = form.lines.map((line): AccountingJournalEntryLine => ({
    id: line.id as AccountingJournalEntryLine["id"],
    accountId: line.accountId as AccountingAccountId,
    label: line.label.trim() || "Ligne comptable",
    debitAmount: normalizeAmountInput(line.debitAmount) as AccountingAmount,
    creditAmount: normalizeAmountInput(line.creditAmount) as AccountingAmount
  }));
  const totals = calculateJournalEntryTotals(lines);
  return {
    id: form.id ?? createId("entry"),
    tenantCompanyId: "" as AccountingJournalEntry["tenantCompanyId"],
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: form.journalId as AccountingJournalId,
    number: form.number.trim() || `JE-${Date.now()}`,
    entryDate: new Date(form.entryDate).toISOString(),
    status,
    description: form.description.trim() || undefined,
    reference: form.reference.trim() || undefined,
    sourceType: "manual",
    functionalCurrency: form.functionalCurrency,
    debitTotal: totals.debitTotal,
    creditTotal: totals.creditTotal,
    lines,
    createdAt: now,
    updatedAt: now
  };
}

function preserveEntryCreation(entry: AccountingJournalEntry, existing: AccountingJournalEntry | null) {
  if (!existing) return entry;
  return {
    ...entry,
    createdAt: existing.createdAt,
    createdBy: existing.createdBy
  };
}

function safeEntryTotals(lines: readonly EntryLineForm[]) {
  const debitMinor = lines.reduce((sum, line) => sum + safeMinor(line.debitAmount), BigInt(0));
  const creditMinor = lines.reduce((sum, line) => sum + safeMinor(line.creditAmount), BigInt(0));
  const differenceMinor = debitMinor > creditMinor ? debitMinor - creditMinor : creditMinor - debitMinor;
  return {
    debitTotal: minorToAmount(debitMinor),
    creditTotal: minorToAmount(creditMinor),
    difference: minorToAmount(differenceMinor),
    balanced: debitMinor === creditMinor && debitMinor > BigInt(0)
  };
}

function safeMinor(value: string) {
  try {
    return accountingAmountToMinorUnits(normalizeAmountInput(value));
  } catch {
    return BigInt(0);
  }
}

function minorToAmount(value: bigint) {
  const units = value / BigInt(100);
  const decimals = value % BigInt(100);
  return `${units.toString()}.${decimals.toString().padStart(2, "0")}`;
}

function moneyToAmount(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0.00";
  return minorToAmount(BigInt(Math.round(value * 100)));
}

function normalizeAmountInput(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return "0.00";
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return "0.00";
  const [units, decimals = ""] = trimmed.split(".");
  return `${Number(units)}.${decimals.padEnd(2, "0")}`;
}

function formatAccountingAmount(amount: string, currency: string) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(amount));
}

function formatSignedResult(report: ProfitLossReport | null) {
  if (!report) return formatAccountingAmount("0.00", DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY);
  const value = formatAccountingAmount(report.netResult, report.functionalCurrency);
  if (report.netResultSide === "loss") return `-${value}`;
  return value;
}

function formatBalanceSheetResult(report: BalanceSheetReport) {
  const value = formatAccountingAmount(report.currentPeriodResult, report.functionalCurrency);
  if (report.currentPeriodResultSide === "loss") return `-${value}`;
  return value;
}

function formatBalance(balance: { balanceAmount: AccountingAmount; balanceSide: "debit" | "credit" | "zero" }, currency: string) {
  if (balance.balanceSide === "zero") return formatAccountingAmount(balance.balanceAmount, currency);
  return `${formatAccountingAmount(balance.balanceAmount, currency)} ${balance.balanceSide === "debit" ? "Db" : "Cr"}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(value));
}

function normalizeSearch(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}` as never;
}

const panelClassName = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card";
const inputClassName = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-hicotech-navy outline-none transition focus:border-hicotech-blue focus:ring-4 focus:ring-hicotech-blue/10 disabled:bg-slate-100 disabled:text-slate-400 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white dark:disabled:bg-white/5";
const primaryButtonClassName = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)] transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClassName = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-slate-200";
const iconButtonClassName = "grid size-9 place-items-center rounded-lg border border-slate-200 text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page/50";
const tableHeadClassName = "bg-slate-50 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:bg-hicotech-dark-page/40";
const tableBodyClassName = "divide-y divide-slate-100 text-slate-600 dark:divide-hicotech-dark-border/70 dark:text-slate-300";
