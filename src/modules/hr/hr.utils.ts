import type {
  HrContractStatus,
  HrDepartment,
  HrEmployee,
  HrEmployeeFilters,
  HrEmployeeStatus,
  HrEmploymentContract,
  HrLeaveRequest,
  HrLeaveRequestFilters,
  HrPosition
} from "./hr.types";

export function normalizeHrText(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function buildEmployeeDisplayName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
}

export function matchesEmployeeSearch(employee: HrEmployee, query = "") {
  const needle = normalizeHrText(query);
  if (!needle) return true;
  return normalizeHrText([
    employee.employeeNumber,
    employee.displayName,
    employee.firstName,
    employee.lastName,
    employee.email,
    employee.phone,
    employee.status
  ].filter(Boolean).join(" ")).includes(needle);
}

export function filterEmployees(employees: readonly HrEmployee[], filters: HrEmployeeFilters = {}) {
  return employees
    .filter((employee) => filters.includeArchived || !employee.archivedAt)
    .filter((employee) => !filters.status || filters.status === "all" || employee.status === filters.status)
    .filter((employee) => !filters.departmentId || filters.departmentId === "all" || employee.departmentId === filters.departmentId)
    .filter((employee) => !filters.positionId || filters.positionId === "all" || employee.positionId === filters.positionId)
    .filter((employee) => matchesEmployeeSearch(employee, filters.query))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "fr") || a.employeeNumber.localeCompare(b.employeeNumber, "fr"));
}

export function filterContracts(contracts: readonly HrEmploymentContract[], filters: { employeeId?: string | "all"; status?: HrContractStatus | "all"; includeArchived?: boolean } = {}) {
  return contracts
    .filter((contract) => filters.includeArchived || !contract.archivedAt)
    .filter((contract) => !filters.employeeId || filters.employeeId === "all" || contract.employeeId === filters.employeeId)
    .filter((contract) => !filters.status || filters.status === "all" || contract.status === filters.status)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function filterLeaveRequests(requests: readonly HrLeaveRequest[], filters: HrLeaveRequestFilters = {}) {
  return requests
    .filter((request) => filters.includeArchived || !request.archivedAt)
    .filter((request) => !filters.employeeId || filters.employeeId === "all" || request.employeeId === filters.employeeId)
    .filter((request) => !filters.status || filters.status === "all" || request.status === filters.status)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function getDepartmentName(departments: readonly HrDepartment[], departmentId?: string) {
  return departments.find((department) => department.id === departmentId)?.name ?? "Non affecté";
}

export function getPositionName(positions: readonly HrPosition[], positionId?: string) {
  return positions.find((position) => position.id === positionId)?.name ?? "Non renseigné";
}

export function summarizeHr(snapshot: {
  employees: readonly HrEmployee[];
  departments: readonly HrDepartment[];
  positions: readonly HrPosition[];
  contracts: readonly HrEmploymentContract[];
  leaveRequests: readonly HrLeaveRequest[];
}) {
  const activeEmployees = snapshot.employees.filter((employee) => !employee.archivedAt && employee.status === "active").length;
  const onLeaveEmployees = snapshot.employees.filter((employee) => !employee.archivedAt && employee.status === "on_leave").length;
  const activeDepartments = snapshot.departments.filter((department) => department.active).length;
  const activePositions = snapshot.positions.filter((position) => position.active).length;
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 45);
  const contractsEndingSoon = snapshot.contracts.filter((contract) => {
    if (contract.archivedAt || contract.status !== "active" || !contract.endDate) return false;
    const endDate = new Date(contract.endDate);
    return endDate >= now && endDate <= soon;
  }).length;
  const pendingLeaves = snapshot.leaveRequests.filter((request) => !request.archivedAt && request.status === "requested").length;

  return Object.freeze({
    activeEmployees,
    onLeaveEmployees,
    activeDepartments,
    activePositions,
    contractsEndingSoon,
    pendingLeaves
  });
}

export function isValidEmployeeStatus(value: string): value is HrEmployeeStatus {
  return ["active", "inactive", "on_leave", "terminated", "archived"].includes(value);
}
