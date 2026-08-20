import { HR_CONTRACT_TYPE_LABELS, HR_TEMPLATE_VARIABLES, HR_WORKING_TIME_TYPE_LABELS } from "./hr.constants";
import {
  buildEmployeeDisplayName,
  buildHrCalendarItems,
  buildLeaveBalanceProjections,
  buildLeaveDerivedAbsences,
  filterContracts,
  filterEmployees,
  filterAbsences,
  filterAttendanceRecords,
  filterLeaveRequests
} from "./hr.utils";
import type {
  CreateHrAbsenceInput,
  CreateHrAttendanceRecordInput,
  CreateHrDepartmentInput,
  CreateHrDocumentTemplateInput,
  CreateHrDocumentTypeInput,
  CreateHrEmployeeInput,
  CreateHrEmployeeDocumentInput,
  CreateHrEmploymentContractInput,
  CreateHrLeaveBalanceInput,
  CreateHrLeaveRequestInput,
  CreateHrLeaveTypeInput,
  CreateHrPositionInput,
  GenerateHrEmployeeDocumentInput,
  HrAbsence,
  HrAbsenceFilters,
  HrAbsenceId,
  HrAttendanceFilters,
  HrAttendanceRecord,
  HrAttendanceRecordId,
  HrDepartment,
  HrDepartmentId,
  HrDocumentTemplate,
  HrDocumentTemplateId,
  HrDocumentType,
  HrDocumentTypeId,
  HrEmployee,
  HrEmployeeDocument,
  HrEmployeeDocumentId,
  HrEmployeeFilters,
  HrEmployeeId,
  HrEmploymentContract,
  HrEmploymentContractId,
  HrLeaveBalance,
  HrLeaveBalanceId,
  HrLeaveRequest,
  HrLeaveRequestId,
  HrLeaveType,
  HrLeaveTypeId,
  HrPosition,
  HrPositionId,
  HrSnapshot,
  UploadHrEmployeeDocumentInput,
  UpdateHrAbsenceInput,
  UpdateHrAttendanceRecordInput,
  UpdateHrDepartmentInput,
  UpdateHrDocumentTemplateInput,
  UpdateHrDocumentTypeInput,
  UpdateHrEmployeeInput,
  UpdateHrEmployeeDocumentInput,
  UpdateHrEmploymentContractInput,
  UpdateHrLeaveBalanceInput,
  UpdateHrLeaveRequestInput,
  UpdateHrLeaveTypeInput,
  UpdateHrPositionInput
} from "./hr.types";

export class HrService {
  private readonly employees = new Map<HrEmployeeId, HrEmployee>();
  private readonly departments = new Map<HrDepartmentId, HrDepartment>();
  private readonly positions = new Map<HrPositionId, HrPosition>();
  private readonly contracts = new Map<HrEmploymentContractId, HrEmploymentContract>();
  private readonly leaveTypes = new Map<HrLeaveTypeId, HrLeaveType>();
  private readonly leaveRequests = new Map<HrLeaveRequestId, HrLeaveRequest>();
  private readonly leaveBalances = new Map<HrLeaveBalanceId, HrLeaveBalance>();
  private readonly absences = new Map<HrAbsenceId, HrAbsence>();
  private readonly attendanceRecords = new Map<HrAttendanceRecordId, HrAttendanceRecord>();
  private readonly documentTypes = new Map<HrDocumentTypeId, HrDocumentType>();
  private readonly documentTemplates = new Map<HrDocumentTemplateId, HrDocumentTemplate>();
  private readonly employeeDocuments = new Map<HrEmployeeDocumentId, HrEmployeeDocument>();

  constructor(private readonly options: { now?: () => string } = {}) {}

  replaceSnapshot(snapshot: HrSnapshot) {
    this.replaceDepartments(snapshot.departments);
    this.replacePositions(snapshot.positions);
    this.replaceEmployees(snapshot.employees);
    this.replaceContracts(snapshot.contracts);
    this.replaceLeaveTypes(snapshot.leaveTypes);
    this.replaceLeaveRequests(snapshot.leaveRequests);
    this.replaceLeaveBalances(snapshot.leaveBalances ?? []);
    this.replaceAbsences(snapshot.absences ?? []);
    this.replaceAttendanceRecords(snapshot.attendanceRecords ?? []);
    this.replaceDocumentTypes(snapshot.documentTypes ?? []);
    this.replaceDocumentTemplates(snapshot.documentTemplates ?? []);
    this.replaceEmployeeDocuments(snapshot.employeeDocuments ?? []);
  }

  getSnapshot(): HrSnapshot {
    return Object.freeze({
      employees: Object.freeze([...this.employees.values()]),
      departments: Object.freeze([...this.departments.values()]),
      positions: Object.freeze([...this.positions.values()]),
      contracts: Object.freeze([...this.contracts.values()]),
      leaveTypes: Object.freeze([...this.leaveTypes.values()]),
      leaveRequests: Object.freeze([...this.leaveRequests.values()]),
      leaveBalances: Object.freeze([...this.leaveBalances.values()]),
      absences: Object.freeze([...this.absences.values()]),
      attendanceRecords: Object.freeze([...this.attendanceRecords.values()]),
      documentTypes: Object.freeze([...this.documentTypes.values()]),
      documentTemplates: Object.freeze([...this.documentTemplates.values()]),
      employeeDocuments: Object.freeze([...this.employeeDocuments.values()])
    });
  }

  replaceEmployees(employees: readonly HrEmployee[]) {
    this.employees.clear();
    employees.forEach((employee) => this.employees.set(employee.id, freezeEmployee(employee)));
  }

  replaceDepartments(departments: readonly HrDepartment[]) {
    this.departments.clear();
    departments.forEach((department) => this.departments.set(department.id, freezeDepartment(department)));
  }

  replacePositions(positions: readonly HrPosition[]) {
    this.positions.clear();
    positions.forEach((position) => this.positions.set(position.id, freezePosition(position)));
  }

  replaceContracts(contracts: readonly HrEmploymentContract[]) {
    this.contracts.clear();
    contracts.forEach((contract) => this.contracts.set(contract.id, freezeContract(contract)));
  }

  replaceLeaveTypes(leaveTypes: readonly HrLeaveType[]) {
    this.leaveTypes.clear();
    leaveTypes.forEach((leaveType) => this.leaveTypes.set(leaveType.id, freezeLeaveType(leaveType)));
  }

