-- Add future-safe reservation/allocation references to stock movements.
ALTER TABLE "InventoryStockMovement"
  ADD COLUMN "referenceType" TEXT,
  ADD COLUMN "referenceId" TEXT;

CREATE INDEX "InventoryStockMovement_companyId_referenceType_referenceId_idx"
  ON "InventoryStockMovement"("companyId", "referenceType", "referenceId");
