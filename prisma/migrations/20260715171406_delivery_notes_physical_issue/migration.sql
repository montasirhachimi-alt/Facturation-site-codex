-- CreateTable
CREATE TABLE "SalesDeliveryNote" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "crmCompanyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "crmContactId" TEXT,
    "contactName" TEXT,
    "salesOrderId" TEXT NOT NULL,
    "salesOrderNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "customerReference" TEXT,
    "postedAt" TIMESTAMP(3),
    "postedBy" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesDeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesDeliveryNoteLine" (
    "id" TEXT NOT NULL,
    "deliveryNoteId" TEXT NOT NULL,
    "salesOrderLineId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT,
    "productName" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantityToDeliver" DECIMAL(65,30) NOT NULL,
    "quantityPosted" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesDeliveryNoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesDeliveryNote_tenantCompanyId_workspaceId_idx" ON "SalesDeliveryNote"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "SalesDeliveryNote_tenantCompanyId_salesOrderId_idx" ON "SalesDeliveryNote"("tenantCompanyId", "salesOrderId");

-- CreateIndex
CREATE INDEX "SalesDeliveryNote_tenantCompanyId_crmCompanyId_idx" ON "SalesDeliveryNote"("tenantCompanyId", "crmCompanyId");

-- CreateIndex
CREATE INDEX "SalesDeliveryNote_tenantCompanyId_warehouseId_idx" ON "SalesDeliveryNote"("tenantCompanyId", "warehouseId");

-- CreateIndex
CREATE INDEX "SalesDeliveryNote_tenantCompanyId_status_idx" ON "SalesDeliveryNote"("tenantCompanyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesDeliveryNote_tenantCompanyId_number_key" ON "SalesDeliveryNote"("tenantCompanyId", "number");

-- CreateIndex
CREATE INDEX "SalesDeliveryNoteLine_deliveryNoteId_idx" ON "SalesDeliveryNoteLine"("deliveryNoteId");

-- CreateIndex
CREATE INDEX "SalesDeliveryNoteLine_salesOrderLineId_idx" ON "SalesDeliveryNoteLine"("salesOrderLineId");

-- CreateIndex
CREATE INDEX "SalesDeliveryNoteLine_productId_idx" ON "SalesDeliveryNoteLine"("productId");

-- AddForeignKey
ALTER TABLE "SalesDeliveryNote" ADD CONSTRAINT "SalesDeliveryNote_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryNote" ADD CONSTRAINT "SalesDeliveryNote_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryNote" ADD CONSTRAINT "SalesDeliveryNote_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryNote" ADD CONSTRAINT "SalesDeliveryNote_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryNote" ADD CONSTRAINT "SalesDeliveryNote_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "InventoryWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryNoteLine" ADD CONSTRAINT "SalesDeliveryNoteLine_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "SalesDeliveryNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryNoteLine" ADD CONSTRAINT "SalesDeliveryNoteLine_salesOrderLineId_fkey" FOREIGN KEY ("salesOrderLineId") REFERENCES "SalesOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesDeliveryNoteLine" ADD CONSTRAINT "SalesDeliveryNoteLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
