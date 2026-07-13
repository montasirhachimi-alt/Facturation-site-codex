-- Add inventory balance reorder point for low-stock workspace indicators.
ALTER TABLE "InventoryBalance" ADD COLUMN "reorderPoint" DECIMAL(65,30) NOT NULL DEFAULT 0;
