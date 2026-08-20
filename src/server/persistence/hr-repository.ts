import "server-only";

import type { Prisma } from "@prisma/client";
import {
  buildEmployeeDisplayName,
  type HrAbsence,
  type HrAbsenceId,
  type HrAttendanceRecord,
  type HrAttendanceRecordId,
  type HrDepartment,
  type HrDepartmentId,
  type HrDocumentTemplate,
  type HrDocumentTemplateId,
  type HrDocumentType,
  type HrDocumentTypeId,
  type HrEmployee,
  type HrEmployeeDocument,
  type HrEmployeeDocumentId,
  type HrEmployeeId,
  type HrEmploymentContract,
  type HrEmploymentContractId,
  type HrLeaveBalance,
  type HrLeaveBalanceId,
  type HrLeaveRequest,
  type HrLeaveRequestId,
  type HrLeaveType,
  type HrLeaveTypeId,
  type HrPosition,
  type HrPositionId,
  type HrSnapshot,
  type HrTenantCompanyId
} from "@/modules/hr";
import { prisma } from "./prisma";
import type { PersistenceTenantScope } from "./tenant-scope";

type DbDepartment = Prisma.HrDepartmentGetPayload<Record<string, never>>;
type DbPosition = Prisma.HrPositionGetPayload<Record<string, never>>;
type DbEmployee = Prisma.HrEmployeeGetPayload<Record<string, never>>;
type DbContract = Prisma.HrEmploymentContractGetPayload<Record<string, never>>;
type DbLeaveType = Prisma.HrLeaveTypeGetPayload<Record<string, never>>;
type DbLeaveRequest = Prisma.HrLeaveRequestGetPayload<Record<string, never>>;
type DbLeaveBalance = Prisma.HrLeaveBalanceGetPayload<Record<string, never>>;
type DbAbsence = Prisma.HrAbsenceGetPayload<Record<string, never>>;
type DbAttendanceRecord = Prisma.HrAttendanceRecordGetPayload<Record<string, never>>;
type DbDocumentType = Prisma.HrDocumentTypeGetPayload<Record<string, never>>;
type DbDocumentTemplate = Prisma.HrDocumentTemplateGetPayload<Record<string, never>>;
type DbEmployeeDocument = Prisma.HrEmployeeDocumentGetPayload<Record<string, never>>;

export type HrPersistenceResource = "department" | "position" | "employee" | "contract" | "leaveType" | "leaveRequest" | "leaveBalance" | "absence" | "attendanceRecord" | "documentType" | "documentTemplate" | "employeeDocument";

export async function loadHrSnapshot(scope: PersistenceTenantScope): Promise<HrSnapshot> {
  const [departments, positions, employees, contracts, leaveTypes, leaveRequests, leaveBalances, absences, attendanceRecords, documentTypes, documentTemplates, employeeDocuments] = await Promise.all([
    prisma.hrDepartment.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ name: "asc" }] }),
    prisma.hrPosition.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ name: "asc" }] }),
    prisma.hrEmployee.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ displayName: "asc" }] }),
    prisma.hrEmploymentContract.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ startDate: "desc" }] }),
    prisma.hrLeaveType.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ name: "asc" }] }),
    prisma.hrLeaveRequest.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ startDate: "desc" }] }),
    prisma.hrLeaveBalance.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ periodYear: "desc" }] }),
    prisma.hrAbsence.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ startDate: "desc" }] }),
    prisma.hrAttendanceRecord.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ date: "desc" }] }),
    prisma.hrDocumentType.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ name: "asc" }] }),
    prisma.hrDocumentTemplate.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ name: "asc" }] }),
    prisma.hrEmployeeDocument.findMany({ where: { tenantCompanyId: scope.companyId }, orderBy: [{ updatedAt: "desc" }] })
  ]);

  return Object.freeze({
    departments: Object.freeze(departments.map(mapDbDepartment)),
    positions: Object.freeze(positions.map(mapDbPosition)),
    employees: Object.freeze(employees.map(mapDbEmployee)),
    contracts: Object.freeze(contracts.map(mapDbContract)),
    leaveTypes: Object.freeze(leaveTypes.map(mapDbLeaveType)),
    leaveRequests: Object.freeze(leaveRequests.map(mapDbLeaveRequest)),
    leaveBalances: Object.freeze(leaveBalances.map(mapDbLeaveBalance)),
    absences: Object.freeze(absences.map(mapDbAbsence)),
    attendanceRecords: Object.freeze(attendanceRecords.map(mapDbAttendanceRecord)),
    documentTypes: Object.freeze(documentTypes.map(mapDbDocumentType)),
    documentTemplates: Object.freeze(documentTemplates.map(mapDbDocumentTemplate)),
    employeeDocuments: Object.freeze(employeeDocuments.map(mapDbEmployeeDocument))
  });
}

