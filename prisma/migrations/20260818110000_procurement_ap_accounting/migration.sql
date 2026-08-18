-- SPR-436 - Procurement / AP Accounting V1

CREATE TABLE "ProcurementSupplierBill" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "purchaseOrderNumber" TEXT,
    "goodsReceiptId" TEXT,
    "goodsReceiptNumber" TEXT,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accountedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementSupplierBill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcurementSupplierBillLine" (
    "id" TEXT NOT NULL,
    "supplierBillId" TEXT NOT NULL,
    "purchaseOrderLineId" TEXT,
    "goodsReceiptLineId" TEXT,
    "productId" TEXT,
    "productSku" TEXT,
    "productName" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProcurementSupplierBillLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountingApPostingSettings" (
    "tenantCompanyId" TEXT NOT NULL,
    "purchaseJournalId" TEXT,
    "payableAccountId" TEXT,
    "expenseAccountId" TEXT,
    "settlementAccountId" TEXT,
    "taxRecoverableAccountId" TEXT,
    "functionalCurrency" TEXT NOT NULL DEFAULT 'MAD',
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingApPostingSettings_pkey" PRIMARY KEY ("tenantCompanyId")
);

CREATE UNIQUE INDEX "ProcurementSupplierBill_tenantCompanyId_number_key" ON "ProcurementSupplierBill"("tenantCompanyId", "number");
CREATE INDEX "ProcurementSupplierBill_tenantCompanyId_workspaceId_idx" ON "ProcurementSupplierBill"("tenantCompanyId", "workspaceId");
CREATE INDEX "ProcurementSupplierBill_tenantCompanyId_supplierId_idx" ON "ProcurementSupplierBill"("tenantCompanyId", "supplierId");
CREATE INDEX "ProcurementSupplierBill_tenantCompanyId_purchaseOrderId_idx" ON "ProcurementSupplierBill"("tenantCompanyId", "purchaseOrderId");
CREATE INDEX "ProcurementSupplierBill_tenantCompanyId_goodsReceiptId_idx" ON "ProcurementSupplierBill"("tenantCompanyId", "goodsReceiptId");
CREATE INDEX "ProcurementSupplierBill_tenantCompanyId_status_idx" ON "ProcurementSupplierBill"("tenantCompanyId", "status");

CREATE INDEX "ProcurementSupplierBillLine_supplierBillId_idx" ON "ProcurementSupplierBillLine"("supplierBillId");
CREATE INDEX "ProcurementSupplierBillLine_purchaseOrderLineId_idx" ON "ProcurementSupplierBillLine"("purchaseOrderLineId");
CREATE INDEX "ProcurementSupplierBillLine_goodsReceiptLineId_idx" ON "ProcurementSupplierBillLine"("goodsReceiptLineId");
CREATE INDEX "ProcurementSupplierBillLine_productId_idx" ON "ProcurementSupplierBillLine"("productId");

CREATE INDEX "AccountingApPostingSettings_purchaseJournalId_idx" ON "AccountingApPostingSettings"("purchaseJournalId");
CREATE INDEX "AccountingApPostingSettings_payableAccountId_idx" ON "AccountingApPostingSettings"("payableAccountId");
CREATE INDEX "AccountingApPostingSettings_expenseAccountId_idx" ON "AccountingApPostingSettings"("expenseAccountId");
CREATE INDEX "AccountingApPostingSettings_settlementAccountId_idx" ON "AccountingApPostingSettings"("settlementAccountId");
CREATE INDEX "AccountingApPostingSettings_taxRecoverableAccountId_idx" ON "AccountingApPostingSettings"("taxRecoverableAccountId");

ALTER TABLE "ProcurementSupplierBill" ADD CONSTRAINT "ProcurementSupplierBill_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementSupplierBill" ADD CONSTRAINT "ProcurementSupplierBill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ProcurementSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementSupplierBill" ADD CONSTRAINT "ProcurementSupplierBill_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "ProcurementPurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcurementSupplierBill" ADD CONSTRAINT "ProcurementSupplierBill_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "ProcurementGoodsReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProcurementSupplierBillLine" ADD CONSTRAINT "ProcurementSupplierBillLine_supplierBillId_fkey" FOREIGN KEY ("supplierBillId") REFERENCES "ProcurementSupplierBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementSupplierBillLine" ADD CONSTRAINT "ProcurementSupplierBillLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountingApPostingSettings" ADD CONSTRAINT "AccountingApPostingSettings_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountingApPostingSettings" ADD CONSTRAINT "AccountingApPostingSettings_purchaseJournalId_fkey" FOREIGN KEY ("purchaseJournalId") REFERENCES "AccountingJournal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountingApPostingSettings" ADD CONSTRAINT "AccountingApPostingSettings_payableAccountId_fkey" FOREIGN KEY ("payableAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountingApPostingSettings" ADD CONSTRAINT "AccountingApPostingSettings_expenseAccountId_fkey" FOREIGN KEY ("expenseAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountingApPostingSettings" ADD CONSTRAINT "AccountingApPostingSettings_settlementAccountId_fkey" FOREIGN KEY ("settlementAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountingApPostingSettings" ADD CONSTRAINT "AccountingApPostingSettings_taxRecoverableAccountId_fkey" FOREIGN KEY ("taxRecoverableAccountId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
