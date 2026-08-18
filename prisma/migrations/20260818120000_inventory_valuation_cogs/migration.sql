-- SPR-437 — Inventory Valuation & COGS Accounting V1

CREATE TABLE "InventoryValuationEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "movementId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "valuationMethod" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL,
    "totalValue" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryValuationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountingInventoryPostingSettings" (
    "tenantCompanyId" TEXT NOT NULL,
    "inventoryJournalId" TEXT,
    "inventoryAssetAccountId" TEXT,
    "cogsAccountId" TEXT,
    "functionalCurrency" TEXT NOT NULL DEFAULT 'MAD',
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingInventoryPostingSettings_pkey" PRIMARY KEY ("tenantCompanyId")
);

CREATE UNIQUE INDEX "InventoryValuationEvent_movementId_key" ON "InventoryValuationEvent"("movementId");
CREATE INDEX "InventoryValuationEvent_companyId_idx" ON "InventoryValuationEvent"("companyId");
CREATE INDEX "InventoryValuationEvent_companyId_productId_idx" ON "InventoryValuationEvent"("companyId", "productId");
CREATE INDEX "InventoryValuationEvent_companyId_warehouseId_idx" ON "InventoryValuationEvent"("companyId", "warehouseId");
CREATE INDEX "InventoryValuationEvent_companyId_eventType_idx" ON "InventoryValuationEvent"("companyId", "eventType");
CREATE INDEX "InventoryValuationEvent_companyId_sourceType_sourceId_idx" ON "InventoryValuationEvent"("companyId", "sourceType", "sourceId");
CREATE INDEX "InventoryValuationEvent_companyId_occurredAt_idx" ON "InventoryValuationEvent"("companyId", "occurredAt");
CREATE INDEX "AccountingInventoryPostingSettings_inventoryJournalId_idx" ON "AccountingInventoryPostingSettings"("inventoryJournalId");
CREATE INDEX "AccountingInventoryPostingSettings_inventoryAssetAccountId_idx" ON "AccountingInventoryPostingSettings"("inventoryAssetAccountId");
CREATE INDEX "AccountingInventoryPostingSettings_cogsAccountId_idx" ON "AccountingInventoryPostingSettings"("cogsAccountId");

ALTER TABLE "InventoryValuationEvent" ADD CONSTRAINT "InventoryValuationEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryValuationEvent" ADD CONSTRAINT "InventoryValuationEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryValuationEvent" ADD CONSTRAINT "InventoryValuationEvent_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "InventoryWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryValuationEvent" ADD CONSTRAINT "InventoryValuationEvent_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "InventoryStockMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccountingInventoryPostingSettings" ADD CONSTRAINT "AccountingInventoryPostingSettings_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountingInventoryPostingSettings" ADD CONSTRAINT "AccountingInventoryPostingSettings_inventoryJournalId_fkey" FOREIGN KEY ("inventoryJournalId") REFERENCES "AccountingJournal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountingInventoryPostingSettings" ADD CONSTRAINT "AccountingInventoryPostingSettings_inventoryAssetAccountId_fkey" FOREIGN KEY ("inventoryAssetAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountingInventoryPostingSettings" ADD CONSTRAINT "AccountingInventoryPostingSettings_cogsAccountId_fkey" FOREIGN KEY ("cogsAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