export async function persistHrRecord(scope: PersistenceTenantScope, resource: HrPersistenceResource, record: unknown) {
  if (resource === "department") return persistDepartment(scope, record as HrDepartment);
  if (resource === "position") return persistPosition(scope, record as HrPosition);
  if (resource === "employee") return persistEmployee(scope, record as HrEmployee);
  if (resource === "contract") return persistContract(scope, record as HrEmploymentContract);
  if (resource === "leaveType") return persistLeaveType(scope, record as HrLeaveType);
  if (resource === "leaveRequest") return persistLeaveRequest(scope, record as HrLeaveRequest);
  if (resource === "leaveBalance") return persistLeaveBalance(scope, record as HrLeaveBalance);
  if (resource === "absence") return persistAbsence(scope, record as HrAbsence);
  if (resource === "attendanceRecord") return persistAttendanceRecord(scope, record as HrAttendanceRecord);
  if (resource === "documentType") return persistDocumentType(scope, record as HrDocumentType);
  if (resource === "documentTemplate") return persistDocumentTemplate(scope, record as HrDocumentTemplate);
  if (resource === "employeeDocument") return persistEmployeeDocument(scope, record as HrEmployeeDocument);
  throw new Error("Ressource RH inconnue.");
}

async function persistDepartment(scope: PersistenceTenantScope, department: HrDepartment) {
  await assertExistingHrTenant(scope, "department", department.id);
  await assertOptionalEmployeeTenant(scope, department.managerId);
  const saved = await prisma.hrDepartment.upsert({
    where: { id: department.id },
    update: departmentWriteData(department),
    create: { id: department.id, tenantCompanyId: scope.companyId, ...departmentWriteData(department) }
  });
  return mapDbDepartment(saved);
}

async function persistPosition(scope: PersistenceTenantScope, position: HrPosition) {
  await assertExistingHrTenant(scope, "position", position.id);
  await assertOptionalDepartmentTenant(scope, position.departmentId);
  const saved = await prisma.hrPosition.upsert({
    where: { id: position.id },
    update: positionWriteData(position),
    create: { id: position.id, tenantCompanyId: scope.companyId, ...positionWriteData(position) }
  });
  return mapDbPosition(saved);
}

async function persistEmployee(scope: PersistenceTenantScope, employee: HrEmployee) {
  await assertExistingHrTenant(scope, "employee", employee.id);
  await assertOptionalDepartmentTenant(scope, employee.departmentId);
  await assertOptionalPositionTenant(scope, employee.positionId);
  await assertOptionalEmployeeTenant(scope, employee.managerEmployeeId);
  await assertOptionalUserTenant(scope, employee.linkedUserId);
  if (employee.managerEmployeeId && employee.managerEmployeeId === employee.id) throw new Error("Un employé ne peut pas être son propre manager.");
  const displayName = buildEmployeeDisplayName(employee.firstName, employee.lastName);
  const saved = await prisma.hrEmployee.upsert({
    where: { id: employee.id },
    update: employeeWriteData({ ...employee, displayName }),
    create: { id: employee.id, tenantCompanyId: scope.companyId, ...employeeWriteData({ ...employee, displayName }) }
  });
  return mapDbEmployee(saved);
}

async function persistContract(scope: PersistenceTenantScope, contract: HrEmploymentContract) {
  await assertExistingHrTenant(scope, "contract", contract.id);
  await assertEmployeeTenant(scope, contract.employeeId);
  await assertOptionalPositionTenant(scope, contract.positionId);
  const saved = await prisma.hrEmploymentContract.upsert({
    where: { id: contract.id },
    update: contractWriteData(contract),
    create: { id: contract.id, tenantCompanyId: scope.companyId, ...contractWriteData(contract) }
  });
  return mapDbContract(saved);
}

