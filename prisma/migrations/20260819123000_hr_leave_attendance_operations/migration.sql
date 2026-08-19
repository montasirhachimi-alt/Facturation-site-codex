ALTER TABLE "HrLeaveType" ADD COLUMN "code" TEXT;
ALTER TABLE "HrLeaveType" ADD COLUMN "approvalRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "HrLeaveType" ADD COLUMN "balanceTracked" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "HrLeaveType" ADD COLUMN "defaultAnnualEntitlement" DECIMAL(10,2);

ALTER TABLE "HrLeaveRequest" ADD COLUMN "decidedAt" TIMESTAMP(3);
ALTER TABLE "HrLeaveRequest" ADD COLUMN "decisionByEmployeeId" TEXT;
ALTER TABLE "HrLeaveRequest" ADD COLUMN "decisionNote" TEXT;

CREATE TABLE "HrLeaveBalance" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "entitledDays" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "adjustmentDays" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "adjustmentReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrLeaveBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrAbsence" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "linkedLeaveRequestId" TEXT,
    "justified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrAbsence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrAttendanceRecord" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "recordedByEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrAttendanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HrLeaveType_tenantCompanyId_code_key" ON "HrLeaveType"("tenantCompanyId", "code");
CREATE INDEX "HrLeaveRequest_tenantCompanyId_decisionByEmployeeId_idx" ON "HrLeaveRequest"("tenantCompanyId", "decisionByEmployeeId");

CREATE UNIQUE INDEX "HrLeaveBalance_tenantCompanyId_employeeId_leaveTypeId_periodYear_key" ON "HrLeaveBalance"("tenantCompanyId", "employeeId", "leaveTypeId", "periodYear");
CREATE INDEX "HrLeaveBalance_tenantCompanyId_employeeId_idx" ON "HrLeaveBalance"("tenantCompanyId", "employeeId");
CREATE INDEX "HrLeaveBalance_tenantCompanyId_leaveTypeId_idx" ON "HrLeaveBalance"("tenantCompanyId", "leaveTypeId");
CREATE INDEX "HrLeaveBalance_tenantCompanyId_periodYear_idx" ON "HrLeaveBalance"("tenantCompanyId", "periodYear");

CREATE INDEX "HrAbsence_tenantCompanyId_employeeId_idx" ON "HrAbsence"("tenantCompanyId", "employeeId");
CREATE INDEX "HrAbsence_tenantCompanyId_startDate_idx" ON "HrAbsence"("tenantCompanyId", "startDate");
CREATE INDEX "HrAbsence_tenantCompanyId_type_idx" ON "HrAbsence"("tenantCompanyId", "type");
CREATE INDEX "HrAbsence_tenantCompanyId_linkedLeaveRequestId_idx" ON "HrAbsence"("tenantCompanyId", "linkedLeaveRequestId");

CREATE UNIQUE INDEX "HrAttendanceRecord_tenantCompanyId_employeeId_date_key" ON "HrAttendanceRecord"("tenantCompanyId", "employeeId", "date");
CREATE INDEX "HrAttendanceRecord_tenantCompanyId_date_idx" ON "HrAttendanceRecord"("tenantCompanyId", "date");
CREATE INDEX "HrAttendanceRecord_tenantCompanyId_status_idx" ON "HrAttendanceRecord"("tenantCompanyId", "status");

ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_decisionByEmployeeId_fkey" FOREIGN KEY ("decisionByEmployeeId") REFERENCES "HrEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HrLeaveBalance" ADD CONSTRAINT "HrLeaveBalance_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrLeaveBalance" ADD CONSTRAINT "HrLeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrLeaveBalance" ADD CONSTRAINT "HrLeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HrAbsence" ADD CONSTRAINT "HrAbsence_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrAbsence" ADD CONSTRAINT "HrAbsence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrAbsence" ADD CONSTRAINT "HrAbsence_linkedLeaveRequestId_fkey" FOREIGN KEY ("linkedLeaveRequestId") REFERENCES "HrLeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HrAttendanceRecord" ADD CONSTRAINT "HrAttendanceRecord_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrAttendanceRecord" ADD CONSTRAINT "HrAttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrAttendanceRecord" ADD CONSTRAINT "HrAttendanceRecord_recordedByEmployeeId_fkey" FOREIGN KEY ("recordedByEmployeeId") REFERENCES "HrEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
