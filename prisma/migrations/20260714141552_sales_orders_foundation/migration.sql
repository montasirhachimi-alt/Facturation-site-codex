-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "crmCompanyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "crmContactId" TEXT,
    "contactName" TEXT,
    "sourceQuoteId" TEXT,
    "sourceQuoteNumber" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reservationStatus" TEXT NOT NULL,
    "customerReference" TEXT,
    "internalReference" TEXT,
    "notes" TEXT,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "crmCustomerId" TEXT,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderLine" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "productSku" TEXT,
    "productName" TEXT,
    "description" TEXT NOT NULL,
    "quantityOrdered" DOUBLE PRECISION NOT NULL,
    "quantityReserved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityDelivered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warehouseId" TEXT,
    "warehouseName" TEXT,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesOrder_tenantCompanyId_workspaceId_idx" ON "SalesOrder"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "SalesOrder_tenantCompanyId_crmCompanyId_idx" ON "SalesOrder"("tenantCompanyId", "crmCompanyId");

-- CreateIndex
CREATE INDEX "SalesOrder_tenantCompanyId_crmContactId_idx" ON "SalesOrder"("tenantCompanyId", "crmContactId");

-- CreateIndex
CREATE INDEX "SalesOrder_tenantCompanyId_sourceQuoteId_idx" ON "SalesOrder"("tenantCompanyId", "sourceQuoteId");

-- CreateIndex
CREATE INDEX "SalesOrder_tenantCompanyId_status_idx" ON "SalesOrder"("tenantCompanyId", "status");

-- CreateIndex
CREATE INDEX "SalesOrder_tenantCompanyId_reservationStatus_idx" ON "SalesOrder"("tenantCompanyId", "reservationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_tenantCompanyId_number_key" ON "SalesOrder"("tenantCompanyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_tenantCompanyId_sourceQuoteId_key" ON "SalesOrder"("tenantCompanyId", "sourceQuoteId");

-- CreateIndex
CREATE INDEX "SalesOrderLine_salesOrderId_idx" ON "SalesOrderLine"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesOrderLine_productId_idx" ON "SalesOrderLine"("productId");

-- CreateIndex
CREATE INDEX "SalesOrderLine_warehouseId_idx" ON "SalesOrderLine"("warehouseId");

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_sourceQuoteId_fkey" FOREIGN KEY ("sourceQuoteId") REFERENCES "SalesQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_crmCustomerId_fkey" FOREIGN KEY ("crmCustomerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderLine" ADD CONSTRAINT "SalesOrderLine_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderLine" ADD CONSTRAINT "SalesOrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
