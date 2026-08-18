import type {
  AccountingAccountId,
  AccountingJournalId,
  AccountingTenantCompanyId,
  AccountingUserId,
  AccountingWorkspaceId
} from "./accounting.types";

export type CommercialAccountingSourceType = "sales.invoice" | "sales.payment";

export type CommercialAccountingPostingSettings = Readonly<{
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

export type CommercialAccountingPostingSource = Readonly<{
  id: string;
  type: CommercialAccountingSourceType;
  number: string;
  date: string;
  status: string;
  currency: string;
  companyName?: string;
  contactName?: string;
  reference?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total: number;
}>;

export type CommercialAccountingPostingContext = Readonly<{
  tenantCompanyId: AccountingTenantCompanyId;
  workspaceId: AccountingWorkspaceId;
  userId?: AccountingUserId;
  now?: () => string;
}>;
