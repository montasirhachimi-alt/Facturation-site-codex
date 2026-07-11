-- PERSIST-001 durable CRM and Sales records.
-- Business records are scoped to the existing tenant Company through tenantCompanyId.

CREATE TABLE "CrmCompany" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "legalName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "registrationNumber" TEXT,
  "taxNumber" TEXT,
  "industry" TEXT NOT NULL,
  "website" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "status" TEXT NOT NULL,
  "tags" JSONB NOT NULL,
  "notes" TEXT,
  "ownerId" TEXT,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CrmCompany_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmCustomer" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "crmCompanyId" TEXT,
  "companyName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "status" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "tags" JSONB NOT NULL,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CrmCustomer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmContact" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "crmCompanyId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "jobTitle" TEXT,
  "department" TEXT,
  "email" TEXT,
  "mobilePhone" TEXT,
  "officePhone" TEXT,
  "preferredLanguage" TEXT,
  "timezone" TEXT,
  "status" TEXT NOT NULL,
  "role" TEXT,
  "isPrimaryContact" BOOLEAN NOT NULL DEFAULT false,
  "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
  "linkedin" TEXT,
  "notes" TEXT,
  "tags" JSONB NOT NULL,
  "ownerId" TEXT,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesQuote" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "crmCustomerId" TEXT,
  "customerName" TEXT NOT NULL,
  "crmCompanyId" TEXT NOT NULL,
  "companyName" TEXT,
  "crmContactId" TEXT,
  "contactName" TEXT,
  "opportunityId" TEXT,
  "opportunityName" TEXT,
  "status" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "expirationDate" TIMESTAMP(3) NOT NULL,
  "validityDays" INTEGER,
  "currency" TEXT NOT NULL,
  "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SalesQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesQuoteLine" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "taxRate" DOUBLE PRECISION NOT NULL,
  "position" INTEGER NOT NULL,

  CONSTRAINT "SalesQuoteLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesInvoice" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "crmCustomerId" TEXT,
  "customerName" TEXT NOT NULL,
  "crmCompanyId" TEXT NOT NULL,
  "companyName" TEXT,
  "crmContactId" TEXT,
  "contactName" TEXT,
  "opportunityId" TEXT,
  "opportunityName" TEXT,
  "quoteId" TEXT,
  "status" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "currency" TEXT NOT NULL,
  "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "ownerId" TEXT NOT NULL,
  "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SalesInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesInvoiceLine" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "taxRate" DOUBLE PRECISION NOT NULL,
  "position" INTEGER NOT NULL,

  CONSTRAINT "SalesInvoiceLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesPayment" (
  "id" TEXT NOT NULL,
  "tenantCompanyId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "crmCompanyId" TEXT NOT NULL,
  "crmContactId" TEXT,
  "opportunityId" TEXT,
  "status" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "ownerId" TEXT NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SalesPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmCompany_tenantCompanyId_workspaceId_idx" ON "CrmCompany"("tenantCompanyId", "workspaceId");
CREATE INDEX "CrmCompany_tenantCompanyId_status_idx" ON "CrmCompany"("tenantCompanyId", "status");
CREATE INDEX "CrmCustomer_tenantCompanyId_workspaceId_idx" ON "CrmCustomer"("tenantCompanyId", "workspaceId");
CREATE INDEX "CrmCustomer_tenantCompanyId_crmCompanyId_idx" ON "CrmCustomer"("tenantCompanyId", "crmCompanyId");
CREATE INDEX "CrmCustomer_tenantCompanyId_status_idx" ON "CrmCustomer"("tenantCompanyId", "status");
CREATE INDEX "CrmContact_tenantCompanyId_workspaceId_idx" ON "CrmContact"("tenantCompanyId", "workspaceId");
CREATE INDEX "CrmContact_tenantCompanyId_crmCompanyId_idx" ON "CrmContact"("tenantCompanyId", "crmCompanyId");
CREATE INDEX "CrmContact_tenantCompanyId_status_idx" ON "CrmContact"("tenantCompanyId", "status");
CREATE UNIQUE INDEX "SalesQuote_tenantCompanyId_number_key" ON "SalesQuote"("tenantCompanyId", "number");
CREATE INDEX "SalesQuote_tenantCompanyId_workspaceId_idx" ON "SalesQuote"("tenantCompanyId", "workspaceId");
CREATE INDEX "SalesQuote_tenantCompanyId_crmCompanyId_idx" ON "SalesQuote"("tenantCompanyId", "crmCompanyId");
CREATE INDEX "SalesQuote_tenantCompanyId_crmCustomerId_idx" ON "SalesQuote"("tenantCompanyId", "crmCustomerId");
CREATE INDEX "SalesQuote_tenantCompanyId_status_idx" ON "SalesQuote"("tenantCompanyId", "status");
CREATE INDEX "SalesQuoteLine_quoteId_idx" ON "SalesQuoteLine"("quoteId");
CREATE UNIQUE INDEX "SalesInvoice_tenantCompanyId_number_key" ON "SalesInvoice"("tenantCompanyId", "number");
CREATE INDEX "SalesInvoice_tenantCompanyId_workspaceId_idx" ON "SalesInvoice"("tenantCompanyId", "workspaceId");
CREATE INDEX "SalesInvoice_tenantCompanyId_crmCompanyId_idx" ON "SalesInvoice"("tenantCompanyId", "crmCompanyId");
CREATE INDEX "SalesInvoice_tenantCompanyId_crmCustomerId_idx" ON "SalesInvoice"("tenantCompanyId", "crmCustomerId");
CREATE INDEX "SalesInvoice_tenantCompanyId_quoteId_idx" ON "SalesInvoice"("tenantCompanyId", "quoteId");
CREATE INDEX "SalesInvoice_tenantCompanyId_status_idx" ON "SalesInvoice"("tenantCompanyId", "status");
CREATE INDEX "SalesInvoiceLine_invoiceId_idx" ON "SalesInvoiceLine"("invoiceId");
CREATE UNIQUE INDEX "SalesPayment_tenantCompanyId_number_key" ON "SalesPayment"("tenantCompanyId", "number");
CREATE INDEX "SalesPayment_tenantCompanyId_workspaceId_idx" ON "SalesPayment"("tenantCompanyId", "workspaceId");
CREATE INDEX "SalesPayment_tenantCompanyId_invoiceId_idx" ON "SalesPayment"("tenantCompanyId", "invoiceId");
CREATE INDEX "SalesPayment_tenantCompanyId_crmCompanyId_idx" ON "SalesPayment"("tenantCompanyId", "crmCompanyId");
CREATE INDEX "SalesPayment_tenantCompanyId_status_idx" ON "SalesPayment"("tenantCompanyId", "status");

ALTER TABLE "CrmCompany" ADD CONSTRAINT "CrmCompany_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesQuote" ADD CONSTRAINT "SalesQuote_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesQuote" ADD CONSTRAINT "SalesQuote_crmCustomerId_fkey" FOREIGN KEY ("crmCustomerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesQuote" ADD CONSTRAINT "SalesQuote_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesQuote" ADD CONSTRAINT "SalesQuote_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesQuoteLine" ADD CONSTRAINT "SalesQuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "SalesQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_crmCustomerId_fkey" FOREIGN KEY ("crmCustomerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "SalesQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesInvoiceLine" ADD CONSTRAINT "SalesInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
