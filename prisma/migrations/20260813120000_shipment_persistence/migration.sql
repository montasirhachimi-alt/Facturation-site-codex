-- CreateTable
CREATE TABLE "SalesShipment" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "deliveryNoteId" TEXT NOT NULL,
    "deliveryNoteNumber" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "salesOrderNumber" TEXT NOT NULL,
    "crmCompanyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "crmContactId" TEXT,
    "contactName" TEXT,
    "deliveryAddress" TEXT,
    "carrier" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "expectedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesShipmentLine" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "deliveryNoteLineId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT,
    "productName" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesShipmentLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesShipment_tenantCompanyId_number_key" ON "SalesShipment"("tenantCompanyId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "SalesShipment_tenantCompanyId_deliveryNoteId_key" ON "SalesShipment"("tenantCompanyId", "deliveryNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesShipment_deliveryNoteId_key" ON "SalesShipment"("deliveryNoteId");

-- CreateIndex
CREATE INDEX "SalesShipment_tenantCompanyId_workspaceId_idx" ON "SalesShipment"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "SalesShipment_tenantCompanyId_salesOrderId_idx" ON "SalesShipment"("tenantCompanyId", "salesOrderId");

-- CreateIndex
CREATE INDEX "SalesShipment_tenantCompanyId_crmCompanyId_idx" ON "SalesShipment"("tenantCompanyId", "crmCompanyId");

-- CreateIndex
CREATE INDEX "SalesShipment_tenantCompanyId_crmContactId_idx" ON "SalesShipment"("tenantCompanyId", "crmContactId");

-- CreateIndex
CREATE INDEX "SalesShipment_tenantCompanyId_status_idx" ON "SalesShipment"("tenantCompanyId", "status");

-- CreateIndex
CREATE INDEX "SalesShipment_tenantCompanyId_carrier_idx" ON "SalesShipment"("tenantCompanyId", "carrier");

-- CreateIndex
CREATE INDEX "SalesShipment_tenantCompanyId_shipmentDate_idx" ON "SalesShipment"("tenantCompanyId", "shipmentDate");

-- CreateIndex
CREATE INDEX "SalesShipmentLine_shipmentId_idx" ON "SalesShipmentLine"("shipmentId");

-- CreateIndex
CREATE INDEX "SalesShipmentLine_deliveryNoteLineId_idx" ON "SalesShipmentLine"("deliveryNoteLineId");

-- CreateIndex
CREATE INDEX "SalesShipmentLine_productId_idx" ON "SalesShipmentLine"("productId");

-- AddForeignKey
ALTER TABLE "SalesShipment" ADD CONSTRAINT "SalesShipment_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesShipment" ADD CONSTRAINT "SalesShipment_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "SalesDeliveryNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesShipment" ADD CONSTRAINT "SalesShipment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesShipment" ADD CONSTRAINT "SalesShipment_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesShipment" ADD CONSTRAINT "SalesShipment_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesShipmentLine" ADD CONSTRAINT "SalesShipmentLine_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "SalesShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesShipmentLine" ADD CONSTRAINT "SalesShipmentLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