async function persistLeaveType(scope: PersistenceTenantScope, leaveType: HrLeaveType) {
  await assertExistingHrTenant(scope, "leaveType", leaveType.id);
  const saved = await prisma.hrLeaveType.upsert({
    where: { id: leaveType.id },
    update: leaveTypeWriteData(leaveType),
    create: { id: leaveType.id, tenantCompanyId: scope.companyId, ...leaveTypeWriteData(leaveType) }
  });
  return mapDbLeaveType(saved);
}

async function persistLeaveRequest(scope: PersistenceTenantScope, request: HrLeaveRequest) {
  await assertExistingHrTenant(scope, "leaveRequest", request.id);
  await assertEmployeeTenant(scope, request.employeeId);
  await assertOptionalLeaveTypeTenant(scope, request.leaveTypeId);
  await assertOptionalEmployeeTenant(scope, request.approvedByEmployeeId);
  await assertOptionalEmployeeTenant(scope, request.decisionByEmployeeId);
  if (new Date(request.endDate).getTime() < new Date(request.startDate).getTime()) throw new Error("La date de fin doit être postérieure à la date de début.");
  const saved = await prisma.hrLeaveRequest.upsert({
    where: { id: request.id },
    update: leaveRequestWriteData(request),
    create: { id: request.id, tenantCompanyId: scope.companyId, ...leaveRequestWriteData(request) }
  });
  return mapDbLeaveRequest(saved);
}

async function persistLeaveBalance(scope: PersistenceTenantScope, balance: HrLeaveBalance) {
  await assertExistingHrTenant(scope, "leaveBalance", balance.id);
  await assertEmployeeTenant(scope, balance.employeeId);
  await assertLeaveTypeTenant(scope, balance.leaveTypeId);
  const saved = await prisma.hrLeaveBalance.upsert({
    where: { id: balance.id },
    update: leaveBalanceWriteData(balance),
    create: { id: balance.id, tenantCompanyId: scope.companyId, ...leaveBalanceWriteData(balance) }
  });
  return mapDbLeaveBalance(saved);
}

async function persistAbsence(scope: PersistenceTenantScope, absence: HrAbsence) {
  await assertExistingHrTenant(scope, "absence", absence.id);
  await assertEmployeeTenant(scope, absence.employeeId);
  await assertOptionalLeaveRequestTenant(scope, absence.linkedLeaveRequestId);
  if (new Date(absence.endDate).getTime() < new Date(absence.startDate).getTime()) throw new Error("La date de fin doit être postérieure à la date de début.");
  await assertNoContradictoryAttendanceForAbsence(scope, absence);
  const saved = await prisma.hrAbsence.upsert({
    where: { id: absence.id },
    update: absenceWriteData(absence),
    create: { id: absence.id, tenantCompanyId: scope.companyId, ...absenceWriteData(absence) }
  });
  return mapDbAbsence(saved);
}

async function persistAttendanceRecord(scope: PersistenceTenantScope, record: HrAttendanceRecord) {
  await assertExistingHrTenant(scope, "attendanceRecord", record.id);
  await assertEmployeeTenant(scope, record.employeeId);
  await assertOptionalEmployeeTenant(scope, record.recordedByEmployeeId);
  await assertAttendanceConsistency(scope, record);
  const saved = await prisma.hrAttendanceRecord.upsert({
    where: { id: record.id },
    update: attendanceRecordWriteData(record),
    create: { id: record.id, tenantCompanyId: scope.companyId, ...attendanceRecordWriteData(record) }
  });
  return mapDbAttendanceRecord(saved);
}

async function persistDocumentType(scope: PersistenceTenantScope, type: HrDocumentType) {
  await assertExistingHrTenant(scope, "documentType", type.id);
  const saved = await prisma.hrDocumentType.upsert({
    where: { id: type.id },
    update: documentTypeWriteData(type),
    create: { id: type.id, tenantCompanyId: scope.companyId, ...documentTypeWriteData(type) }
  });
  return mapDbDocumentType(saved);
}

async function persistDocumentTemplate(scope: PersistenceTenantScope, template: HrDocumentTemplate) {
  await assertExistingHrTenant(scope, "documentTemplate", template.id);
  await assertOptionalDocumentTypeTenant(scope, template.documentTypeId);
  assertSafeTemplateBody(template.body);
  const saved = await prisma.hrDocumentTemplate.upsert({
    where: { id: template.id },
    update: documentTemplateWriteData(template),
    create: { id: template.id, tenantCompanyId: scope.companyId, ...documentTemplateWriteData(template) }
  });
  return mapDbDocumentTemplate(saved);
}

