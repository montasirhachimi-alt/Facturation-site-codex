-- SPR-438 — Goods Receipt ↔ Supplier Bill ↔ GRNI Reconciliation V1

ALTER TABLE "AccountingInventoryPostingSettings"
  ADD COLUMN "grniClearingAccountId" TEXT;

CREATE INDEX "AccountingInventoryPostingSettings_grniClearingAccountId_idx"
  ON "AccountingInventoryPostingSettings"("grniClearingAccountId");

ALTER TABLE "AccountingInventoryPostingSettings"
  ADD CONSTRAINT "AccountingInventoryPostingSettings_grniClearingAccountId_fkey"
  FOREIGN KEY ("grniClearingAccountId") REFERENCES "AccountingAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
