import type { AccountingWorkspaceId } from "./accounting.types";

export const ACCOUNTING_WORKSPACE_ID = "accounting-main" as AccountingWorkspaceId;
export const DEFAULT_ACCOUNTING_FUNCTIONAL_CURRENCY = "MAD";
export const ACCOUNTING_AMOUNT_SCALE = 2;

export const ACCOUNTING_ACCOUNT_TYPES = Object.freeze(["asset", "liability", "equity", "income", "expense"] as const);
export const ACCOUNTING_JOURNAL_TYPES = Object.freeze(["sales", "purchase", "bank", "cash", "general"] as const);
export const ACCOUNTING_JOURNAL_ENTRY_STATUSES = Object.freeze(["draft", "posted"] as const);
