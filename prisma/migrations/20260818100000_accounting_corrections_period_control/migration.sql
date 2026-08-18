-- SPR-435 - Accounting corrections, period control and auditability V1

ALTER TABLE "AccountingJournalEntry"
  ADD COLUMN "reversalOfEntryId" TEXT,
  ADD COLUMN "correctedByEntryId" TEXT,
  ADD COLUMN "correctionReason" TEXT,
  ADD COLUMN "correctionType" TEXT;

CREATE TABLE "AccountingPeriod" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "closedAt" TIMESTAMP(3),
  "closedBy" TEXT,
  "reopenedAt" TIMESTAMP(3),
  "reopenedBy" TEXT,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountingJournalEntry_reversalOfEntryId_key" ON "AccountingJournalEntry"("reversalOfEntryId");
CREATE INDEX "AccountingJournalEntry_tenantCompanyId_reversalOfEntryId_idx" ON "AccountingJournalEntry"("tenantCompanyId", "reversalOfEntryId");
CREATE INDEX "AccountingJournalEntry_tenantCompanyId_correctionType_idx" ON "AccountingJournalEntry"("tenantCompanyId", "correctionType");
CREATE UNIQUE INDEX "AccountingPeriod_tenantCompanyId_name_key" ON "AccountingPeriod"("tenantCompanyId", "name");
CREATE INDEX "AccountingPeriod_tenantCompanyId_idx" ON "AccountingPeriod"("tenantCompanyId");
CREATE INDEX "AccountingPeriod_tenantCompanyId_status_idx" ON "AccountingPeriod"("tenantCompanyId", "status");
CREATE INDEX "AccountingPeriod_tenantCompanyId_startDate_endDate_idx" ON "AccountingPeriod"("tenantCompanyId", "startDate", "endDate");

ALTER TABLE "AccountingJournalEntry"
  ADD CONSTRAINT "AccountingJournalEntry_reversalOfEntryId_fkey"
  FOREIGN KEY ("reversalOfEntryId") REFERENCES "AccountingJournalEntry"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AccountingPeriod"
  ADD CONSTRAINT "AccountingPeriod_tenantCompanyId_fkey"
  FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
