-- Add product-level reorder point for operational Product Catalog visibility.
ALTER TABLE "Product" ADD COLUMN "reorderPoint" DECIMAL(65,30) NOT NULL DEFAULT 0;