  replaceLeaveRequests(requests: readonly HrLeaveRequest[]) {
    this.leaveRequests.clear();
    requests.forEach((request) => this.leaveRequests.set(request.id, freezeLeaveRequest(request)));
  }

  replaceLeaveBalances(balances: readonly HrLeaveBalance[]) {
    this.leaveBalances.clear();
    balances.forEach((balance) => this.leaveBalances.set(balance.id, freezeLeaveBalance(balance)));
  }

  replaceAbsences(absences: readonly HrAbsence[]) {
    this.absences.clear();
    absences.forEach((absence) => this.absences.set(absence.id, freezeAbsence(absence)));
  }

  replaceAttendanceRecords(records: readonly HrAttendanceRecord[]) {
    this.attendanceRecords.clear();
    records.forEach((record) => this.attendanceRecords.set(record.id, freezeAttendanceRecord(record)));
  }

  replaceDocumentTypes(types: readonly HrDocumentType[]) {
    this.documentTypes.clear();
    types.forEach((type) => this.documentTypes.set(type.id, freezeDocumentType(type)));
  }

  replaceDocumentTemplates(templates: readonly HrDocumentTemplate[]) {
    this.documentTemplates.clear();
    templates.forEach((template) => this.documentTemplates.set(template.id, freezeDocumentTemplate(template)));
  }

  replaceEmployeeDocuments(documents: readonly HrEmployeeDocument[]) {
    this.employeeDocuments.clear();
    documents.forEach((document) => this.employeeDocuments.set(document.id, freezeEmployeeDocument(document)));
  }

  listEmployees(filters: HrEmployeeFilters = {}) {
    const employees = filterEmployees([...this.employees.values()], filters);
    return Object.freeze({ employees: Object.freeze(employees), total: employees.length });
  }

