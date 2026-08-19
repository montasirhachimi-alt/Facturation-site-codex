"use client";

import type {
  AccountingAccount,
  AccountingApPostingSettings,
  AccountingCommercialPostingSettings,
  AccountingInventoryPostingSettings,
  AccountingJournal,
  AccountingJournalEntry,
  AccountingJournalEntryId,
  AccountingPeriod,
  AccountingPeriodId,
  AccountingSnapshot,
  BalanceSheetReport,
  GeneralLedgerReport,
  ProfitLossReport,
  TrialBalanceReport
} from "@/modules/accounting";

export type AccountingPersistenceResource = "account" | "journal" | "journalEntryDraft" | "period";
export type AccountingReportPayload = Readonly<{
  fromDate?: string;
  toDate?: string;
  accountIds?: readonly string[];
  journalIds?: readonly string[];
}>;

export async function loadAccountingPersistenceSnapshot() {
  const response = await fetch("/api/persistence/accounting", {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Chargement comptable impossible.");
  }
  return await response.json() as AccountingSnapshot;
}

export async function persistAccountingRecord(resource: "account", record: AccountingAccount): Promise<{ record: AccountingAccount; snapshot: AccountingSnapshot }>;
export async function persistAccountingRecord(resource: "journal", record: AccountingJournal): Promise<{ record: AccountingJournal; snapshot: AccountingSnapshot }>;
export async function persistAccountingRecord(resource: "journalEntryDraft", record: AccountingJournalEntry): Promise<{ record: AccountingJournalEntry; snapshot: AccountingSnapshot }>;
export async function persistAccountingRecord(resource: "period", record: AccountingPeriod): Promise<{ record: AccountingPeriod; snapshot: AccountingSnapshot }>;
export async function persistAccountingRecord(resource: AccountingPersistenceResource, record: unknown) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ resource, record })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Sauvegarde comptable impossible.");
  }
  return await response.json() as { record: unknown; snapshot: AccountingSnapshot };
}

export async function reverseAccountingJournalEntry(payload: { entryId: AccountingJournalEntryId; reversalDate: string; reason: string }) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "reverseJournalEntry", payload })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Contrepassation impossible.");
  }
  return await response.json() as { record: AccountingJournalEntry; snapshot: AccountingSnapshot };
}

export async function closeAccountingPeriod(id: AccountingPeriodId) {
  return transitionAccountingPeriod("closeAccountingPeriod", id);
}

export async function reopenAccountingPeriod(id: AccountingPeriodId) {
  return transitionAccountingPeriod("reopenAccountingPeriod", id);
}

export async function postAccountingJournalEntry(id: AccountingJournalEntryId) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "postJournalEntry", payload: id })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Comptabilisation impossible.");
  }
  return await response.json() as { record: AccountingJournalEntry; snapshot: AccountingSnapshot };
}

export async function saveCommercialPostingSettings(settings: AccountingCommercialPostingSettings) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "saveCommercialPostingSettings", payload: settings })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Configuration commerciale non enregistrée.");
  }
  return await response.json() as { record: AccountingCommercialPostingSettings; snapshot: AccountingSnapshot };
}

export async function saveApPostingSettings(settings: AccountingApPostingSettings) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "saveApPostingSettings", payload: settings })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Configuration achats non enregistrée.");
  }
  return await response.json() as { record: AccountingApPostingSettings; snapshot: AccountingSnapshot };
}

export async function saveInventoryPostingSettings(settings: AccountingInventoryPostingSettings) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "saveInventoryPostingSettings", payload: settings })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Configuration stock non enregistrée.");
  }
  return await response.json() as { record: AccountingInventoryPostingSettings; snapshot: AccountingSnapshot };
}

export async function postSalesInvoiceToAccounting(invoiceId: string) {
  return postCommercialSource("postSalesInvoice", invoiceId);
}

export async function postSalesPaymentToAccounting(paymentId: string) {
  return postCommercialSource("postSalesPayment", paymentId);
}

export async function postSupplierBillToAccounting(supplierBillId: string) {
  return postCommercialSource("postSupplierBill", supplierBillId);
}

export async function postInventoryCogsToAccounting(valuationEventId: string) {
  return postCommercialSource("postInventoryCogs", valuationEventId);
}

export async function postInventoryReceiptToAccounting(valuationEventId: string) {
  return postCommercialSource("postInventoryReceipt", valuationEventId);
}

export async function getAccountingGeneralLedger(payload: AccountingReportPayload = {}) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "getGeneralLedger", payload })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Grand livre indisponible.");
  }
  const body = await response.json() as { report: GeneralLedgerReport };
  return body.report;
}

export async function getAccountingTrialBalance(payload: AccountingReportPayload = {}) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "getTrialBalance", payload })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Balance indisponible.");
  }
  const body = await response.json() as { report: TrialBalanceReport };
  return body.report;
}

export async function getAccountingProfitLoss(payload: AccountingReportPayload = {}) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "getProfitLoss", payload })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Compte de résultat indisponible.");
  }
  const body = await response.json() as { report: ProfitLossReport };
  return body.report;
}

export async function getAccountingBalanceSheet(payload: AccountingReportPayload & { asOfDate?: string } = {}) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation: "getBalanceSheet", payload })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Bilan indisponible.");
  }
  const body = await response.json() as { report: BalanceSheetReport };
  return body.report;
}

async function postCommercialSource(operation: "postSalesInvoice" | "postSalesPayment" | "postSupplierBill" | "postInventoryReceipt" | "postInventoryCogs", sourceId: string) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation, payload: sourceId })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Comptabilisation commerciale impossible.");
  }
  return await response.json() as { record: AccountingJournalEntry; snapshot: AccountingSnapshot };
}

async function transitionAccountingPeriod(operation: "closeAccountingPeriod" | "reopenAccountingPeriod", id: AccountingPeriodId) {
  const response = await fetch("/api/persistence/accounting", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ operation, payload: id })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Changement de periode comptable impossible.");
  }
  return await response.json() as { record: AccountingPeriod; snapshot: AccountingSnapshot };
}
