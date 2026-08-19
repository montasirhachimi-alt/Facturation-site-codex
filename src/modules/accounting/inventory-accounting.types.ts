import type { InventoryValuationEvent } from "@/modules/inventory";
import type { AccountingInventoryPostingSettings, AccountingJournalEntry, AccountingTenantCompanyId } from "./accounting.types";

export type InventoryAccountingContext = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  workspaceId: AccountingJournalEntry["workspaceId"];
  userId?: AccountingJournalEntry["postedBy"];
  now?: () => string;
}>;

export type InventoryCogsAccountingContext = InventoryAccountingContext;
export type InventoryReceiptAccountingContext = InventoryAccountingContext;

export type InventoryCogsAccountingSource = InventoryValuationEvent;
export type InventoryReceiptAccountingSource = InventoryValuationEvent;

export type InventoryCogsAccountingInput = Readonly<{
  valuationEvent: InventoryCogsAccountingSource;
  settings: AccountingInventoryPostingSettings;
  context: InventoryCogsAccountingContext;
}>;

export type InventoryReceiptAccountingInput = Readonly<{
  valuationEvent: InventoryReceiptAccountingSource;
  settings: AccountingInventoryPostingSettings;
  context: InventoryReceiptAccountingContext;
}>;
