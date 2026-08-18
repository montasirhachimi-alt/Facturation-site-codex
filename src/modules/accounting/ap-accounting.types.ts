import type {
  AccountingAccountId,
  AccountingJournalId,
  AccountingTenantCompanyId,
  AccountingUserId,
  AccountingWorkspaceId
} from "./accounting.types";

export type ApAccountingSourceType = "procurement.supplier-bill";

export type ApAccountingPostingSettings = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  purchaseJournalId?: AccountingJournalId;
  payableAccountId?: AccountingAccountId;
  expenseAccountId?: AccountingAccountId;
  settlementAccountId?: AccountingAccountId;
  taxRecoverableAccountId?: AccountingAccountId;
  functionalCurrency: string;
  updatedBy?: AccountingUserId;
  createdAt: string;
  updatedAt: string;
}>;

export type ApAccountingPostingContext = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  workspaceId: AccountingWorkspaceId;
  userId?: AccountingUserId;
  now?: () => string;
}>;
