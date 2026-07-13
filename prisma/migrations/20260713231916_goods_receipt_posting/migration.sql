-- CreateTable
CREATE TABLE "ProcurementGoodsReceipt" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "purchaseOrderNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "warehouseName" TEXT,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "postedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementGoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementGoodsReceiptLine" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "purchaseOrderLineId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT,
    "productName" TEXT,
    "description" TEXT NOT NULL,
    "orderedQuantity" DOUBLE PRECISION NOT NULL,
    "previouslyReceivedQuantity" DOUBLE PRECISION NOT NULL,
    "receivedQuantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProcurementGoodsReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcurementGoodsReceipt_tenantCompanyId_workspaceId_idx" ON "ProcurementGoodsReceipt"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "ProcurementGoodsReceipt_tenantCompanyId_supplierId_idx" ON "ProcurementGoodsReceipt"("tenantCompanyId", "supplierId");

-- CreateIndex
CREATE INDEX "ProcurementGoodsReceipt_tenantCompanyId_purchaseOrderId_idx" ON "ProcurementGoodsReceipt"("tenantCompanyId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "ProcurementGoodsReceipt_tenantCompanyId_warehouseId_idx" ON "ProcurementGoodsReceipt"("tenantCompanyId", "warehouseId");

-- CreateIndex
CREATE INDEX "ProcurementGoodsReceipt_tenantCompanyId_status_idx" ON "ProcurementGoodsReceipt"("tenantCompanyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementGoodsReceipt_tenantCompanyId_number_key" ON "ProcurementGoodsReceipt"("tenantCompanyId", "number");

-- CreateIndex
CREATE INDEX "ProcurementGoodsReceiptLine_goodsReceiptId_idx" ON "ProcurementGoodsReceiptLine"("goodsReceiptId");

-- CreateIndex
CREATE INDEX "ProcurementGoodsReceiptLine_purchaseOrderLineId_idx" ON "ProcurementGoodsReceiptLine"("purchaseOrderLineId");

-- CreateIndex
CREATE INDEX "ProcurementGoodsReceiptLine_productId_idx" ON "ProcurementGoodsReceiptLine"("productId");

-- AddForeignKey
ALTER TABLE "ProcurementGoodsReceipt" ADD CONSTRAINT "ProcurementGoodsReceipt_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementGoodsReceipt" ADD CONSTRAINT "ProcurementGoodsReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ProcurementSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementGoodsReceipt" ADD CONSTRAINT "ProcurementGoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "ProcurementPurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementGoodsReceipt" ADD CONSTRAINT "ProcurementGoodsReceipt_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "InventoryWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementGoodsReceiptLine" ADD CONSTRAINT "ProcurementGoodsReceiptLine_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "ProcurementGoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementGoodsReceiptLine" ADD CONSTRAINT "ProcurementGoodsReceiptLine_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "ProcurementPurchaseOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementGoodsReceiptLine" ADD CONSTRAINT "ProcurementGoodsReceiptLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
