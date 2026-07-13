-- SPR-407 Inventory Domain Foundation
-- Adds durable inventory domain tables without exposing Inventory UI.

CREATE TYPE "InventoryMovementType" AS ENUM (
  'RECEIPT',
  'ISSUE',
  'TRANSFER',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'RESERVATION',
  'RELEASE'
);

CREATE TYPE "InventoryMovementStatus" AS ENUM (
  'DRAFT',
  'POSTED',
  'CANCELLED'
);

CREATE TABLE "InventoryWarehouse" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InventoryWarehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryBalance" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "quantityOnHand" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "quantityReserved" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "quantityAvailable" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "lastMovementDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryStockMovement" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "fromWarehouseId" TEXT,
  "toWarehouseId" TEXT,
  "type" "InventoryMovementType" NOT NULL,
  "status" "InventoryMovementStatus" NOT NULL DEFAULT 'DRAFT',
  "quantity" DECIMAL(65,30) NOT NULL,
  "reference" TEXT,
  "reason" TEXT,
  "postedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InventoryStockMovement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryWarehouse_companyId_code_key" ON "InventoryWarehouse"("companyId", "code");
CREATE INDEX "InventoryWarehouse_companyId_idx" ON "InventoryWarehouse"("companyId");
CREATE INDEX "InventoryWarehouse_companyId_active_idx" ON "InventoryWarehouse"("companyId", "active");
CREATE INDEX "InventoryWarehouse_companyId_isDefault_idx" ON "InventoryWarehouse"("companyId", "isDefault");

CREATE UNIQUE INDEX "InventoryBalance_companyId_productId_warehouseId_key" ON "InventoryBalance"("companyId", "productId", "warehouseId");
CREATE INDEX "InventoryBalance_companyId_idx" ON "InventoryBalance"("companyId");
CREATE INDEX "InventoryBalance_companyId_productId_idx" ON "InventoryBalance"("companyId", "productId");
CREATE INDEX "InventoryBalance_companyId_warehouseId_idx" ON "InventoryBalance"("companyId", "warehouseId");

CREATE INDEX "InventoryStockMovement_companyId_idx" ON "InventoryStockMovement"("companyId");
CREATE INDEX "InventoryStockMovement_companyId_productId_idx" ON "InventoryStockMovement"("companyId", "productId");
CREATE INDEX "InventoryStockMovement_companyId_type_idx" ON "InventoryStockMovement"("companyId", "type");
CREATE INDEX "InventoryStockMovement_companyId_status_idx" ON "InventoryStockMovement"("companyId", "status");
CREATE INDEX "InventoryStockMovement_companyId_createdAt_idx" ON "InventoryStockMovement"("companyId", "createdAt");

ALTER TABLE "InventoryWarehouse"
  ADD CONSTRAINT "InventoryWarehouse_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryBalance"
  ADD CONSTRAINT "InventoryBalance_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryBalance"
  ADD CONSTRAINT "InventoryBalance_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryBalance"
  ADD CONSTRAINT "InventoryBalance_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "InventoryWarehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryStockMovement"
  ADD CONSTRAINT "InventoryStockMovement_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryStockMovement"
  ADD CONSTRAINT "InventoryStockMovement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryStockMovement"
  ADD CONSTRAINT "InventoryStockMovement_fromWarehouseId_fkey"
  FOREIGN KEY ("fromWarehouseId") REFERENCES "InventoryWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryStockMovement"
  ADD CONSTRAINT "InventoryStockMovement_toWarehouseId_fkey"
  FOREIGN KEY ("toWarehouseId") REFERENCES "InventoryWarehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
