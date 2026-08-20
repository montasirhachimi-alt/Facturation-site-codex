-- SPR-442 — canonical HR administrative documents, templates and onboarding readiness.

CREATE TABLE "HrDocumentType" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "requiredByDefault" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HrDocumentType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrDocumentTemplate" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "documentTypeId" TEXT,
  "templateFormat" TEXT NOT NULL DEFAULT 'plain_text',
  "body" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HrDocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrEmployeeDocument" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "documentTypeId" TEXT,
  "templateId" TEXT,
  "contractId" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'missing',
  "source" TEXT NOT NULL DEFAULT 'manual',
  "storageReference" TEXT,
  "storageFilename" TEXT,
  "storageMimeType" TEXT,
  "storageSizeBytes" INTEGER,
  "generatedContent" TEXT,
  "generatedFromTemplateName" TEXT,
  "issuedDate" TIMESTAMP(3),
  "receivedDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "required" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "generatedAt" TIMESTAMP(3),
  "uploadedAt" TIMESTAMP(3),
  "finalizedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HrEmployeeDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HrDocumentType_tenantCompanyId_name_key" ON "HrDocumentType"("tenantCompanyId", "name");
CREATE UNIQUE INDEX "HrDocumentType_tenantCompanyId_code_key" ON "HrDocumentType"("tenantCompanyId", "code");
CREATE INDEX "HrDocumentType_tenantCompanyId_category_idx" ON "HrDocumentType"("tenantCompanyId", "category");
CREATE INDEX "HrDocumentType_tenantCompanyId_active_idx" ON "HrDocumentType"("tenantCompanyId", "active");
CREATE INDEX "HrDocumentType_tenantCompanyId_requiredByDefault_idx" ON "HrDocumentType"("tenantCompanyId", "requiredByDefault");

CREATE UNIQUE INDEX "HrDocumentTemplate_tenantCompanyId_name_key" ON "HrDocumentTemplate"("tenantCompanyId", "name");
CREATE UNIQUE INDEX "HrDocumentTemplate_tenantCompanyId_code_key" ON "HrDocumentTemplate"("tenantCompanyId", "code");
CREATE INDEX "HrDocumentTemplate_tenantCompanyId_documentTypeId_idx" ON "HrDocumentTemplate"("tenantCompanyId", "documentTypeId");
CREATE INDEX "HrDocumentTemplate_tenantCompanyId_active_idx" ON "HrDocumentTemplate"("tenantCompanyId", "active");

CREATE INDEX "HrEmployeeDocument_tenantCompanyId_employeeId_idx" ON "HrEmployeeDocument"("tenantCompanyId", "employeeId");
CREATE INDEX "HrEmployeeDocument_tenantCompanyId_documentTypeId_idx" ON "HrEmployeeDocument"("tenantCompanyId", "documentTypeId");
CREATE INDEX "HrEmployeeDocument_tenantCompanyId_templateId_idx" ON "HrEmployeeDocument"("tenantCompanyId", "templateId");
CREATE INDEX "HrEmployeeDocument_tenantCompanyId_contractId_idx" ON "HrEmployeeDocument"("tenantCompanyId", "contractId");
CREATE INDEX "HrEmployeeDocument_tenantCompanyId_status_idx" ON "HrEmployeeDocument"("tenantCompanyId", "status");
CREATE INDEX "HrEmployeeDocument_tenantCompanyId_required_idx" ON "HrEmployeeDocument"("tenantCompanyId", "required");
CREATE INDEX "HrEmployeeDocument_tenantCompanyId_expiryDate_idx" ON "HrEmployeeDocument"("tenantCompanyId", "expiryDate");

ALTER TABLE "HrDocumentType" ADD CONSTRAINT "HrDocumentType_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrDocumentTemplate" ADD CONSTRAINT "HrDocumentTemplate_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrDocumentTemplate" ADD CONSTRAINT "HrDocumentTemplate_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "HrDocumentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "HrDocumentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "HrDocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "HrEmploymentContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
