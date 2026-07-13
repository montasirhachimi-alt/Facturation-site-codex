-- SPR-406 Product Catalog Foundation
-- Extends the existing Product table into the canonical product catalog.

CREATE TABLE "ProductCategory" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "parentId" TEXT,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductCategory"
  ADD CONSTRAINT "ProductCategory_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductCategory"
  ADD CONSTRAINT "ProductCategory_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ProductCategory_companyId_name_key" ON "ProductCategory"("companyId", "name");
CREATE INDEX "ProductCategory_companyId_idx" ON "ProductCategory"("companyId");
CREATE INDEX "ProductCategory_companyId_active_idx" ON "ProductCategory"("companyId", "active");
CREATE INDEX "ProductCategory_parentId_idx" ON "ProductCategory"("parentId");

ALTER TABLE "Product"
  ADD COLUMN "productCategoryId" TEXT,
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "barcode" TEXT,
  ADD COLUMN "name" TEXT,
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'piece',
  ADD COLUMN "sellingPrice" DECIMAL(65,30),
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'MAD',
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hasVariants" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "serialTracked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "batchTracked" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product"
SET
  "sku" = UPPER(TRIM("reference")),
  "name" = "designation",
  "sellingPrice" = "salePrice",
  "active" = true,
  "status" = 'active'
WHERE "sku" IS NULL;

ALTER TABLE "Product"
  ALTER COLUMN "sku" SET NOT NULL,
  ALTER COLUMN "name" SET NOT NULL,
  ALTER COLUMN "sellingPrice" SET NOT NULL;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_productCategoryId_fkey"
  FOREIGN KEY ("productCategoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Product_companyId_sku_key" ON "Product"("companyId", "sku");
CREATE UNIQUE INDEX "Product_companyId_barcode_key" ON "Product"("companyId", "barcode");
CREATE INDEX "Product_companyId_active_idx" ON "Product"("companyId", "active");
CREATE INDEX "Product_companyId_status_idx" ON "Product"("companyId", "status");
CREATE INDEX "Product_productCategoryId_idx" ON "Product"("productCategoryId");
