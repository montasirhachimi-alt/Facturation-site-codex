-- CreateTable
CREATE TABLE "AccountingAccount" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "normalBalance" TEXT NOT NULL,
    "parentAccountId" TEXT,
    "currency" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingJournal" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingJournalEntry" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "functionalCurrency" TEXT NOT NULL,
    "transactionCurrency" TEXT,
    "exchangeRate" DECIMAL(65,30),
    "debitTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "postedBy" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingJournalEntryLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "debitAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingJournalEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingAccount_tenantCompanyId_code_key" ON "AccountingAccount"("tenantCompanyId", "code");

-- CreateIndex
CREATE INDEX "AccountingAccount_tenantCompanyId_idx" ON "AccountingAccount"("tenantCompanyId");

-- CreateIndex
CREATE INDEX "AccountingAccount_tenantCompanyId_type_idx" ON "AccountingAccount"("tenantCompanyId", "type");

-- CreateIndex
CREATE INDEX "AccountingAccount_tenantCompanyId_active_idx" ON "AccountingAccount"("tenantCompanyId", "active");

-- CreateIndex
CREATE INDEX "AccountingAccount_parentAccountId_idx" ON "AccountingAccount"("parentAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingJournal_tenantCompanyId_code_key" ON "AccountingJournal"("tenantCompanyId", "code");

-- CreateIndex
CREATE INDEX "AccountingJournal_tenantCompanyId_idx" ON "AccountingJournal"("tenantCompanyId");

-- CreateIndex
CREATE INDEX "AccountingJournal_tenantCompanyId_type_idx" ON "AccountingJournal"("tenantCompanyId", "type");

-- CreateIndex
CREATE INDEX "AccountingJournal_tenantCompanyId_active_idx" ON "AccountingJournal"("tenantCompanyId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingJournalEntry_tenantCompanyId_number_key" ON "AccountingJournalEntry"("tenantCompanyId", "number");

-- CreateIndex
CREATE INDEX "AccountingJournalEntry_tenantCompanyId_workspaceId_idx" ON "AccountingJournalEntry"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "AccountingJournalEntry_tenantCompanyId_journalId_idx" ON "AccountingJournalEntry"("tenantCompanyId", "journalId");

-- CreateIndex
CREATE INDEX "AccountingJournalEntry_tenantCompanyId_status_idx" ON "AccountingJournalEntry"("tenantCompanyId", "status");

-- CreateIndex
CREATE INDEX "AccountingJournalEntry_tenantCompanyId_entryDate_idx" ON "AccountingJournalEntry"("tenantCompanyId", "entryDate");

-- CreateIndex
CREATE INDEX "AccountingJournalEntry_tenantCompanyId_sourceType_sourceId_idx" ON "AccountingJournalEntry"("tenantCompanyId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "AccountingJournalEntryLine_journalEntryId_idx" ON "AccountingJournalEntryLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "AccountingJournalEntryLine_accountId_idx" ON "AccountingJournalEntryLine"("accountId");

-- AddForeignKey
ALTER TABLE "AccountingAccount" ADD CONSTRAINT "AccountingAccount_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingAccount" ADD CONSTRAINT "AccountingAccount_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "AccountingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournal" ADD CONSTRAINT "AccountingJournal_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalEntry" ADD CONSTRAINT "AccountingJournalEntry_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalEntry" ADD CONSTRAINT "AccountingJournalEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "AccountingJournal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalEntryLine" ADD CONSTRAINT "AccountingJournalEntryLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "AccountingJournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalEntryLine" ADD CONSTRAINT "AccountingJournalEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
