-- CreateTable
CREATE TABLE "ProcurementSupplier" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "ice" TEXT,
    "taxId" TEXT,
    "rc" TEXT,
    "vat" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementPurchaseOrder" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expectedDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementPurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
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

    CONSTRAINT "ProcurementPurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcurementSupplier_tenantCompanyId_workspaceId_idx" ON "ProcurementSupplier"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "ProcurementSupplier_tenantCompanyId_active_idx" ON "ProcurementSupplier"("tenantCompanyId", "active");

-- CreateIndex
CREATE INDEX "ProcurementSupplier_tenantCompanyId_status_idx" ON "ProcurementSupplier"("tenantCompanyId", "status");

-- CreateIndex
CREATE INDEX "ProcurementSupplier_tenantCompanyId_ice_idx" ON "ProcurementSupplier"("tenantCompanyId", "ice");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementPurchaseOrder_tenantCompanyId_number_key" ON "ProcurementPurchaseOrder"("tenantCompanyId", "number");

-- CreateIndex
CREATE INDEX "ProcurementPurchaseOrder_tenantCompanyId_workspaceId_idx" ON "ProcurementPurchaseOrder"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "ProcurementPurchaseOrder_tenantCompanyId_supplierId_idx" ON "ProcurementPurchaseOrder"("tenantCompanyId", "supplierId");

-- CreateIndex
CREATE INDEX "ProcurementPurchaseOrder_tenantCompanyId_status_idx" ON "ProcurementPurchaseOrder"("tenantCompanyId", "status");

-- CreateIndex
CREATE INDEX "ProcurementPurchaseOrderLine_purchaseOrderId_idx" ON "ProcurementPurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "ProcurementPurchaseOrderLine_productId_idx" ON "ProcurementPurchaseOrderLine"("productId");

-- AddForeignKey
ALTER TABLE "ProcurementSupplier" ADD CONSTRAINT "ProcurementSupplier_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementPurchaseOrder" ADD CONSTRAINT "ProcurementPurchaseOrder_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementPurchaseOrder" ADD CONSTRAINT "ProcurementPurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ProcurementSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementPurchaseOrderLine" ADD CONSTRAINT "ProcurementPurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "ProcurementPurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementPurchaseOrderLine" ADD CONSTRAINT "ProcurementPurchaseOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
