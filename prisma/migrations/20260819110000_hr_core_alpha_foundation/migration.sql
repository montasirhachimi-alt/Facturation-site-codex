CREATE TABLE "HrDepartment" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "managerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrDepartment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrPosition" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "departmentId" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrEmployee" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "departmentId" TEXT,
    "positionId" TEXT,
    "managerEmployeeId" TEXT,
    "linkedUserId" TEXT,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrEmployee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrEmploymentContract" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "positionId" TEXT,
    "jobTitle" TEXT NOT NULL,
    "workingTimeType" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrEmploymentContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrLeaveType" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrLeaveType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HrLeaveRequest" (
    "id" TEXT NOT NULL,
    "tenantCompanyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT,
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedByEmployeeId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrLeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HrDepartment_tenantCompanyId_name_key" ON "HrDepartment"("tenantCompanyId", "name");
CREATE INDEX "HrDepartment_tenantCompanyId_active_idx" ON "HrDepartment"("tenantCompanyId", "active");
CREATE INDEX "HrDepartment_tenantCompanyId_managerId_idx" ON "HrDepartment"("tenantCompanyId", "managerId");

CREATE UNIQUE INDEX "HrPosition_tenantCompanyId_name_key" ON "HrPosition"("tenantCompanyId", "name");
CREATE INDEX "HrPosition_tenantCompanyId_departmentId_idx" ON "HrPosition"("tenantCompanyId", "departmentId");
CREATE INDEX "HrPosition_tenantCompanyId_active_idx" ON "HrPosition"("tenantCompanyId", "active");

CREATE UNIQUE INDEX "HrEmployee_tenantCompanyId_employeeNumber_key" ON "HrEmployee"("tenantCompanyId", "employeeNumber");
CREATE UNIQUE INDEX "HrEmployee_tenantCompanyId_linkedUserId_key" ON "HrEmployee"("tenantCompanyId", "linkedUserId");
CREATE INDEX "HrEmployee_tenantCompanyId_status_idx" ON "HrEmployee"("tenantCompanyId", "status");
CREATE INDEX "HrEmployee_tenantCompanyId_departmentId_idx" ON "HrEmployee"("tenantCompanyId", "departmentId");
CREATE INDEX "HrEmployee_tenantCompanyId_positionId_idx" ON "HrEmployee"("tenantCompanyId", "positionId");
CREATE INDEX "HrEmployee_tenantCompanyId_managerEmployeeId_idx" ON "HrEmployee"("tenantCompanyId", "managerEmployeeId");

CREATE INDEX "HrEmploymentContract_tenantCompanyId_employeeId_idx" ON "HrEmploymentContract"("tenantCompanyId", "employeeId");
CREATE INDEX "HrEmploymentContract_tenantCompanyId_status_idx" ON "HrEmploymentContract"("tenantCompanyId", "status");
CREATE INDEX "HrEmploymentContract_tenantCompanyId_positionId_idx" ON "HrEmploymentContract"("tenantCompanyId", "positionId");

CREATE UNIQUE INDEX "HrLeaveType_tenantCompanyId_name_key" ON "HrLeaveType"("tenantCompanyId", "name");
CREATE INDEX "HrLeaveType_tenantCompanyId_active_idx" ON "HrLeaveType"("tenantCompanyId", "active");

CREATE INDEX "HrLeaveRequest_tenantCompanyId_employeeId_idx" ON "HrLeaveRequest"("tenantCompanyId", "employeeId");
CREATE INDEX "HrLeaveRequest_tenantCompanyId_leaveTypeId_idx" ON "HrLeaveRequest"("tenantCompanyId", "leaveTypeId");
CREATE INDEX "HrLeaveRequest_tenantCompanyId_status_idx" ON "HrLeaveRequest"("tenantCompanyId", "status");
CREATE INDEX "HrLeaveRequest_tenantCompanyId_startDate_idx" ON "HrLeaveRequest"("tenantCompanyId", "startDate");

ALTER TABLE "HrDepartment" ADD CONSTRAINT "HrDepartment_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrDepartment" ADD CONSTRAINT "HrDepartment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "HrEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HrPosition" ADD CONSTRAINT "HrPosition_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrPosition" ADD CONSTRAINT "HrPosition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "HrPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_managerEmployeeId_fkey" FOREIGN KEY ("managerEmployeeId") REFERENCES "HrEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HrEmploymentContract" ADD CONSTRAINT "HrEmploymentContract_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrEmploymentContract" ADD CONSTRAINT "HrEmploymentContract_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrEmploymentContract" ADD CONSTRAINT "HrEmploymentContract_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "HrPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HrLeaveType" ADD CONSTRAINT "HrLeaveType_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_tenantCompanyId_fkey" FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_approvedByEmployeeId_fkey" FOREIGN KEY ("approvedByEmployeeId") REFERENCES "HrEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
