import type { InventoryValuationEvent } from "@/modules/inventory";
import type { AccountingInventoryPostingSettings, AccountingJournalEntry, AccountingTenantCompanyId } from "./accounting.types";

export type InventoryCogsAccountingContext = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  workspaceId: AccountingJournalEntry["workspaceId"];
  userId?: AccountingJournalEntry["postedBy"];
  now?: () => string;
}>;

export type InventoryCogsAccountingSource = InventoryValuationEvent;

export type InventoryCogsAccountingInput = Readonly<{
  valuationEvent: InventoryCogsAccountingSource;
  settings: AccountingInventoryPostingSettings;
  context: InventoryCogsAccountingContext;
}>;
