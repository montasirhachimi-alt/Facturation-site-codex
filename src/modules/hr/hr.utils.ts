import type {
  HrContractStatus,
  HrAbsence,
  HrAbsenceFilters,
  HrAttendanceFilters,
  HrAttendanceRecord,
  HrDepartment,
  HrEmployee,
  HrEmployeeFilters,
  HrEmployeeStatus,
  HrEmploymentContract,
  HrLeaveBalance,
  HrLeaveBalanceProjection,
  HrLeaveRequest,
  HrLeaveRequestFilters,
  HrLeaveType,
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
    .filter((request) => !filters.leaveTypeId || filters.leaveTypeId === "all" || request.leaveTypeId === filters.leaveTypeId)
    .filter((request) => !filters.status || filters.status === "all" || request.status === filters.status)
    .filter((request) => !filters.fromDate || new Date(request.endDate).getTime() >= startOfDay(filters.fromDate).getTime())
    .filter((request) => !filters.toDate || new Date(request.startDate).getTime() <= endOfDay(filters.toDate).getTime())
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function filterAbsences(absences: readonly HrAbsence[], employees: readonly HrEmployee[], filters: HrAbsenceFilters = {}) {
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  return absences
    .filter((absence) => !filters.employeeId || filters.employeeId === "all" || absence.employeeId === filters.employeeId)
    .filter((absence) => !filters.departmentId || filters.departmentId === "all" || employeeById.get(absence.employeeId)?.departmentId === filters.departmentId)
    .filter((absence) => !filters.type || filters.type === "all" || absence.type === filters.type)
    .filter((absence) => !filters.fromDate || new Date(absence.endDate).getTime() >= startOfDay(filters.fromDate).getTime())
    .filter((absence) => !filters.toDate || new Date(absence.startDate).getTime() <= endOfDay(filters.toDate).getTime())
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function filterAttendanceRecords(records: readonly HrAttendanceRecord[], employees: readonly HrEmployee[], filters: HrAttendanceFilters = {}) {
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  return records
    .filter((record) => !filters.employeeId || filters.employeeId === "all" || record.employeeId === filters.employeeId)
    .filter((record) => !filters.departmentId || filters.departmentId === "all" || employeeById.get(record.employeeId)?.departmentId === filters.departmentId)
    .filter((record) => !filters.status || filters.status === "all" || record.status === filters.status)
    .filter((record) => !filters.date || sameDay(record.date, filters.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function countInclusiveCalendarDays(startDate: string, endDate: string) {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / 86_400_000) + 1;
}

export function calculateLeaveBalance(
  balance: HrLeaveBalance,
  leaveRequests: readonly HrLeaveRequest[]
): HrLeaveBalanceProjection {
  const scoped = leaveRequests.filter((request) => request.employeeId === balance.employeeId && request.leaveTypeId === balance.leaveTypeId && new Date(request.startDate).getFullYear() === balance.periodYear && !request.archivedAt);
  const used = scoped.filter((request) => request.status === "approved").reduce((sum, request) => sum + countInclusiveCalendarDays(request.startDate, request.endDate), 0);
  const pending = scoped.filter((request) => request.status === "requested").reduce((sum, request) => sum + countInclusiveCalendarDays(request.startDate, request.endDate), 0);
  const entitled = Number(balance.entitledDays);
  const adjustment = Number(balance.adjustmentDays);
  const remaining = entitled + adjustment - used;
  return Object.freeze({
    employeeId: balance.employeeId,
    leaveTypeId: balance.leaveTypeId,
    periodYear: balance.periodYear,
    entitledDays: formatDays(entitled),
    adjustmentDays: formatDays(adjustment),
    usedDays: formatDays(used),
    pendingDays: formatDays(pending),
    remainingDays: formatDays(remaining)
  });
}

export function buildLeaveBalanceProjections(balances: readonly HrLeaveBalance[], requests: readonly HrLeaveRequest[]) {
  return Object.freeze(balances.map((balance) => calculateLeaveBalance(balance, requests)));
}

export function buildLeaveDerivedAbsences(requests: readonly HrLeaveRequest[], leaveTypes: readonly HrLeaveType[]): readonly HrAbsence[] {
  const leaveTypeById = new Map(leaveTypes.map((type) => [type.id, type]));
  return Object.freeze(requests
    .filter((request) => request.status === "approved" && !request.archivedAt)
    .map((request) => Object.freeze({
      id: `leave-absence-${request.id}` as HrAbsence["id"],
      tenantCompanyId: request.tenantCompanyId,
      employeeId: request.employeeId,
      startDate: request.startDate,
      endDate: request.endDate,
      type: leaveTypeById.get(request.leaveTypeId ?? "" as never)?.name ?? "Congé",
      source: "leave" as const,
      linkedLeaveRequestId: request.id,
      justified: true,
      notes: request.title,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    })));
}

export function buildHrCalendarItems(args: {
  leaveRequests: readonly HrLeaveRequest[];
  absences: readonly HrAbsence[];
  leaveTypes: readonly HrLeaveType[];
  fromDate: string;
  toDate: string;
}) {
  const leaveTypeById = new Map(args.leaveTypes.map((type) => [type.id, type]));
  const items = [
    ...args.leaveRequests
      .filter((request) => ["requested", "approved"].includes(request.status))
      .flatMap((request) => expandDateRange(request.startDate, request.endDate).map((date) => ({
        id: `${request.id}-${date}`,
        employeeId: request.employeeId,
        date,
        kind: request.status === "approved" ? "approved_leave" as const : "pending_leave" as const,
        label: leaveTypeById.get(request.leaveTypeId ?? "" as never)?.name ?? request.title,
        status: request.status
      }))),
    ...args.absences.flatMap((absence) => expandDateRange(absence.startDate, absence.endDate).map((date) => ({
      id: `${absence.id}-${date}`,
      employeeId: absence.employeeId,
      date,
      kind: "manual_absence" as const,
      label: absence.type,
      status: absence.justified ? "justified" : "unjustified"
    })))
  ];
  const from = startOfDay(args.fromDate).getTime();
  const to = endOfDay(args.toDate).getTime();
  return Object.freeze(items.filter((item) => {
    const time = startOfDay(item.date).getTime();
    return time >= from && time <= to;
  }).sort((a, b) => a.date.localeCompare(b.date)));
}

export function getEmployeeWorkforceState(employeeId: string, date: string, requests: readonly HrLeaveRequest[], absences: readonly HrAbsence[], attendance: readonly HrAttendanceRecord[]) {
  const record = attendance.find((item) => item.employeeId === employeeId && sameDay(item.date, date));
  if (record) return record.status;
  const onLeave = requests.some((request) => request.employeeId === employeeId && request.status === "approved" && dateWithin(date, request.startDate, request.endDate));
  if (onLeave) return "leave";
  const absent = absences.some((absence) => absence.employeeId === employeeId && dateWithin(date, absence.startDate, absence.endDate));
  if (absent) return "absent";
  return "not_recorded";
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
  absences?: readonly HrAbsence[];
  attendanceRecords?: readonly HrAttendanceRecord[];
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
  const todayIso = new Date().toISOString();
  const employeesOnLeaveToday = snapshot.leaveRequests.filter((request) => request.status === "approved" && dateWithin(todayIso, request.startDate, request.endDate)).length;
  const absencesToday = (snapshot.absences ?? []).filter((absence) => dateWithin(todayIso, absence.startDate, absence.endDate)).length;
  const attendanceRecordedToday = (snapshot.attendanceRecords ?? []).filter((record) => sameDay(record.date, todayIso)).length;

  return Object.freeze({
    activeEmployees,
    onLeaveEmployees,
    activeDepartments,
    activePositions,
    contractsEndingSoon,
    pendingLeaves,
    employeesOnLeaveToday,
    absencesToday,
    attendanceRecordedToday
  });
}

export function isValidEmployeeStatus(value: string): value is HrEmployeeStatus {
  return ["active", "inactive", "on_leave", "terminated", "archived"].includes(value);
}

function expandDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const current = startOfDay(startDate);
  const end = startOfDay(endDate);
  while (current.getTime() <= end.getTime()) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function dateWithin(date: string, startDate: string, endDate: string) {
  const time = startOfDay(date).getTime();
  return time >= startOfDay(startDate).getTime() && time <= endOfDay(endDate).getTime();
}

function sameDay(left: string, right: string) {
  return startOfDay(left).toISOString().slice(0, 10) === startOfDay(right).toISOString().slice(0, 10);
}

function startOfDay(value: string) {
  return parseDateOnly(value);
}

function endOfDay(value: string) {
  const date = parseDateOnly(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

function formatDays(value: number) {
  return value.toFixed(2);
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