async function persistEmployeeDocument(scope: PersistenceTenantScope, document: HrEmployeeDocument) {
  await assertExistingHrTenant(scope, "employeeDocument", document.id);
  await assertEmployeeTenant(scope, document.employeeId);
  await assertOptionalDocumentTypeTenant(scope, document.documentTypeId);
  await assertOptionalDocumentTemplateTenant(scope, document.templateId);
  await assertOptionalContractTenant(scope, document.contractId, document.employeeId);
  assertSafeStorageMetadata(document);
  const saved = await prisma.hrEmployeeDocument.upsert({
    where: { id: document.id },
    update: employeeDocumentWriteData(document),
    create: { id: document.id, tenantCompanyId: scope.companyId, ...employeeDocumentWriteData(document) }
  });
  return mapDbEmployeeDocument(saved);
}

async function assertNoContradictoryAttendanceForAbsence(scope: PersistenceTenantScope, absence: HrAbsence) {
  if (absence.source !== "manual") return;
  const conflicting = await prisma.hrAttendanceRecord.findFirst({
    where: {
      tenantCompanyId: scope.companyId,
      employeeId: absence.employeeId,
      status: { not: "absent" },
      date: {
        gte: startOfDateOnly(absence.startDate),
        lte: endOfDateOnly(absence.endDate)
      }
    },
    select: { id: true }
  });
  if (conflicting) throw new Error("Une présence contradictoire existe sur la période. Résolvez la présence avant d'enregistrer l'absence.");
}

async function assertAttendanceConsistency(scope: PersistenceTenantScope, record: HrAttendanceRecord) {
  const recordDate = startOfDateOnly(record.date);
  const approvedLeave = await prisma.hrLeaveRequest.findFirst({
    where: {
      tenantCompanyId: scope.companyId,
      employeeId: record.employeeId,
      status: "approved",
      startDate: { lte: endOfDateOnly(record.date) },
      endDate: { gte: recordDate }
    },
    select: { id: true }
  });
  if (approvedLeave && record.status === "present") throw new Error("Un congé approuvé existe pour cette date. Utilisez le statut En congé ou résolvez le congé.");

  const manualAbsence = await prisma.hrAbsence.findFirst({
    where: {
      tenantCompanyId: scope.companyId,
      employeeId: record.employeeId,
      source: "manual",
      startDate: { lte: endOfDateOnly(record.date) },
      endDate: { gte: recordDate }
    },
    select: { id: true }
  });
  if (manualAbsence && record.status !== "absent") throw new Error("Une absence manuelle existe pour cette date. Seul le statut Absent est compatible.");
}

async function assertExistingHrTenant(scope: PersistenceTenantScope, resource: HrPersistenceResource, id: string) {
  const existing = await findExistingHrTenant(resource, id);
  if (existing && existing.tenantCompanyId !== scope.companyId) {
    throw new Error("Enregistrement RH introuvable pour cette entreprise.");
  }
}

async function findExistingHrTenant(resource: HrPersistenceResource, id: string) {
  if (resource === "department") return prisma.hrDepartment.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "position") return prisma.hrPosition.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "employee") return prisma.hrEmployee.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "contract") return prisma.hrEmploymentContract.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "leaveType") return prisma.hrLeaveType.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "leaveRequest") return prisma.hrLeaveRequest.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "leaveBalance") return prisma.hrLeaveBalance.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "absence") return prisma.hrAbsence.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "attendanceRecord") return prisma.hrAttendanceRecord.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "documentType") return prisma.hrDocumentType.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (resource === "documentTemplate") return prisma.hrDocumentTemplate.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  return prisma.hrEmployeeDocument.findUnique({ where: { id }, select: { tenantCompanyId: true } });
}

async function assertEmployeeTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.hrEmployee.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Employé introuvable pour cette entreprise.");
}

async function assertOptionalEmployeeTenant(scope: PersistenceTenantScope, id?: string) {
  if (!id) return;
  await assertEmployeeTenant(scope, id);
}

async function assertOptionalDepartmentTenant(scope: PersistenceTenantScope, id?: string) {
  if (!id) return;
  const existing = await prisma.hrDepartment.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Département introuvable pour cette entreprise.");
}

async function assertOptionalPositionTenant(scope: PersistenceTenantScope, id?: string) {
  if (!id) return;
  const existing = await prisma.hrPosition.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Poste introuvable pour cette entreprise.");
}

