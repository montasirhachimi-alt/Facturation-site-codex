import {
  buildEmployeeDisplayName,
  filterContracts,
  filterEmployees,
  filterLeaveRequests
} from "./hr.utils";
import type {
  CreateHrDepartmentInput,
  CreateHrEmployeeInput,
  CreateHrEmploymentContractInput,
  CreateHrLeaveRequestInput,
  CreateHrLeaveTypeInput,
  CreateHrPositionInput,
  HrDepartment,
  HrDepartmentId,
  HrEmployee,
  HrEmployeeFilters,
  HrEmployeeId,
  HrEmploymentContract,
  HrEmploymentContractId,
  HrLeaveRequest,
  HrLeaveRequestId,
  HrLeaveType,
  HrLeaveTypeId,
  HrPosition,
  HrPositionId,
  HrSnapshot,
  UpdateHrDepartmentInput,
  UpdateHrEmployeeInput,
  UpdateHrEmploymentContractInput,
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

  constructor(private readonly options: { now?: () => string } = {}) {}

  replaceSnapshot(snapshot: HrSnapshot) {
    this.replaceDepartments(snapshot.departments);
    this.replacePositions(snapshot.positions);
    this.replaceEmployees(snapshot.employees);
    this.replaceContracts(snapshot.contracts);
    this.replaceLeaveTypes(snapshot.leaveTypes);
    this.replaceLeaveRequests(snapshot.leaveRequests);
  }

  getSnapshot(): HrSnapshot {
    return Object.freeze({
      employees: Object.freeze([...this.employees.values()]),
      departments: Object.freeze([...this.departments.values()]),
      positions: Object.freeze([...this.positions.values()]),
      contracts: Object.freeze([...this.contracts.values()]),
      leaveTypes: Object.freeze([...this.leaveTypes.values()]),
      leaveRequests: Object.freeze([...this.leaveRequests.values()])
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
    const leaveType = freezeLeaveType({ ...input, id: createId("hr-leave-type") as HrLeaveTypeId, name: input.name.trim(), createdAt: now, updatedAt: now });
    this.leaveTypes.set(leaveType.id, leaveType);
    return Object.freeze({ leaveType });
  }

  updateLeaveType(input: UpdateHrLeaveTypeInput) {
    const existing = this.leaveTypes.get(input.id);
    if (!existing) return Object.freeze({ leaveType: undefined, error: "Type de congé introuvable." });
    const updated = freezeLeaveType({ ...existing, ...input, name: input.name?.trim() || existing.name, updatedAt: this.now() });
    this.leaveTypes.set(updated.id, updated);
    return Object.freeze({ leaveType: updated });
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
    const approvedAt = input.status === "approved" && !existing.approvedAt ? this.now() : input.approvedAt ?? existing.approvedAt;
    const updated = freezeLeaveRequest({ ...existing, ...input, approvedAt, updatedAt: this.now() });
    this.leaveRequests.set(updated.id, updated);
    return Object.freeze({ leaveRequest: updated });
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