  listDepartments() {
    const departments = [...this.departments.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return Object.freeze({ departments: Object.freeze(departments), total: departments.length });
  }

  listPositions() {
    const positions = [...this.positions.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return Object.freeze({ positions: Object.freeze(positions), total: positions.length });
  }

  listContracts(filters = {}) {
    const contracts = filterContracts([...this.contracts.values()], filters);
    return Object.freeze({ contracts: Object.freeze(contracts), total: contracts.length });
  }

  listLeaveTypes() {
    const leaveTypes = [...this.leaveTypes.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return Object.freeze({ leaveTypes: Object.freeze(leaveTypes), total: leaveTypes.length });
  }

  listLeaveRequests(filters = {}) {
    const leaveRequests = filterLeaveRequests([...this.leaveRequests.values()], filters);
    return Object.freeze({ leaveRequests: Object.freeze(leaveRequests), total: leaveRequests.length });
  }

  listLeaveBalances() {
    const balances = [...this.leaveBalances.values()].sort((a, b) => b.periodYear - a.periodYear || a.employeeId.localeCompare(b.employeeId));
    return Object.freeze({ leaveBalances: Object.freeze(balances), total: balances.length });
  }

  listLeaveBalanceProjections() {
    const projections = buildLeaveBalanceProjections([...this.leaveBalances.values()], [...this.leaveRequests.values()]);
    return Object.freeze({ leaveBalances: projections, total: projections.length });
  }

  listAbsences(filters: HrAbsenceFilters = {}) {
    const manual = filterAbsences([...this.absences.values()], [...this.employees.values()], filters);
    return Object.freeze({ absences: Object.freeze(manual), total: manual.length });
  }

  listOperationalAbsences(filters: HrAbsenceFilters = {}) {
    const derived = buildLeaveDerivedAbsences([...this.leaveRequests.values()], [...this.leaveTypes.values()]);
    const absences = filterAbsences([...this.absences.values(), ...derived], [...this.employees.values()], filters);
    return Object.freeze({ absences: Object.freeze(absences), total: absences.length });
  }

  listAttendanceRecords(filters: HrAttendanceFilters = {}) {
    const records = filterAttendanceRecords([...this.attendanceRecords.values()], [...this.employees.values()], filters);
    return Object.freeze({ attendanceRecords: Object.freeze(records), total: records.length });
  }

  listDocumentTypes() {
    const types = [...this.documentTypes.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return Object.freeze({ documentTypes: Object.freeze(types), total: types.length });
  }

  listDocumentTemplates() {
    const templates = [...this.documentTemplates.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return Object.freeze({ documentTemplates: Object.freeze(templates), total: templates.length });
  }

  listEmployeeDocuments(filters: { employeeId?: HrEmployeeId | "all"; status?: HrEmployeeDocument["status"] | "all"; required?: boolean } = {}) {
    const documents = [...this.employeeDocuments.values()]
      .filter((document) => !document.archivedAt)
      .filter((document) => !filters.employeeId || filters.employeeId === "all" || document.employeeId === filters.employeeId)
      .filter((document) => !filters.status || filters.status === "all" || document.status === filters.status)
      .filter((document) => filters.required === undefined || document.required === filters.required)
      .sort((a, b) => Number(b.required) - Number(a.required) || a.title.localeCompare(b.title, "fr"));
    return Object.freeze({ employeeDocuments: Object.freeze(documents), total: documents.length });
  }

  listCalendarItems(fromDate: string, toDate: string) {
    return buildHrCalendarItems({ leaveRequests: [...this.leaveRequests.values()], absences: [...this.absences.values()], leaveTypes: [...this.leaveTypes.values()], fromDate, toDate });
  }

  getEmployeeOperationalSummary(employeeId: HrEmployeeId, date = this.now()) {
    return Object.freeze({
      employeeId,
      workforceState: this.getWorkforceState(employeeId, date),
      leaveBalances: Object.freeze(this.listLeaveBalanceProjections().leaveBalances.filter((balance) => balance.employeeId === employeeId)),
      recentLeaveRequests: Object.freeze(this.listLeaveRequests({ employeeId }).leaveRequests.slice(0, 5)),
      recentAttendanceRecords: Object.freeze(this.listAttendanceRecords({ employeeId }).attendanceRecords.slice(0, 5))
    });
  }

  getEmployeeDossierSummary(employeeId: HrEmployeeId, date = this.now()) {
    const employee = this.employees.get(employeeId);
    const documents = this.listEmployeeDocuments({ employeeId }).employeeDocuments;
    const requiredDocuments = documents.filter((document) => document.required);
    const completeDocuments = requiredDocuments.filter((document) => isDocumentComplete(document, date));
    const expiredDocuments = requiredDocuments.filter((document) => getDocumentExpiryState(document, date) === "expired");
    const missingDocuments = requiredDocuments.length - completeDocuments.length;
    const activeContract = [...this.contracts.values()].some((contract) => contract.employeeId === employeeId && contract.status === "active" && !contract.archivedAt);
    const profileComplete = Boolean(employee?.employeeNumber && employee.firstName && employee.lastName && employee.hireDate);
    const departmentAssigned = Boolean(employee?.departmentId);
    const positionAssigned = Boolean(employee?.positionId);
    const baseChecklist = [
      { id: "profile", label: "Fiche employé complète", complete: profileComplete },
      { id: "department", label: "Département affecté", complete: departmentAssigned },
      { id: "position", label: "Poste affecté", complete: positionAssigned },
      { id: "contract", label: "Contrat actif", complete: activeContract }
    ];
    const documentChecklist = requiredDocuments.map((document) => {
      const expiryState = getDocumentExpiryState(document, date);
      const complete = isDocumentComplete(document, date);
      return { id: document.id, label: document.title, complete, status: expiryState === "expired" ? "expired" as const : complete ? "complete" as const : "missing" as const };
    });
    const checklist = Object.freeze([...baseChecklist.map((item) => ({ ...item, status: item.complete ? "complete" as const : "missing" as const })), ...documentChecklist]);
    const completed = checklist.filter((item) => item.complete).length;
    const completionPercent = checklist.length ? Math.round((completed / checklist.length) * 100) : 100;
    return Object.freeze({
      employeeId,
      profileComplete,
      departmentAssigned,
      positionAssigned,
      activeContract,
      requiredDocuments: requiredDocuments.length,
      completeDocuments: completeDocuments.length,
      missingDocuments,
      expiredDocuments: expiredDocuments.length,
      completionPercent,
      readinessStatus: expiredDocuments.length > 0 ? "blocked" as const : missingDocuments > 0 || completionPercent < 100 ? "incomplete" as const : "ready" as const,
      checklist
    });
  }

  getWorkforceState(employeeId: HrEmployeeId, date = this.now()) {
    const onLeave = [...this.leaveRequests.values()].some((request) => request.employeeId === employeeId && request.status === "approved" && dateInRange(date, request.startDate, request.endDate));
    if (onLeave) return "leave";
    const absent = [...this.absences.values()].some((absence) => absence.employeeId === employeeId && dateInRange(date, absence.startDate, absence.endDate));
    if (absent) return "absent";
    const attendance = this.attendanceRecords.get(this.findAttendanceId(employeeId, date) as HrAttendanceRecordId);
    if (attendance) return attendance.status;
    return "not_recorded";
  }

  getEmployee(id: HrEmployeeId) {
    return this.employees.get(id);
  }

  createDepartment(input: CreateHrDepartmentInput) {
    const now = this.now();
    const normalizedName = input.name.trim();
    if (!normalizedName) return Object.freeze({ department: undefined, error: "Le nom du département est requis." });
    const department = freezeDepartment({ ...input, id: createId("hr-department") as HrDepartmentId, name: normalizedName, active: input.active, createdAt: now, updatedAt: now });
    this.departments.set(department.id, department);
    return Object.freeze({ department });
  }

  updateDepartment(input: UpdateHrDepartmentInput) {
    const existing = this.departments.get(input.id);
    if (!existing) return Object.freeze({ department: undefined, error: "Département introuvable." });
    const updated = freezeDepartment({ ...existing, ...input, name: input.name?.trim() || existing.name, updatedAt: this.now() });
    this.departments.set(updated.id, updated);
    return Object.freeze({ department: updated });
  }

  createPosition(input: CreateHrPositionInput) {
    const now = this.now();
    const normalizedName = input.name.trim();
    if (!normalizedName) return Object.freeze({ position: undefined, error: "Le nom du poste est requis." });
    if (input.departmentId && !this.departments.has(input.departmentId)) return Object.freeze({ position: undefined, error: "Département introuvable pour ce poste." });
    const position = freezePosition({ ...input, id: createId("hr-position") as HrPositionId, name: normalizedName, active: input.active, createdAt: now, updatedAt: now });
    this.positions.set(position.id, position);
    return Object.freeze({ position });
  }

  updatePosition(input: UpdateHrPositionInput) {
    const existing = this.positions.get(input.id);
    if (!existing) return Object.freeze({ position: undefined, error: "Poste introuvable." });
    if (input.departmentId && !this.departments.has(input.departmentId)) return Object.freeze({ position: undefined, error: "Département introuvable pour ce poste." });
    const updated = freezePosition({ ...existing, ...input, name: input.name?.trim() || existing.name, updatedAt: this.now() });
    this.positions.set(updated.id, updated);
    return Object.freeze({ position: updated });
  }

  createEmployee(input: CreateHrEmployeeInput) {
    const now = this.now();
    const displayName = buildEmployeeDisplayName(input.firstName, input.lastName);
    const employeeNumber = input.employeeNumber.trim();
    if (!employeeNumber) return Object.freeze({ employee: undefined, error: "Le matricule est requis." });
    if (!displayName) return Object.freeze({ employee: undefined, error: "Le prénom et le nom sont requis." });
    if (this.hasEmployeeNumber(employeeNumber)) return Object.freeze({ employee: undefined, error: "Ce matricule existe déjà." });
    const relationError = this.validateEmployeeRelations(input);
    if (relationError) return Object.freeze({ employee: undefined, error: relationError });
    const employee = freezeEmployee({ ...input, id: createId("hr-employee") as HrEmployeeId, employeeNumber, displayName, status: input.status, createdAt: now, updatedAt: now });
    this.employees.set(employee.id, employee);
    return Object.freeze({ employee });
  }

  updateEmployee(input: UpdateHrEmployeeInput) {
    const existing = this.employees.get(input.id);
    if (!existing) return Object.freeze({ employee: undefined, error: "Employé introuvable." });
    const employeeNumber = input.employeeNumber?.trim() ?? existing.employeeNumber;
    if (employeeNumber !== existing.employeeNumber && this.hasEmployeeNumber(employeeNumber, existing.id)) return Object.freeze({ employee: undefined, error: "Ce matricule existe déjà." });
    const relationError = this.validateEmployeeRelations({ ...existing, ...input, employeeNumber });
    if (relationError) return Object.freeze({ employee: undefined, error: relationError });
    const displayName = buildEmployeeDisplayName(input.firstName ?? existing.firstName, input.lastName ?? existing.lastName);
    const archivedAt = input.status === "archived" && !existing.archivedAt ? this.now() : input.archivedAt ?? existing.archivedAt;
    const updated = freezeEmployee({ ...existing, ...input, employeeNumber, displayName, archivedAt, updatedAt: this.now() });
    this.employees.set(updated.id, updated);
    return Object.freeze({ employee: updated });
  }

  createContract(input: CreateHrEmploymentContractInput) {
    const now = this.now();
    if (!this.employees.has(input.employeeId)) return Object.freeze({ contract: undefined, error: "Employé introuvable pour ce contrat." });
    if (input.positionId && !this.positions.has(input.positionId)) return Object.freeze({ contract: undefined, error: "Poste introuvable pour ce contrat." });
    if (!input.jobTitle.trim()) return Object.freeze({ contract: undefined, error: "L'intitulé du poste est requis." });
    const contract = freezeContract({ ...input, id: createId("hr-contract") as HrEmploymentContractId, jobTitle: input.jobTitle.trim(), createdAt: now, updatedAt: now });
    this.contracts.set(contract.id, contract);
    return Object.freeze({ contract });
  }

  updateContract(input: UpdateHrEmploymentContractInput) {
    const existing = this.contracts.get(input.id);
    if (!existing) return Object.freeze({ contract: undefined, error: "Contrat introuvable." });
    const updated = freezeContract({ ...existing, ...input, jobTitle: input.jobTitle?.trim() || existing.jobTitle, updatedAt: this.now() });
    this.contracts.set(updated.id, updated);
    return Object.freeze({ contract: updated });
  }

  createLeaveType(input: CreateHrLeaveTypeInput) {
    const now = this.now();
    if (!input.name.trim()) return Object.freeze({ leaveType: undefined, error: "Le type de congé est requis." });
    const leaveType = freezeLeaveType({
      ...input,
      id: createId("hr-leave-type") as HrLeaveTypeId,
      code: input.code?.trim() || undefined,
      name: input.name.trim(),
      approvalRequired: input.approvalRequired ?? true,
      balanceTracked: input.balanceTracked ?? true,
      createdAt: now,
      updatedAt: now
    });
    this.leaveTypes.set(leaveType.id, leaveType);
    return Object.freeze({ leaveType });
  }

  updateLeaveType(input: UpdateHrLeaveTypeInput) {
    const existing = this.leaveTypes.get(input.id);
    if (!existing) return Object.freeze({ leaveType: undefined, error: "Type de congé introuvable." });
    const updated = freezeLeaveType({ ...existing, ...input, code: input.code?.trim() || existing.code, name: input.name?.trim() || existing.name, updatedAt: this.now() });
    this.leaveTypes.set(updated.id, updated);
    return Object.freeze({ leaveType: updated });
  }

  createLeaveBalance(input: CreateHrLeaveBalanceInput) {
    const now = this.now();
    const relationError = this.validateLeaveBalanceRelations(input);
    if (relationError) return Object.freeze({ leaveBalance: undefined, error: relationError });
    if (this.findLeaveBalance(input.employeeId, input.leaveTypeId, input.periodYear)) return Object.freeze({ leaveBalance: undefined, error: "Un droit existe déjà pour cet employé, ce type et cette période." });
    const leaveBalance = freezeLeaveBalance({ ...input, id: createId("hr-leave-balance") as HrLeaveBalanceId, entitledDays: normalizeDays(input.entitledDays), adjustmentDays: normalizeDays(input.adjustmentDays), adjustmentReason: input.adjustmentReason?.trim() || undefined, createdAt: now, updatedAt: now });
    this.leaveBalances.set(leaveBalance.id, leaveBalance);
    return Object.freeze({ leaveBalance });
  }

  updateLeaveBalance(input: UpdateHrLeaveBalanceInput) {
    const existing = this.leaveBalances.get(input.id);
    if (!existing) return Object.freeze({ leaveBalance: undefined, error: "Droit de congé introuvable." });
    const updated = freezeLeaveBalance({ ...existing, ...input, entitledDays: input.entitledDays ? normalizeDays(input.entitledDays) : existing.entitledDays, adjustmentDays: input.adjustmentDays ? normalizeDays(input.adjustmentDays) : existing.adjustmentDays, adjustmentReason: input.adjustmentReason?.trim() || existing.adjustmentReason, updatedAt: this.now() });
    this.leaveBalances.set(updated.id, updated);
    return Object.freeze({ leaveBalance: updated });
  }

  createLeaveRequest(input: CreateHrLeaveRequestInput) {
    const now = this.now();
    if (!this.employees.has(input.employeeId)) return Object.freeze({ leaveRequest: undefined, error: "Employé introuvable pour cette demande." });
    if (input.leaveTypeId && !this.leaveTypes.has(input.leaveTypeId)) return Object.freeze({ leaveRequest: undefined, error: "Type de congé introuvable." });
    if (new Date(input.endDate).getTime() < new Date(input.startDate).getTime()) return Object.freeze({ leaveRequest: undefined, error: "La date de fin doit être postérieure à la date de début." });
    const leaveRequest = freezeLeaveRequest({ ...input, id: createId("hr-leave") as HrLeaveRequestId, title: input.title.trim() || "Demande de congé", requestedAt: input.requestedAt || now, createdAt: now, updatedAt: now });
    this.leaveRequests.set(leaveRequest.id, leaveRequest);
    return Object.freeze({ leaveRequest });
  }

  updateLeaveRequest(input: UpdateHrLeaveRequestInput) {
    const existing = this.leaveRequests.get(input.id);
    if (!existing) return Object.freeze({ leaveRequest: undefined, error: "Demande de congé introuvable." });
    const nextStatus = input.status ?? existing.status;
    const transitionError = this.validateLeaveTransition(existing.status, nextStatus);
    if (transitionError) return Object.freeze({ leaveRequest: undefined, error: transitionError });
    const relationError = input.decisionByEmployeeId ? this.validateDecisionActor(existing.employeeId, input.decisionByEmployeeId) : undefined;
    if (relationError) return Object.freeze({ leaveRequest: undefined, error: relationError });
    const overBalanceError = nextStatus === "approved" ? this.validateLeaveBalanceAvailability(existing, input.id) : undefined;
    if (overBalanceError) return Object.freeze({ leaveRequest: undefined, error: overBalanceError });
    const now = this.now();
    const approvedAt = nextStatus === "approved" && !existing.approvedAt ? now : nextStatus === "approved" ? input.approvedAt ?? existing.approvedAt : undefined;
    const decidedAt = ["approved", "rejected", "cancelled"].includes(nextStatus) && !existing.decidedAt ? now : input.decidedAt ?? existing.decidedAt;
    const updated = freezeLeaveRequest({ ...existing, ...input, status: nextStatus, approvedAt, decidedAt, decisionNote: input.decisionNote?.trim() || existing.decisionNote, updatedAt: now });
    this.leaveRequests.set(updated.id, updated);
    return Object.freeze({ leaveRequest: updated });
  }

  approveLeaveRequest(id: HrLeaveRequestId, actorEmployeeId?: HrEmployeeId, note?: string) {
    return this.updateLeaveRequest({ id, status: "approved", approvedByEmployeeId: actorEmployeeId, decisionByEmployeeId: actorEmployeeId, decisionNote: note });
  }

  rejectLeaveRequest(id: HrLeaveRequestId, actorEmployeeId?: HrEmployeeId, note?: string) {
    return this.updateLeaveRequest({ id, status: "rejected", decisionByEmployeeId: actorEmployeeId, decisionNote: note });
  }

  cancelLeaveRequest(id: HrLeaveRequestId, actorEmployeeId?: HrEmployeeId, note?: string) {
    return this.updateLeaveRequest({ id, status: "cancelled", decisionByEmployeeId: actorEmployeeId, decisionNote: note });
  }

  createAbsence(input: CreateHrAbsenceInput) {
    const now = this.now();
    if (!this.employees.has(input.employeeId)) return Object.freeze({ absence: undefined, error: "Employé introuvable pour cette absence." });
    if (new Date(input.endDate).getTime() < new Date(input.startDate).getTime()) return Object.freeze({ absence: undefined, error: "La date de fin doit être postérieure à la date de début." });
    if (input.linkedLeaveRequestId && !this.leaveRequests.has(input.linkedLeaveRequestId)) return Object.freeze({ absence: undefined, error: "Demande de congé liée introuvable." });
    const attendanceConflict = this.validateAbsenceAttendanceConsistency(input.employeeId, input.startDate, input.endDate);
    if (attendanceConflict) return Object.freeze({ absence: undefined, error: attendanceConflict });
    const absence = freezeAbsence({ ...input, id: createId("hr-absence") as HrAbsenceId, type: input.type.trim() || "Absence", notes: input.notes?.trim() || undefined, createdAt: now, updatedAt: now });
    this.absences.set(absence.id, absence);
    return Object.freeze({ absence });
  }

  updateAbsence(input: UpdateHrAbsenceInput) {
    const existing = this.absences.get(input.id);
    if (!existing) return Object.freeze({ absence: undefined, error: "Absence introuvable." });
    const candidate = { ...existing, ...input };
    const attendanceConflict = this.validateAbsenceAttendanceConsistency(candidate.employeeId, candidate.startDate, candidate.endDate);
    if (attendanceConflict) return Object.freeze({ absence: undefined, error: attendanceConflict });
    const updated = freezeAbsence({ ...existing, ...input, type: input.type?.trim() || existing.type, notes: input.notes?.trim() || existing.notes, updatedAt: this.now() });
    this.absences.set(updated.id, updated);
    return Object.freeze({ absence: updated });
  }

  createAttendanceRecord(input: CreateHrAttendanceRecordInput) {
    const now = this.now();
    if (!this.employees.has(input.employeeId)) return Object.freeze({ attendanceRecord: undefined, error: "Employé introuvable pour cette présence." });
    if (input.recordedByEmployeeId && !this.employees.has(input.recordedByEmployeeId)) return Object.freeze({ attendanceRecord: undefined, error: "Déclarant RH introuvable." });
    const existingId = this.findAttendanceId(input.employeeId, input.date);
    if (existingId) return Object.freeze({ attendanceRecord: undefined, error: "Une présence existe déjà pour cet employé et cette date." });
    const consistencyError = this.validateAttendanceConsistency(input.employeeId, input.date, input.status);
    if (consistencyError) return Object.freeze({ attendanceRecord: undefined, error: consistencyError });
    const attendanceRecord = freezeAttendanceRecord({ ...input, id: createId("hr-attendance") as HrAttendanceRecordId, date: normalizeDateOnly(input.date), note: input.note?.trim() || undefined, createdAt: now, updatedAt: now });
    this.attendanceRecords.set(attendanceRecord.id, attendanceRecord);
    return Object.freeze({ attendanceRecord });
  }

  updateAttendanceRecord(input: UpdateHrAttendanceRecordInput) {
    const existing = this.attendanceRecords.get(input.id);
    if (!existing) return Object.freeze({ attendanceRecord: undefined, error: "Présence introuvable." });
    const status = input.status ?? existing.status;
    const consistencyError = this.validateAttendanceConsistency(existing.employeeId, existing.date, status);
    if (consistencyError) return Object.freeze({ attendanceRecord: undefined, error: consistencyError });
    const updated = freezeAttendanceRecord({ ...existing, ...input, status, note: input.note?.trim() || existing.note, updatedAt: this.now() });
    this.attendanceRecords.set(updated.id, updated);
    return Object.freeze({ attendanceRecord: updated });
  }

  createDocumentType(input: CreateHrDocumentTypeInput) {
    const now = this.now();
    if (!input.name.trim()) return Object.freeze({ documentType: undefined, error: "Le type de document est requis." });
    const documentType = freezeDocumentType({ ...input, id: createId("hr-doc-type") as HrDocumentTypeId, code: input.code?.trim() || undefined, name: input.name.trim(), category: input.category.trim() || "Autre", active: input.active ?? true, requiredByDefault: input.requiredByDefault ?? false, description: input.description?.trim() || undefined, createdAt: now, updatedAt: now });
    this.documentTypes.set(documentType.id, documentType);
    return Object.freeze({ documentType });
  }

  updateDocumentType(input: UpdateHrDocumentTypeInput) {
    const existing = this.documentTypes.get(input.id);
    if (!existing) return Object.freeze({ documentType: undefined, error: "Type de document introuvable." });
    const updated = freezeDocumentType({ ...existing, ...input, code: input.code?.trim() || existing.code, name: input.name?.trim() || existing.name, category: input.category?.trim() || existing.category, description: input.description?.trim() || existing.description, updatedAt: this.now() });
    this.documentTypes.set(updated.id, updated);
    return Object.freeze({ documentType: updated });
  }

  createDocumentTemplate(input: CreateHrDocumentTemplateInput) {
    const now = this.now();
    const validation = this.validateTemplateInput(input);
    if (validation) return Object.freeze({ documentTemplate: undefined, error: validation });
    const template = freezeDocumentTemplate({ ...input, id: createId("hr-doc-template") as HrDocumentTemplateId, code: input.code?.trim() || undefined, name: input.name.trim(), templateFormat: "plain_text", description: input.description?.trim() || undefined, createdAt: now, updatedAt: now });
    this.documentTemplates.set(template.id, template);
    return Object.freeze({ documentTemplate: template });
  }

  updateDocumentTemplate(input: UpdateHrDocumentTemplateInput) {
    const existing = this.documentTemplates.get(input.id);
    if (!existing) return Object.freeze({ documentTemplate: undefined, error: "Modèle RH introuvable." });
    const candidate = { ...existing, ...input };
    const validation = this.validateTemplateInput(candidate);
    if (validation) return Object.freeze({ documentTemplate: undefined, error: validation });
    const updated = freezeDocumentTemplate({ ...candidate, code: candidate.code?.trim() || undefined, name: candidate.name.trim(), description: candidate.description?.trim() || undefined, updatedAt: this.now() });
    this.documentTemplates.set(updated.id, updated);
    return Object.freeze({ documentTemplate: updated });
  }

  createEmployeeDocument(input: CreateHrEmployeeDocumentInput) {
    const now = this.now();
    const relationError = this.validateDocumentRelations(input);
    if (relationError) return Object.freeze({ employeeDocument: undefined, error: relationError });
    const status = normalizeDocumentStatus(input);
    const document = freezeEmployeeDocument({ ...input, id: createId("hr-doc") as HrEmployeeDocumentId, title: input.title.trim() || "Document RH", category: input.category.trim() || this.resolveDocumentType(input.documentTypeId)?.category || "Autre", status, source: input.source ?? "manual", notes: input.notes?.trim() || undefined, createdAt: now, updatedAt: now });
    this.employeeDocuments.set(document.id, document);
    return Object.freeze({ employeeDocument: document });
  }

  updateEmployeeDocument(input: UpdateHrEmployeeDocumentInput) {
    const existing = this.employeeDocuments.get(input.id);
    if (!existing) return Object.freeze({ employeeDocument: undefined, error: "Document employé introuvable." });
    const candidate = { ...existing, ...input };
    const relationError = this.validateDocumentRelations(candidate);
    if (relationError) return Object.freeze({ employeeDocument: undefined, error: relationError });
    const updated = freezeEmployeeDocument({ ...candidate, title: candidate.title.trim() || existing.title, category: candidate.category.trim() || existing.category, status: normalizeDocumentStatus(candidate), notes: candidate.notes?.trim() || undefined, updatedAt: this.now() });
    this.employeeDocuments.set(updated.id, updated);
    return Object.freeze({ employeeDocument: updated });
  }

  generateEmployeeDocument(input: GenerateHrEmployeeDocumentInput) {
    const template = this.documentTemplates.get(input.templateId);
    if (!template || !template.active) return Object.freeze({ employeeDocument: undefined, error: "Modèle RH introuvable ou inactif." });
    const employee = this.employees.get(input.employeeId);
    if (!employee) return Object.freeze({ employeeDocument: undefined, error: "Employé introuvable pour ce document." });
    if (input.contractId && !this.contracts.has(input.contractId)) return Object.freeze({ employeeDocument: undefined, error: "Contrat introuvable pour ce document." });
    const rendered = this.renderTemplate(template, input.employeeId, input.contractId, input.company);
    if (rendered.error) return Object.freeze({ employeeDocument: undefined, error: rendered.error });
    const documentType = this.resolveDocumentType(template.documentTypeId);
    const now = this.now();
    const document = freezeEmployeeDocument({
      id: createId("hr-doc") as HrEmployeeDocumentId,
      tenantCompanyId: template.tenantCompanyId,
      employeeId: employee.id,
      documentTypeId: template.documentTypeId,
      templateId: template.id,
      contractId: input.contractId,
      title: input.title?.trim() || template.name,
      category: documentType?.category ?? "Contrat de travail",
      status: "generated",
      source: "generated",
      generatedContent: rendered.content,
      generatedFromTemplateName: template.name,
      issuedDate: input.issuedDate ?? now,
      expiryDate: input.expiryDate,
      required: input.required ?? documentType?.requiredByDefault ?? false,
      notes: input.notes?.trim() || undefined,
      generatedAt: now,
      createdAt: now,
      updatedAt: now
    });
    this.employeeDocuments.set(document.id, document);
    return Object.freeze({ employeeDocument: document });
  }

  uploadEmployeeDocument(input: UploadHrEmployeeDocumentInput) {
    const existing = this.employeeDocuments.get(input.id);
    if (!existing) return Object.freeze({ employeeDocument: undefined, error: "Document employé introuvable." });
    const fileError = validateUploadMetadata(input);
    if (fileError) return Object.freeze({ employeeDocument: undefined, error: fileError });
    const now = this.now();
    const safeFilename = sanitizeFilename(input.filename);
    const updated = freezeEmployeeDocument({
      ...existing,
      storageReference: input.storageReference?.trim() || `hr/${existing.employeeId}/${existing.id}/${safeFilename}`,
      storageFilename: safeFilename,
      storageMimeType: input.mimeType,
      storageSizeBytes: input.sizeBytes,
      source: input.signedFinal ? "uploaded" : existing.source,
      status: input.signedFinal ? "signed" : "uploaded",
      receivedDate: input.receivedDate ?? now,
      uploadedAt: now,
      finalizedAt: input.signedFinal ? now : existing.finalizedAt,
      notes: input.notes?.trim() || existing.notes,
      updatedAt: now
    });
    this.employeeDocuments.set(updated.id, updated);
    return Object.freeze({ employeeDocument: updated });
  }

  private validateTemplateInput(input: Pick<HrDocumentTemplate, "name" | "body" | "templateFormat" | "documentTypeId">) {
    if (!input.name.trim()) return "Le nom du modèle RH est requis.";
    if (input.templateFormat !== "plain_text") return "Format de modèle RH non supporté.";
    if (!input.body.trim()) return "Le contenu du modèle RH est requis.";
    if (input.documentTypeId && !this.documentTypes.has(input.documentTypeId)) return "Type de document introuvable pour ce modèle.";
    const unknown = findUnknownTemplateVariables(input.body);
    if (unknown.length) return `Variable inconnue dans le modèle RH: ${unknown.join(", ")}.`;
    return undefined;
  }

  private validateDocumentRelations(input: Pick<HrEmployeeDocument, "employeeId" | "documentTypeId" | "templateId" | "contractId">) {
    if (!this.employees.has(input.employeeId)) return "Employé introuvable pour ce document.";
    if (input.documentTypeId && !this.documentTypes.has(input.documentTypeId)) return "Type de document introuvable.";
    if (input.templateId && !this.documentTemplates.has(input.templateId)) return "Modèle RH introuvable.";
    if (input.contractId) {
      const contract = this.contracts.get(input.contractId);
      if (!contract || contract.employeeId !== input.employeeId) return "Contrat introuvable pour cet employé.";
    }
    return undefined;
  }

  private resolveDocumentType(id?: HrDocumentTypeId) {
    return id ? this.documentTypes.get(id) : undefined;
  }

  private renderTemplate(template: HrDocumentTemplate, employeeId: HrEmployeeId, contractId?: HrEmploymentContractId, company?: GenerateHrEmployeeDocumentInput["company"]) {
    const unknown = findUnknownTemplateVariables(template.body);
    if (unknown.length) return { content: undefined, error: `Variable inconnue dans le modèle RH: ${unknown.join(", ")}.` };
    const employee = this.employees.get(employeeId);
    if (!employee) return { content: undefined, error: "Employé introuvable pour ce modèle." };
    const department = employee.departmentId ? this.departments.get(employee.departmentId) : undefined;
    const position = employee.positionId ? this.positions.get(employee.positionId) : undefined;
    const manager = employee.managerEmployeeId ? this.employees.get(employee.managerEmployeeId) : undefined;
    const contract = contractId ? this.contracts.get(contractId) : [...this.contracts.values()].find((item) => item.employeeId === employeeId && item.status === "active" && !item.archivedAt);
    const values: Record<string, string> = {
      "employee.firstName": employee.firstName,
      "employee.lastName": employee.lastName,
      "employee.displayName": employee.displayName,
      "employee.employeeNumber": employee.employeeNumber,
      "employee.email": employee.email ?? "",
      "employee.phone": employee.phone ?? "",
      "employee.hireDate": formatDateOnly(employee.hireDate),
      "department.name": department?.name ?? "",
      "position.name": position?.name ?? "",
      "manager.displayName": manager?.displayName ?? "",
      "contract.type": contract ? HR_CONTRACT_TYPE_LABELS[contract.contractType] : "",
      "contract.startDate": contract ? formatDateOnly(contract.startDate) : "",
      "contract.endDate": contract?.endDate ? formatDateOnly(contract.endDate) : "",
      "contract.title": contract?.jobTitle ?? "",
      "contract.workingTimeType": contract?.workingTimeType ? HR_WORKING_TIME_TYPE_LABELS[contract.workingTimeType] : "",
      "company.name": company?.name ?? "",
      "company.address": company?.address ?? "",
      "company.email": company?.email ?? "",
      "company.phone": company?.phone ?? ""
    };
    return { content: template.body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => values[key] ?? ""), error: undefined };
  }

  private validateEmployeeRelations(input: Pick<HrEmployee, "id" | "departmentId" | "positionId" | "managerEmployeeId"> | CreateHrEmployeeInput) {
    if (input.departmentId && !this.departments.has(input.departmentId)) return "Département introuvable.";
    if (input.positionId && !this.positions.has(input.positionId)) return "Poste introuvable.";
    if (input.managerEmployeeId) {
      const currentId = "id" in input ? input.id : undefined;
      if (currentId && input.managerEmployeeId === currentId) return "Un employé ne peut pas être son propre manager.";
      if (!this.employees.has(input.managerEmployeeId)) return "Manager introuvable.";
    }
    return undefined;
  }

  private hasEmployeeNumber(employeeNumber: string, exceptId?: HrEmployeeId) {
    return [...this.employees.values()].some((employee) => employee.id !== exceptId && employee.employeeNumber === employeeNumber);
  }

  private validateLeaveBalanceRelations(input: Pick<HrLeaveBalance, "employeeId" | "leaveTypeId" | "periodYear">) {
    if (!this.employees.has(input.employeeId)) return "Employé introuvable pour ce droit.";
    if (!this.leaveTypes.has(input.leaveTypeId)) return "Type de congé introuvable pour ce droit.";
    if (!Number.isInteger(input.periodYear) || input.periodYear < 2000) return "Période de droit invalide.";
    return undefined;
  }

  private validateLeaveTransition(from: HrLeaveRequest["status"], to: HrLeaveRequest["status"]) {
    if (from === to) return undefined;
    const allowed = new Map<HrLeaveRequest["status"], readonly HrLeaveRequest["status"][]>([
      ["draft", ["requested", "cancelled", "archived"]],
      ["requested", ["approved", "rejected", "cancelled", "archived"]],
      ["approved", ["cancelled", "archived"]],
      ["rejected", ["archived"]],
      ["cancelled", ["archived"]],
      ["archived", []]
    ]);
    return allowed.get(from)?.includes(to) ? undefined : "Transition de congé invalide.";
  }

  private validateDecisionActor(employeeId: HrEmployeeId, actorId: HrEmployeeId) {
    const actor = this.employees.get(actorId);
    if (!actor) return "Décideur RH introuvable.";
    const employee = this.employees.get(employeeId);
    if (!employee) return "Employé introuvable.";
    if (employee.managerEmployeeId && employee.managerEmployeeId !== actorId) return undefined;
    return undefined;
  }

  private validateLeaveBalanceAvailability(request: HrLeaveRequest, requestId: HrLeaveRequestId) {
    if (!request.leaveTypeId) return undefined;
    const type = this.leaveTypes.get(request.leaveTypeId);
    if (!type?.balanceTracked) return undefined;
    const balance = this.findLeaveBalance(request.employeeId, request.leaveTypeId, new Date(request.startDate).getFullYear());
    if (!balance) return "Aucun droit de congé configuré pour cette période.";
    const projected = buildLeaveBalanceProjections([balance], [...this.leaveRequests.values()].filter((item) => item.id !== requestId))[0];
    const remainingAfter = Number(projected.remainingDays) - inclusiveDays(request.startDate, request.endDate);
    if (remainingAfter < 0) return "Solde de congé insuffisant.";
    return undefined;
  }

  private validateAttendanceConsistency(employeeId: HrEmployeeId, date: string, status: HrAttendanceRecord["status"]) {
    const onApprovedLeave = [...this.leaveRequests.values()].some((request) => request.employeeId === employeeId && request.status === "approved" && dateInRange(date, request.startDate, request.endDate));
    if (onApprovedLeave && status === "present") return "Un congé approuvé existe pour cette date. Utilisez le statut En congé ou résolvez le congé.";
    const manualAbsence = [...this.absences.values()].find((absence) => absence.employeeId === employeeId && absence.source === "manual" && dateInRange(date, absence.startDate, absence.endDate));
    if (manualAbsence && status !== "absent") return "Une absence manuelle existe pour cette date. Seul le statut Absent est compatible.";
    return undefined;
  }

  private validateAbsenceAttendanceConsistency(employeeId: HrEmployeeId, startDate: string, endDate: string) {
    const conflicting = [...this.attendanceRecords.values()].find((record) => record.employeeId === employeeId && dateInRange(record.date, startDate, endDate) && record.status !== "absent");
    if (conflicting) return "Une présence contradictoire existe sur la période. Résolvez la présence avant d'enregistrer l'absence.";
    return undefined;
  }

  private findLeaveBalance(employeeId: HrEmployeeId, leaveTypeId: HrLeaveTypeId, periodYear: number) {
    return [...this.leaveBalances.values()].find((balance) => balance.employeeId === employeeId && balance.leaveTypeId === leaveTypeId && balance.periodYear === periodYear);
  }

  private findAttendanceId(employeeId: HrEmployeeId, date: string) {
    return [...this.attendanceRecords.values()].find((record) => record.employeeId === employeeId && normalizeDateOnly(record.date) === normalizeDateOnly(date))?.id;
  }

  private now() {
    return this.options.now?.() ?? new Date().toISOString();
  }
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function freezeEmployee(employee: HrEmployee): HrEmployee {
  return Object.freeze({ ...employee });
}

export function freezeDepartment(department: HrDepartment): HrDepartment {
  return Object.freeze({ ...department });
}

export function freezePosition(position: HrPosition): HrPosition {
  return Object.freeze({ ...position });
}

export function freezeContract(contract: HrEmploymentContract): HrEmploymentContract {
  return Object.freeze({ ...contract });
}

export function freezeLeaveType(leaveType: HrLeaveType): HrLeaveType {
  return Object.freeze({ ...leaveType });
}

export function freezeLeaveRequest(request: HrLeaveRequest): HrLeaveRequest {
  return Object.freeze({ ...request });
}

export function freezeLeaveBalance(balance: HrLeaveBalance): HrLeaveBalance {
  return Object.freeze({ ...balance });
}

export function freezeAbsence(absence: HrAbsence): HrAbsence {
  return Object.freeze({ ...absence });
}

export function freezeAttendanceRecord(record: HrAttendanceRecord): HrAttendanceRecord {
  return Object.freeze({ ...record });
}

export function freezeDocumentType(type: HrDocumentType): HrDocumentType {
  return Object.freeze({ ...type });
}

export function freezeDocumentTemplate(template: HrDocumentTemplate): HrDocumentTemplate {
  return Object.freeze({ ...template });
}

export function freezeEmployeeDocument(document: HrEmployeeDocument): HrEmployeeDocument {
  return Object.freeze({ ...document });
}

function normalizeDays(value: string) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "0.00";
}

function inclusiveDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function dateInRange(date: string, startDate: string, endDate: string) {
  const time = new Date(normalizeDateOnly(date)).getTime();
  return time >= new Date(normalizeDateOnly(startDate)).getTime() && time <= new Date(normalizeDateOnly(endDate)).getTime();
}

function normalizeDateOnly(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function findUnknownTemplateVariables(body: string) {
  const allowed = new Set<string>(HR_TEMPLATE_VARIABLES);
  return [...body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((match) => match[1]).filter((key, index, keys) => !allowed.has(key) && keys.indexOf(key) === index);
}

function normalizeDocumentStatus(document: Pick<HrEmployeeDocument, "status" | "expiryDate">) {
  if (document.status === "archived") return "archived";
  if (document.expiryDate && getDocumentExpiryState(document, new Date().toISOString()) === "expired") return "expired";
  return document.status;
}

function isDocumentComplete(document: HrEmployeeDocument, date: string) {
  if (getDocumentExpiryState(document, date) === "expired") return false;
  return ["signed", "uploaded"].includes(document.status);
}

function getDocumentExpiryState(document: Pick<HrEmployeeDocument, "expiryDate">, date: string) {
  if (!document.expiryDate) return "not_applicable";
  const expiry = new Date(normalizeDateOnly(document.expiryDate)).getTime();
  const today = new Date(normalizeDateOnly(date)).getTime();
  if (expiry < today) return "expired";
  const soon = today + 30 * 86_400_000;
  return expiry <= soon ? "expiring_soon" : "valid";
}

function validateUploadMetadata(input: UploadHrEmployeeDocumentInput) {
  if (!input.filename.trim()) return "Nom de fichier requis.";
  if (!["application/pdf", "image/png", "image/jpeg"].includes(input.mimeType)) return "Format non supporté. Utilisez PDF, PNG ou JPG.";
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) return "Taille de fichier invalide.";
  if (input.sizeBytes > 10 * 1024 * 1024) return "Le fichier dépasse la limite Alpha de 10 Mo.";
  return undefined;
}

function sanitizeFilename(filename: string) {
  return filename.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120) || "document.pdf";
}

function formatDateOnly(value: string) {
  return normalizeDateOnly(value).split("-").reverse().join("/");
}