async function assertOptionalLeaveTypeTenant(scope: PersistenceTenantScope, id?: string) {
  if (!id) return;
  await assertLeaveTypeTenant(scope, id);
}

async function assertLeaveTypeTenant(scope: PersistenceTenantScope, id: string) {
  const existing = await prisma.hrLeaveType.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Type de congé introuvable pour cette entreprise.");
}

async function assertOptionalLeaveRequestTenant(scope: PersistenceTenantScope, id?: string) {
  if (!id) return;
  const existing = await prisma.hrLeaveRequest.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Demande de congé introuvable pour cette entreprise.");
}

async function assertOptionalDocumentTypeTenant(scope: PersistenceTenantScope, id?: string) {
  if (!id) return;
  const existing = await prisma.hrDocumentType.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Type de document introuvable pour cette entreprise.");
}

async function assertOptionalDocumentTemplateTenant(scope: PersistenceTenantScope, id?: string) {
  if (!id) return;
  const existing = await prisma.hrDocumentTemplate.findUnique({ where: { id }, select: { tenantCompanyId: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId) throw new Error("Modèle RH introuvable pour cette entreprise.");
}

async function assertOptionalContractTenant(scope: PersistenceTenantScope, id?: string, employeeId?: string) {
  if (!id) return;
  const existing = await prisma.hrEmploymentContract.findUnique({ where: { id }, select: { tenantCompanyId: true, employeeId: true } });
  if (!existing || existing.tenantCompanyId !== scope.companyId || (employeeId && existing.employeeId !== employeeId)) throw new Error("Contrat introuvable pour cet employé.");
}

async function assertOptionalUserTenant(scope: PersistenceTenantScope, id?: string) {
  if (!id) return;
  const existing = await prisma.user.findUnique({ where: { id }, select: { companyId: true } });
  if (!existing || existing.companyId !== scope.companyId) throw new Error("Utilisateur lié introuvable pour cette entreprise.");
}

function departmentWriteData(department: HrDepartment) {
  return {
    code: emptyToNull(department.code),
    name: department.name.trim(),
    description: emptyToNull(department.description),
    managerId: department.managerId ?? null,
    active: department.active,
    updatedAt: parseDate(department.updatedAt)
  };
}

function positionWriteData(position: HrPosition) {
  return {
    code: emptyToNull(position.code),
    name: position.name.trim(),
    departmentId: position.departmentId ?? null,
    description: emptyToNull(position.description),
    active: position.active,
    updatedAt: parseDate(position.updatedAt)
  };
}

function employeeWriteData(employee: HrEmployee) {
  return {
    employeeNumber: employee.employeeNumber.trim(),
    firstName: employee.firstName.trim(),
    lastName: employee.lastName.trim(),
    displayName: employee.displayName.trim(),
    email: emptyToNull(employee.email),
    phone: emptyToNull(employee.phone),
    dateOfBirth: parseOptionalDate(employee.dateOfBirth),
    hireDate: parseDate(employee.hireDate),
    terminationDate: parseOptionalDate(employee.terminationDate),
    status: employee.status,
    departmentId: employee.departmentId ?? null,
    positionId: employee.positionId ?? null,
    managerEmployeeId: employee.managerEmployeeId ?? null,
    linkedUserId: employee.linkedUserId ?? null,
    notes: emptyToNull(employee.notes),
    archivedAt: parseOptionalDate(employee.archivedAt),
    updatedAt: parseDate(employee.updatedAt)
  };
}

function contractWriteData(contract: HrEmploymentContract) {
  return {
    employeeId: contract.employeeId,
    contractType: contract.contractType,
    startDate: parseDate(contract.startDate),
    endDate: parseOptionalDate(contract.endDate),
    positionId: contract.positionId ?? null,
    jobTitle: contract.jobTitle.trim(),
    workingTimeType: contract.workingTimeType ?? null,
    notes: emptyToNull(contract.notes),
    status: contract.status,
    archivedAt: parseOptionalDate(contract.archivedAt),
    updatedAt: parseDate(contract.updatedAt)
  };
}

function leaveTypeWriteData(leaveType: HrLeaveType) {
  return {
    code: emptyToNull(leaveType.code),
    name: leaveType.name.trim(),
    description: emptyToNull(leaveType.description),
    paid: leaveType.paid,
    approvalRequired: leaveType.approvalRequired,
    balanceTracked: leaveType.balanceTracked,
    defaultAnnualEntitlement: leaveType.defaultAnnualEntitlement ?? null,
    active: leaveType.active,
    updatedAt: parseDate(leaveType.updatedAt)
  };
}

function leaveRequestWriteData(request: HrLeaveRequest) {
  return {
    employeeId: request.employeeId,
    leaveTypeId: request.leaveTypeId ?? null,
    title: request.title.trim(),
    reason: emptyToNull(request.reason),
    startDate: parseDate(request.startDate),
    endDate: parseDate(request.endDate),
    status: request.status,
    requestedAt: parseDate(request.requestedAt),
    approvedAt: parseOptionalDate(request.approvedAt),
    approvedByEmployeeId: request.approvedByEmployeeId ?? null,
    decidedAt: parseOptionalDate(request.decidedAt),
    decisionByEmployeeId: request.decisionByEmployeeId ?? null,
    decisionNote: emptyToNull(request.decisionNote),
    archivedAt: parseOptionalDate(request.archivedAt),
    updatedAt: parseDate(request.updatedAt)
  };
}

function leaveBalanceWriteData(balance: HrLeaveBalance) {
  return {
    employeeId: balance.employeeId,
    leaveTypeId: balance.leaveTypeId,
    periodYear: balance.periodYear,
    entitledDays: balance.entitledDays,
    adjustmentDays: balance.adjustmentDays,
    adjustmentReason: emptyToNull(balance.adjustmentReason),
    updatedAt: parseDate(balance.updatedAt)
  };
}

function absenceWriteData(absence: HrAbsence) {
  return {
    employeeId: absence.employeeId,
    startDate: parseDate(absence.startDate),
    endDate: parseDate(absence.endDate),
    type: absence.type.trim(),
    source: absence.source,
    linkedLeaveRequestId: absence.linkedLeaveRequestId ?? null,
    justified: absence.justified,
    notes: emptyToNull(absence.notes),
    updatedAt: parseDate(absence.updatedAt)
  };
}

function attendanceRecordWriteData(record: HrAttendanceRecord) {
  return {
    employeeId: record.employeeId,
    date: parseDate(record.date),
    status: record.status,
    note: emptyToNull(record.note),
    recordedByEmployeeId: record.recordedByEmployeeId ?? null,
    updatedAt: parseDate(record.updatedAt)
  };
}

function documentTypeWriteData(type: HrDocumentType) {
  return {
    code: emptyToNull(type.code),
    name: type.name.trim(),
    category: type.category.trim(),
    active: type.active,
    requiredByDefault: type.requiredByDefault,
    description: emptyToNull(type.description),
    updatedAt: parseDate(type.updatedAt)
  };
}

function documentTemplateWriteData(template: HrDocumentTemplate) {
  return {
    code: emptyToNull(template.code),
    name: template.name.trim(),
    documentTypeId: template.documentTypeId ?? null,
    templateFormat: template.templateFormat,
    body: template.body,
    active: template.active,
    description: emptyToNull(template.description),
    updatedAt: parseDate(template.updatedAt)
  };
}

function employeeDocumentWriteData(document: HrEmployeeDocument) {
  return {
    employeeId: document.employeeId,
    documentTypeId: document.documentTypeId ?? null,
    templateId: document.templateId ?? null,
    contractId: document.contractId ?? null,
    title: document.title.trim(),
    category: document.category.trim(),
    status: document.status,
    source: document.source,
    storageReference: emptyToNull(document.storageReference),
    storageFilename: emptyToNull(document.storageFilename),
    storageMimeType: emptyToNull(document.storageMimeType),
    storageSizeBytes: document.storageSizeBytes ?? null,
    generatedContent: emptyToNull(document.generatedContent),
    generatedFromTemplateName: emptyToNull(document.generatedFromTemplateName),
    issuedDate: parseOptionalDate(document.issuedDate),
    receivedDate: parseOptionalDate(document.receivedDate),
    expiryDate: parseOptionalDate(document.expiryDate),
    required: document.required,
    notes: emptyToNull(document.notes),
    generatedAt: parseOptionalDate(document.generatedAt),
    uploadedAt: parseOptionalDate(document.uploadedAt),
    finalizedAt: parseOptionalDate(document.finalizedAt),
    archivedAt: parseOptionalDate(document.archivedAt),
    updatedAt: parseDate(document.updatedAt)
  };
}

function mapDbDepartment(row: DbDepartment): HrDepartment {
  return Object.freeze({
    id: row.id as HrDepartmentId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    code: row.code ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    managerId: row.managerId as HrDepartment["managerId"] | undefined,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbPosition(row: DbPosition): HrPosition {
  return Object.freeze({
    id: row.id as HrPositionId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    code: row.code ?? undefined,
    name: row.name,
    departmentId: row.departmentId as HrPosition["departmentId"] | undefined,
    description: row.description ?? undefined,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbEmployee(row: DbEmployee): HrEmployee {
  return Object.freeze({
    id: row.id as HrEmployeeId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    employeeNumber: row.employeeNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: row.displayName,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    dateOfBirth: row.dateOfBirth?.toISOString(),
    hireDate: row.hireDate.toISOString(),
    terminationDate: row.terminationDate?.toISOString(),
    status: row.status as HrEmployee["status"],
    departmentId: row.departmentId as HrEmployee["departmentId"] | undefined,
    positionId: row.positionId as HrEmployee["positionId"] | undefined,
    managerEmployeeId: row.managerEmployeeId as HrEmployee["managerEmployeeId"] | undefined,
    linkedUserId: row.linkedUserId as HrEmployee["linkedUserId"] | undefined,
    notes: row.notes ?? undefined,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbContract(row: DbContract): HrEmploymentContract {
  return Object.freeze({
    id: row.id as HrEmploymentContractId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    employeeId: row.employeeId as HrEmployeeId,
    contractType: row.contractType as HrEmploymentContract["contractType"],
    startDate: row.startDate.toISOString(),
    endDate: row.endDate?.toISOString(),
    positionId: row.positionId as HrEmploymentContract["positionId"] | undefined,
    jobTitle: row.jobTitle,
    workingTimeType: row.workingTimeType as HrEmploymentContract["workingTimeType"] | undefined,
    notes: row.notes ?? undefined,
    status: row.status as HrEmploymentContract["status"],
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbLeaveType(row: DbLeaveType): HrLeaveType {
  return Object.freeze({
    id: row.id as HrLeaveTypeId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    code: row.code ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    paid: row.paid,
    approvalRequired: row.approvalRequired,
    balanceTracked: row.balanceTracked,
    defaultAnnualEntitlement: row.defaultAnnualEntitlement?.toString(),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbLeaveRequest(row: DbLeaveRequest): HrLeaveRequest {
  return Object.freeze({
    id: row.id as HrLeaveRequestId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    employeeId: row.employeeId as HrEmployeeId,
    leaveTypeId: row.leaveTypeId as HrLeaveRequest["leaveTypeId"] | undefined,
    title: row.title,
    reason: row.reason ?? undefined,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    status: row.status as HrLeaveRequest["status"],
    requestedAt: row.requestedAt.toISOString(),
    approvedAt: row.approvedAt?.toISOString(),
    approvedByEmployeeId: row.approvedByEmployeeId as HrLeaveRequest["approvedByEmployeeId"] | undefined,
    decidedAt: row.decidedAt?.toISOString(),
    decisionByEmployeeId: row.decisionByEmployeeId as HrLeaveRequest["decisionByEmployeeId"] | undefined,
    decisionNote: row.decisionNote ?? undefined,
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbLeaveBalance(row: DbLeaveBalance): HrLeaveBalance {
  return Object.freeze({
    id: row.id as HrLeaveBalanceId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    employeeId: row.employeeId as HrEmployeeId,
    leaveTypeId: row.leaveTypeId as HrLeaveTypeId,
    periodYear: row.periodYear,
    entitledDays: row.entitledDays.toString(),
    adjustmentDays: row.adjustmentDays.toString(),
    adjustmentReason: row.adjustmentReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbAbsence(row: DbAbsence): HrAbsence {
  return Object.freeze({
    id: row.id as HrAbsenceId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    employeeId: row.employeeId as HrEmployeeId,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    type: row.type,
    source: row.source as HrAbsence["source"],
    linkedLeaveRequestId: row.linkedLeaveRequestId as HrAbsence["linkedLeaveRequestId"] | undefined,
    justified: row.justified,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbAttendanceRecord(row: DbAttendanceRecord): HrAttendanceRecord {
  return Object.freeze({
    id: row.id as HrAttendanceRecordId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    employeeId: row.employeeId as HrEmployeeId,
    date: row.date.toISOString(),
    status: row.status as HrAttendanceRecord["status"],
    note: row.note ?? undefined,
    recordedByEmployeeId: row.recordedByEmployeeId as HrAttendanceRecord["recordedByEmployeeId"] | undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbDocumentType(row: DbDocumentType): HrDocumentType {
  return Object.freeze({
    id: row.id as HrDocumentTypeId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    code: row.code ?? undefined,
    name: row.name,
    category: row.category,
    active: row.active,
    requiredByDefault: row.requiredByDefault,
    description: row.description ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbDocumentTemplate(row: DbDocumentTemplate): HrDocumentTemplate {
  return Object.freeze({
    id: row.id as HrDocumentTemplateId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    code: row.code ?? undefined,
    name: row.name,
    documentTypeId: row.documentTypeId as HrDocumentTemplate["documentTypeId"] | undefined,
    templateFormat: row.templateFormat as HrDocumentTemplate["templateFormat"],
    body: row.body,
    active: row.active,
    description: row.description ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function mapDbEmployeeDocument(row: DbEmployeeDocument): HrEmployeeDocument {
  return Object.freeze({
    id: row.id as HrEmployeeDocumentId,
    tenantCompanyId: row.tenantCompanyId as HrTenantCompanyId,
    employeeId: row.employeeId as HrEmployeeId,
    documentTypeId: row.documentTypeId as HrEmployeeDocument["documentTypeId"] | undefined,
    templateId: row.templateId as HrEmployeeDocument["templateId"] | undefined,
    contractId: row.contractId as HrEmployeeDocument["contractId"] | undefined,
    title: row.title,
    category: row.category,
    status: row.status as HrEmployeeDocument["status"],
    source: row.source as HrEmployeeDocument["source"],
    storageReference: row.storageReference ?? undefined,
    storageFilename: row.storageFilename ?? undefined,
    storageMimeType: row.storageMimeType ?? undefined,
    storageSizeBytes: row.storageSizeBytes ?? undefined,
    generatedContent: row.generatedContent ?? undefined,
    generatedFromTemplateName: row.generatedFromTemplateName ?? undefined,
    issuedDate: row.issuedDate?.toISOString(),
    receivedDate: row.receivedDate?.toISOString(),
    expiryDate: row.expiryDate?.toISOString(),
    required: row.required,
    notes: row.notes ?? undefined,
    generatedAt: row.generatedAt?.toISOString(),
    uploadedAt: row.uploadedAt?.toISOString(),
    finalizedAt: row.finalizedAt?.toISOString(),
    archivedAt: row.archivedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });
}

function parseDate(value: string) {
  return new Date(value);
}

function startOfDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function endOfDateOnly(value: string) {
  const date = startOfDateOnly(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

function parseOptionalDate(value?: string) {
  return value ? new Date(value) : null;
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function assertSafeTemplateBody(body: string) {
  if (/<script/i.test(body) || /javascript:/i.test(body)) throw new Error("Le modèle RH contient du contenu non autorisé.");
  const allowed = new Set([
    "employee.firstName",
    "employee.lastName",
    "employee.displayName",
    "employee.employeeNumber",
    "employee.email",
    "employee.phone",
    "employee.hireDate",
    "department.name",
    "position.name",
    "manager.displayName",
    "contract.type",
    "contract.startDate",
    "contract.endDate",
    "contract.title",
    "contract.workingTimeType",
    "company.name",
    "company.address",
    "company.email",
    "company.phone"
  ]);
  const unknown = [...body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((match) => match[1]).filter((key, index, keys) => !allowed.has(key) && keys.indexOf(key) === index);
  if (unknown.length) throw new Error(`Variable inconnue dans le modèle RH: ${unknown.join(", ")}.`);
}

function assertSafeStorageMetadata(document: HrEmployeeDocument) {
  if (!document.storageReference && !document.storageFilename && !document.storageMimeType) return;
  if (document.storageReference && (document.storageReference.includes("..") || document.storageReference.startsWith("/") || /^https?:\/\//i.test(document.storageReference))) {
    throw new Error("Référence de stockage RH invalide.");
  }
  if (document.storageFilename && /[\\/]/.test(document.storageFilename)) throw new Error("Nom de fichier RH invalide.");
  if (document.storageMimeType && !["application/pdf", "image/png", "image/jpeg"].includes(document.storageMimeType)) throw new Error("Format de fichier RH non supporté.");
  if (document.storageSizeBytes !== undefined && (document.storageSizeBytes <= 0 || document.storageSizeBytes > 10 * 1024 * 1024)) throw new Error("Taille de fichier RH invalide.");
}
