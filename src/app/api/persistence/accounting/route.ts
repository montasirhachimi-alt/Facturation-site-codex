import { NextResponse } from "next/server";
import {
  getAccountingGeneralLedger,
  getAccountingBalanceSheet,
  getAccountingProfitLoss,
  getAccountingTrialBalance,
  loadAccountingSnapshot,
  persistAccountingRecord,
  persistApPostingSettings,
  persistCommercialPostingSettings,
  persistInventoryPostingSettings,
  postAccountingEntry,
  postInventoryCogsToAccounting,
  postInventoryReceiptValuationToAccounting,
  postSalesInvoiceToAccounting,
  postSalesPaymentToAccounting,
  postSupplierBillToAccounting,
  postSupplierPaymentToAccounting,
  closeAccountingPeriod,
  reopenAccountingPeriod,
  reverseAccountingEntry,
  type AccountingPersistenceResource
} from "@/server/persistence/accounting-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";
import type {
  AccountingAccountId,
  AccountingJournalEntryId,
  AccountingJournalId,
  AccountingReportDateScope
} from "@/modules/accounting";

const resources = new Set<AccountingPersistenceResource>(["account", "journal", "journalEntryDraft", "period"]);

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    const snapshot = await loadAccountingSnapshot(scope);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as {
      operation?: "postJournalEntry" | "reverseJournalEntry" | "closeAccountingPeriod" | "reopenAccountingPeriod" | "getGeneralLedger" | "getTrialBalance" | "getProfitLoss" | "getBalanceSheet" | "saveCommercialPostingSettings" | "saveApPostingSettings" | "saveInventoryPostingSettings" | "postSalesInvoice" | "postSalesPayment" | "postSupplierBill" | "postSupplierPayment" | "postInventoryReceipt" | "postInventoryCogs";
      payload?: AccountingJournalEntryId | string | (AccountingReportDateScope & { accountIds?: readonly string[]; journalIds?: readonly string[]; asOfDate?: string }) | unknown;
      resource?: AccountingPersistenceResource;
      record?: unknown;
    };

    if (body.operation === "getGeneralLedger") {
      const report = await getAccountingGeneralLedger(scope, normalizeReportPayload(body.payload));
      return NextResponse.json({ report });
    }

    if (body.operation === "getTrialBalance") {
      const report = await getAccountingTrialBalance(scope, normalizeReportPayload(body.payload));
      return NextResponse.json({ report });
    }

    if (body.operation === "getProfitLoss") {
      const report = await getAccountingProfitLoss(scope, normalizeReportPayload(body.payload));
      return NextResponse.json({ report });
    }

    if (body.operation === "getBalanceSheet") {
      const report = await getAccountingBalanceSheet(scope, normalizeReportPayload(body.payload));
      return NextResponse.json({ report });
    }

    if (body.operation === "postJournalEntry" && body.payload) {
      const record = await postAccountingEntry(scope, body.payload as AccountingJournalEntryId);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "reverseJournalEntry" && isReversalPayload(body.payload)) {
      const record = await reverseAccountingEntry(scope, body.payload);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "closeAccountingPeriod" && typeof body.payload === "string") {
      const record = await closeAccountingPeriod(scope, body.payload as never);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "reopenAccountingPeriod" && typeof body.payload === "string") {
      const record = await reopenAccountingPeriod(scope, body.payload as never);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "saveCommercialPostingSettings" && body.payload) {
      const record = await persistCommercialPostingSettings(scope, body.payload as never);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "saveApPostingSettings" && body.payload) {
      const record = await persistApPostingSettings(scope, body.payload as never);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "saveInventoryPostingSettings" && body.payload) {
      const record = await persistInventoryPostingSettings(scope, body.payload as never);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "postSalesInvoice" && typeof body.payload === "string") {
      const record = await postSalesInvoiceToAccounting(scope, body.payload);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "postSalesPayment" && typeof body.payload === "string") {
      const record = await postSalesPaymentToAccounting(scope, body.payload);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "postSupplierBill" && typeof body.payload === "string") {
      const record = await postSupplierBillToAccounting(scope, body.payload);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "postSupplierPayment" && typeof body.payload === "string") {
      const record = await postSupplierPaymentToAccounting(scope, body.payload);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "postInventoryCogs" && typeof body.payload === "string") {
      const record = await postInventoryCogsToAccounting(scope, body.payload);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (body.operation === "postInventoryReceipt" && typeof body.payload === "string") {
      const record = await postInventoryReceiptValuationToAccounting(scope, body.payload);
      const snapshot = await loadAccountingSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }

    if (!body.resource || !resources.has(body.resource) || !body.record) {
      return NextResponse.json({ error: "Payload comptable invalide." }, { status: 400 });
    }

    const record = await persistAccountingRecord(scope, body.resource, body.record);
    const snapshot = await loadAccountingSnapshot(scope);
    return NextResponse.json({ record, snapshot });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function isReversalPayload(payload: unknown): payload is { entryId: AccountingJournalEntryId; reversalDate: string; reason: string } {
  if (!payload || typeof payload !== "object") return false;
  const source = payload as { entryId?: unknown; reversalDate?: unknown; reason?: unknown };
  return typeof source.entryId === "string" && typeof source.reversalDate === "string" && typeof source.reason === "string";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur comptable inconnue.";
}

function normalizeReportPayload(payload: unknown): AccountingReportDateScope & {
  accountIds?: readonly AccountingAccountId[];
  journalIds?: readonly AccountingJournalId[];
  asOfDate?: string;
} {
  if (!payload || typeof payload !== "object") return {};
  const source = payload as AccountingReportDateScope & { accountIds?: readonly string[]; journalIds?: readonly string[]; asOfDate?: string };
  return {
    fromDate: typeof source.fromDate === "string" ? source.fromDate : undefined,
    toDate: typeof source.toDate === "string" ? source.toDate : undefined,
    asOfDate: typeof source.asOfDate === "string" ? source.asOfDate : undefined,
    accountIds: Array.isArray(source.accountIds) ? source.accountIds.map((id) => id as AccountingAccountId) : undefined,
    journalIds: Array.isArray(source.journalIds) ? source.journalIds.map((id) => id as AccountingJournalId) : undefined
  };
}
