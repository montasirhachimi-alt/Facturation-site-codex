-- SPR-433: Commercial Accounting Integration V1
-- Adds tenant-scoped Sales posting settings and durable source idempotency.

CREATE TABLE "AccountingCommercialPostingSettings" (
  "tenantCompanyId" TEXT NOT NULL,
  "salesJournalId" TEXT,
  "receivableAccountId" TEXT,
  "revenueAccountId" TEXT,
  "settlementAccountId" TEXT,
  "taxPayableAccountId" TEXT,
  "functionalCurrency" TEXT NOT NULL DEFAULT 'MAD',
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AccountingCommercialPostingSettings_pkey" PRIMARY KEY ("tenantCompanyId")
);

CREATE INDEX "AccountingCommercialPostingSettings_salesJournalId_idx" ON "AccountingCommercialPostingSettings"("salesJournalId");
CREATE INDEX "AccountingCommercialPostingSettings_receivableAccountId_idx" ON "AccountingCommercialPostingSettings"("receivableAccountId");
CREATE INDEX "AccountingCommercialPostingSettings_revenueAccountId_idx" ON "AccountingCommercialPostingSettings"("revenueAccountId");
CREATE INDEX "AccountingCommercialPostingSettings_settlementAccountId_idx" ON "AccountingCommercialPostingSettings"("settlementAccountId");
CREATE INDEX "AccountingCommercialPostingSettings_taxPayableAccountId_idx" ON "AccountingCommercialPostingSettings"("taxPayableAccountId");

CREATE UNIQUE INDEX "AccountingJournalEntry_tenantCompanyId_sourceType_sourceId_key"
  ON "AccountingJournalEntry"("tenantCompanyId", "sourceType", "sourceId");

ALTER TABLE "AccountingCommercialPostingSettings"
  ADD CONSTRAINT "AccountingCommercialPostingSettings_tenantCompanyId_fkey"
  FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountingCommercialPostingSettings"
  ADD CONSTRAINT "AccountingCommercialPostingSettings_salesJournalId_fkey"
  FOREIGN KEY ("salesJournalId") REFERENCES "AccountingJournal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountingCommercialPostingSettings"
  ADD CONSTRAINT "AccountingCommercialPostingSettings_receivableAccountId_fkey"
  FOREIGN KEY ("receivableAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountingCommercialPostingSettings"
  ADD CONSTRAINT "AccountingCommercialPostingSettings_revenueAccountId_fkey"
  FOREIGN KEY ("revenueAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountingCommercialPostingSettings"
  ADD CONSTRAINT "AccountingCommercialPostingSettings_settlementAccountId_fkey"
  FOREIGN KEY ("settlementAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountingCommercialPostingSettings"
  ADD CONSTRAINT "AccountingCommercialPostingSettings_taxPayableAccountId_fkey"
  FOREIGN KEY ("taxPayableAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
