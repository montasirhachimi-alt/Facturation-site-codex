-- CreateTable
CREATE TABLE "CrmMeeting" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "crmCompanyId" TEXT NOT NULL,
    "crmContactId" TEXT,
    "contactIds" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "meetingType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,
    "participants" JSONB NOT NULL,
    "notes" TEXT,
    "tags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "crmCompanyId" TEXT NOT NULL,
    "crmContactId" TEXT,
    "meetingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "tags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmNote" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "crmCompanyId" TEXT NOT NULL,
    "crmContactId" TEXT,
    "meetingId" TEXT,
    "taskId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "attachments" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmMeeting_tenantCompanyId_workspaceId_idx" ON "CrmMeeting"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "CrmMeeting_tenantCompanyId_crmCompanyId_idx" ON "CrmMeeting"("tenantCompanyId", "crmCompanyId");

-- CreateIndex
CREATE INDEX "CrmMeeting_tenantCompanyId_crmContactId_idx" ON "CrmMeeting"("tenantCompanyId", "crmContactId");

-- CreateIndex
CREATE INDEX "CrmMeeting_tenantCompanyId_status_idx" ON "CrmMeeting"("tenantCompanyId", "status");

-- CreateIndex
CREATE INDEX "CrmTask_tenantCompanyId_workspaceId_idx" ON "CrmTask"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "CrmTask_tenantCompanyId_crmCompanyId_idx" ON "CrmTask"("tenantCompanyId", "crmCompanyId");

-- CreateIndex
CREATE INDEX "CrmTask_tenantCompanyId_crmContactId_idx" ON "CrmTask"("tenantCompanyId", "crmContactId");

-- CreateIndex
CREATE INDEX "CrmTask_tenantCompanyId_status_idx" ON "CrmTask"("tenantCompanyId", "status");

-- CreateIndex
CREATE INDEX "CrmNote_tenantCompanyId_workspaceId_idx" ON "CrmNote"("tenantCompanyId", "workspaceId");

-- CreateIndex
CREATE INDEX "CrmNote_tenantCompanyId_crmCompanyId_idx" ON "CrmNote"("tenantCompanyId", "crmCompanyId");

-- CreateIndex
CREATE INDEX "CrmNote_tenantCompanyId_crmContactId_idx" ON "CrmNote"("tenantCompanyId", "crmContactId");

-- CreateIndex
CREATE INDEX "CrmNote_tenantCompanyId_archivedAt_idx" ON "CrmNote"("tenantCompanyId", "archivedAt");

-- AddForeignKey
ALTER TABLE "CrmMeeting" ADD CONSTRAINT "CrmMeeting_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmMeeting" ADD CONSTRAINT "CrmMeeting_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmMeeting" ADD CONSTRAINT "CrmMeeting_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_crmCompanyId_fkey" FOREIGN KEY ("crmCompanyId") REFERENCES "CrmCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
