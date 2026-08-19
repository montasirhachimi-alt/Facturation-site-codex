CREATE TABLE "ProcurementSupplierPayment" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierBillId" TEXT NOT NULL,
    "supplierBillNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "accountedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementSupplierPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcurementSupplierPayment_tenantCompanyId_number_key" ON "ProcurementSupplierPayment"("tenantCompanyId", "number");
CREATE INDEX "ProcurementSupplierPayment_tenantCompanyId_workspaceId_idx" ON "ProcurementSupplierPayment"("tenantCompanyId", "workspaceId");
CREATE INDEX "ProcurementSupplierPayment_tenantCompanyId_supplierId_idx" ON "ProcurementSupplierPayment"("tenantCompanyId", "supplierId");
CREATE INDEX "ProcurementSupplierPayment_tenantCompanyId_supplierBillId_idx" ON "ProcurementSupplierPayment"("tenantCompanyId", "supplierBillId");
CREATE INDEX "ProcurementSupplierPayment_tenantCompanyId_status_idx" ON "ProcurementSupplierPayment"("tenantCompanyId", "status");

ALTER TABLE "ProcurementSupplierPayment" ADD CONSTRAINT "ProcurementSupplierPayment_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementSupplierPayment" ADD CONSTRAINT "ProcurementSupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ProcurementSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementSupplierPayment" ADD CONSTRAINT "ProcurementSupplierPayment_supplierBillId_fkey" FOREIGN KEY ("supplierBillId") REFERENCES "ProcurementSupplierBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
