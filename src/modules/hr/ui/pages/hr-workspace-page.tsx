"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BriefcaseBusiness, Building2, CalendarDays, ContactRound, Edit3, FileText, Plus, Search, UserRoundCheck, Users } from "lucide-react";
import { hydrateHrPersistence, persistHrRecord } from "@/platform/persistence/hr-persistence.client";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { MetricCard, SectionCard } from "@/ui";
import {
  HR_CONTRACT_STATUS_LABELS,
  HR_CONTRACT_TYPE_LABELS,
  HR_EMPLOYEE_STATUS_LABELS,
  HR_LEAVE_REQUEST_STATUS_LABELS,
  HR_WORKING_TIME_TYPE_LABELS,
  hrLocalService,
  subscribeToHrStore,
  summarizeHr,
  type HrContractStatus,
  type HrContractType,
  type HrDepartment,
  type HrEmployee,
  type HrEmployeeId,
  type HrEmployeeStatus,
  type HrEmploymentContract,
  type HrLeaveRequest,
  type HrLeaveRequestStatus,
  type HrLeaveType,
  type HrPosition,
  type HrWorkingTimeType
} from "@/modules/hr";

type HrTab = "overview" | "employees" | "departments" | "positions" | "contracts" | "leaves";
type Notice = { tone: "success" | "error"; message: string };
type EmployeeForm = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  terminationDate: string;
  status: HrEmployeeStatus;
  departmentId: string;
  positionId: string;
  managerEmployeeId: string;
  linkedUserId: string;
  notes: string;
};
type DepartmentForm = { code: string; name: string; description: string; managerId: string; active: boolean };
type PositionForm = { code: string; name: string; departmentId: string; description: string; active: boolean };
type ContractForm = {
  employeeId: string;
  contractType: HrContractType;
  startDate: string;
  endDate: string;
  positionId: string;
  jobTitle: string;
  workingTimeType: HrWorkingTimeType;
  notes: string;
  status: HrContractStatus;
};
type LeaveForm = {
  employeeId: string;
  leaveTypeId: string;
  title: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: HrLeaveRequestStatus;
};

const tabs = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "employees", label: "Employés" },
  { id: "departments", label: "Départements" },
  { id: "positions", label: "Postes" },
  { id: "contracts", label: "Contrats" },
  { id: "leaves", label: "Congés" }
] satisfies readonly { id: HrTab; label: string }[];

const emptyEmployeeForm: EmployeeForm = {
  employeeNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  hireDate: today(),
  terminationDate: "",
  status: "active",
  departmentId: "",
  positionId: "",
  managerEmployeeId: "",
  linkedUserId: "",
  notes: ""
};

const emptyDepartmentForm: DepartmentForm = { code: "", name: "", description: "", managerId: "", active: true };
const emptyPositionForm: PositionForm = { code: "", name: "", departmentId: "", description: "", active: true };
const emptyContractForm: ContractForm = {
  employeeId: "",
  contractType: "permanent",
  startDate: today(),
  endDate: "",
  positionId: "",
  jobTitle: "",
  workingTimeType: "full_time",
  notes: "",
  status: "active"
};
const emptyLeaveForm: LeaveForm = { employeeId: "", leaveTypeId: "", title: "", reason: "", startDate: today(), endDate: today(), status: "requested" };

export function HrWorkspacePage() {
  const [version, setVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<HrTab>("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<HrEmployeeStatus | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<HrEmployee | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<HrDepartment | null>(null);
  const [editingPosition, setEditingPosition] = useState<HrPosition | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(emptyEmployeeForm);
  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>(emptyDepartmentForm);
  const [positionForm, setPositionForm] = useState<PositionForm>(emptyPositionForm);
  const [contractForm, setContractForm] = useState<ContractForm>(emptyContractForm);
  const [leaveForm, setLeaveForm] = useState<LeaveForm>(emptyLeaveForm);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  useEffect(() => {
    void hydrateHrPersistence().catch((error) => setNotice({ tone: "error", message: error instanceof Error ? error.message : "Chargement RH impossible." }));
    const unsubscribe = subscribeToHrStore(() => setVersion((value) => value + 1));
    return unsubscribe;
  }, []);

  const snapshot = useMemo(() => {
    void version;
    return hrLocalService.getSnapshot();
  }, [version]);
  const employees = useMemo(() => {
    void version;
    return hrLocalService.listEmployees({ query, status: statusFilter, departmentId: departmentFilter as never, includeArchived: false }).employees;
  }, [departmentFilter, query, statusFilter, version]);
  const summary = useMemo(() => summarizeHr(snapshot), [snapshot]);
  const selectedEmployee = snapshot.employees.find((employee) => employee.id === selectedEmployeeId) ?? employees[0];
  const employeeById = new Map(snapshot.employees.map((employee) => [employee.id, employee]));
  const departmentById = new Map(snapshot.departments.map((department) => [department.id, department]));
  const positionById = new Map(snapshot.positions.map((position) => [position.id, position]));

  function openEmployee(employee?: HrEmployee) {
    setEditingEmployee(employee ?? null);
    setEmployeeForm(employee ? employeeToForm(employee) : { ...emptyEmployeeForm, employeeNumber: nextEmployeeNumber(snapshot.employees), hireDate: today() });
    setEmployeeDialogOpen(true);
    setNotice(null);
  }

  function openDepartment(department?: HrDepartment) {
    setEditingDepartment(department ?? null);
    setDepartmentForm(department ? departmentToForm(department) : emptyDepartmentForm);
    setDepartmentDialogOpen(true);
    setNotice(null);
  }

  function openPosition(position?: HrPosition) {
    setEditingPosition(position ?? null);
    setPositionForm(position ? positionToForm(position) : emptyPositionForm);
    setPositionDialogOpen(true);
    setNotice(null);
  }

  function openContract(employeeId?: HrEmployeeId) {
    const employee = employeeId ? employeeById.get(employeeId) : undefined;
    const position = employee?.positionId ? positionById.get(employee.positionId) : undefined;
    setContractForm({ ...emptyContractForm, employeeId: employeeId ?? "", positionId: employee?.positionId ?? "", jobTitle: position?.name ?? "", startDate: today() });
    setContractDialogOpen(true);
    setNotice(null);
  }

  function openLeave(employeeId?: HrEmployeeId) {
    setLeaveForm({ ...emptyLeaveForm, employeeId: employeeId ?? "", startDate: today(), endDate: today() });
    setLeaveDialogOpen(true);
    setNotice(null);
  }

  async function saveEmployee() {
    setSaving(true);
    setNotice(null);
    try {
      const result = editingEmployee
        ? hrLocalService.updateEmployee(employeeFormToUpdate(editingEmployee, employeeForm))
        : hrLocalService.createEmployee(employeeFormToCreate(employeeForm));
      if (!result.employee) throw new Error(result.error ?? "Employé non enregistré.");
      await persistHrRecord("employee", result.employee);
      setSelectedEmployeeId(result.employee.id);
      setEmployeeDialogOpen(false);
      setNotice({ tone: "success", message: editingEmployee ? "Employé enregistré." : "Employé créé." });
      return true;
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Employé non enregistré." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveDepartment() {
    setSaving(true);
    setNotice(null);
    try {
      const result = editingDepartment
        ? hrLocalService.updateDepartment({ id: editingDepartment.id, ...departmentForm, managerId: optionalId(departmentForm.managerId) as never })
        : hrLocalService.createDepartment({ ...departmentForm, managerId: optionalId(departmentForm.managerId) as never });
      if (!result.department) throw new Error(result.error ?? "Département non enregistré.");
      await persistHrRecord("department", result.department);
      setDepartmentDialogOpen(false);
      setNotice({ tone: "success", message: editingDepartment ? "Département enregistré." : "Département créé." });
      return true;
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Département non enregistré." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function savePosition() {
    setSaving(true);
    setNotice(null);
    try {
      const result = editingPosition
        ? hrLocalService.updatePosition({ id: editingPosition.id, ...positionForm, departmentId: optionalId(positionForm.departmentId) as never })
        : hrLocalService.createPosition({ ...positionForm, departmentId: optionalId(positionForm.departmentId) as never });
      if (!result.position) throw new Error(result.error ?? "Poste non enregistré.");
      await persistHrRecord("position", result.position);
      setPositionDialogOpen(false);
      setNotice({ tone: "success", message: editingPosition ? "Poste enregistré." : "Poste créé." });
      return true;
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Poste non enregistré." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveContract() {
    setSaving(true);
    setNotice(null);
    try {
      const result = hrLocalService.createContract({
        employeeId: contractForm.employeeId as never,
        contractType: contractForm.contractType,
        startDate: new Date(contractForm.startDate || today()).toISOString(),
        endDate: contractForm.endDate ? new Date(contractForm.endDate).toISOString() : undefined,
        positionId: optionalId(contractForm.positionId) as never,
        jobTitle: contractForm.jobTitle,
        workingTimeType: contractForm.workingTimeType,
        notes: contractForm.notes,
        status: contractForm.status
      });
      if (!result.contract) throw new Error(result.error ?? "Contrat non enregistré.");
      await persistHrRecord("contract", result.contract);
      setContractDialogOpen(false);
      setNotice({ tone: "success", message: "Contrat créé." });
      return true;
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Contrat non enregistré." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveLeave() {
    setSaving(true);
    setNotice(null);
    try {
      await ensureDefaultLeaveType();
      const leaveTypes = hrLocalService.listLeaveTypes().leaveTypes;
      const leaveTypeId = optionalId(leaveForm.leaveTypeId) || leaveTypes[0]?.id;
      const result = hrLocalService.createLeaveRequest({
        employeeId: leaveForm.employeeId as never,
        leaveTypeId: leaveTypeId as never,
        title: leaveForm.title || "Demande de congé",
        reason: leaveForm.reason,
        startDate: new Date(leaveForm.startDate || today()).toISOString(),
        endDate: new Date(leaveForm.endDate || today()).toISOString(),
        status: leaveForm.status,
        requestedAt: new Date().toISOString()
      });
      if (!result.leaveRequest) throw new Error(result.error ?? "Demande de congé non enregistrée.");
      await persistHrRecord("leaveRequest", result.leaveRequest);
      setLeaveDialogOpen(false);
      setNotice({ tone: "success", message: "Demande de congé créée." });
      return true;
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Demande de congé non enregistrée." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function ensureDefaultLeaveType() {
    if (hrLocalService.listLeaveTypes().leaveTypes.length > 0) return;
    const result = hrLocalService.createLeaveType({ name: "Congé payé", paid: true, active: true });
    if (result.leaveType) await persistHrRecord("leaveType", result.leaveType);
  }

  async function archiveEmployee(employee: HrEmployee) {
    const result = hrLocalService.updateEmployee({ id: employee.id, status: "archived", archivedAt: new Date().toISOString() });
    if (!result.employee) return;
    await persistHrRecord("employee", result.employee);
    setNotice({ tone: "success", message: "Employé archivé." });
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Ressources humaines</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Socle RH Alpha</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-300">Centralisez les collaborateurs, départements, postes, contrats et demandes de congé sans introduire de paie.</p>
          </div>
          <button type="button" onClick={() => openEmployee()} className={primaryButtonClassName}><Plus size={16} /> Nouvel employé</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-xl px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 ${activeTab === tab.id ? "bg-hicotech-navy text-white dark:bg-white dark:text-hicotech-navy" : "text-slate-500 hover:bg-slate-100 hover:text-hicotech-navy dark:hover:bg-white/10 dark:hover:text-white"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {notice && <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{notice.message}</div>}

      {activeTab === "overview" && <Overview summary={summary} employees={snapshot.employees} contracts={snapshot.contracts} leaves={snapshot.leaveRequests} departments={snapshot.departments} positions={snapshot.positions} />}
      {activeTab === "employees" && <EmployeesSection employees={employees} departments={snapshot.departments} positions={snapshot.positions} managers={employeeById} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter} onCreate={() => openEmployee()} onEdit={openEmployee} onArchive={(employee) => void archiveEmployee(employee)} onContract={(employee) => openContract(employee.id)} onLeave={(employee) => openLeave(employee.id)} onSelect={(employee) => setSelectedEmployeeId(employee.id)} />}
      {activeTab === "departments" && <DepartmentSection departments={snapshot.departments} employees={snapshot.employees} onCreate={() => openDepartment()} onEdit={openDepartment} />}
      {activeTab === "positions" && <PositionSection positions={snapshot.positions} departments={departmentById} onCreate={() => openPosition()} onEdit={openPosition} />}
      {activeTab === "contracts" && <ContractsSection contracts={snapshot.contracts} employees={employeeById} positions={positionById} onCreate={() => openContract(selectedEmployee?.id)} />}
      {activeTab === "leaves" && <LeavesSection leaves={snapshot.leaveRequests} employees={employeeById} leaveTypes={new Map(snapshot.leaveTypes.map((type) => [type.id, type]))} onCreate={() => openLeave(selectedEmployee?.id)} />}

      {selectedEmployee && <EmployeeDetail employee={selectedEmployee} departments={departmentById} positions={positionById} managers={employeeById} contracts={snapshot.contracts.filter((contract) => contract.employeeId === selectedEmployee.id)} leaves={snapshot.leaveRequests.filter((leave) => leave.employeeId === selectedEmployee.id)} onEdit={() => openEmployee(selectedEmployee)} />}

      <EmployeeDialog departments={snapshot.departments} editing={Boolean(editingEmployee)} employees={snapshot.employees} form={employeeForm} onChange={setEmployeeForm} onClose={() => setEmployeeDialogOpen(false)} onSubmit={saveEmployee} open={employeeDialogOpen} positions={snapshot.positions} saving={saving} />
      <DepartmentDialog employees={snapshot.employees} editing={Boolean(editingDepartment)} form={departmentForm} onChange={setDepartmentForm} onClose={() => setDepartmentDialogOpen(false)} onSubmit={saveDepartment} open={departmentDialogOpen} saving={saving} />
      <PositionDialog departments={snapshot.departments} editing={Boolean(editingPosition)} form={positionForm} onChange={setPositionForm} onClose={() => setPositionDialogOpen(false)} onSubmit={savePosition} open={positionDialogOpen} saving={saving} />
      <ContractDialog employees={snapshot.employees} form={contractForm} onChange={setContractForm} onClose={() => setContractDialogOpen(false)} onSubmit={saveContract} open={contractDialogOpen} positions={snapshot.positions} saving={saving} />
      <LeaveDialog employees={snapshot.employees} form={leaveForm} leaveTypes={snapshot.leaveTypes} onChange={setLeaveForm} onClose={() => setLeaveDialogOpen(false)} onSubmit={saveLeave} open={leaveDialogOpen} saving={saving} />
    </main>
  );
}

function Overview({ contracts, departments, employees, leaves, positions, summary }: { contracts: readonly HrEmploymentContract[]; departments: readonly HrDepartment[]; employees: readonly HrEmployee[]; leaves: readonly HrLeaveRequest[]; positions: readonly HrPosition[]; summary: ReturnType<typeof summarizeHr> }) {
  return (
    <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <MetricCard icon={Users} label="Employés actifs" value={String(summary.activeEmployees)} helper={`${employees.length} collaborateur(s) au total`} />
      <MetricCard icon={Building2} label="Départements" value={String(summary.activeDepartments)} helper={`${departments.length} référentiel(s)`} />
      <MetricCard icon={BriefcaseBusiness} label="Postes" value={String(summary.activePositions)} helper={`${positions.length} intitulé(s)`} />
      <MetricCard icon={FileText} label="Contrats actifs" value={String(contracts.filter((contract) => contract.status === "active" && !contract.archivedAt).length)} helper={`${summary.contractsEndingSoon} fin(s) proche(s)`} />
      <MetricCard icon={CalendarDays} label="Congés en attente" value={String(summary.pendingLeaves)} helper={`${leaves.length} demande(s)`} />
      <MetricCard icon={UserRoundCheck} label="En congé" value={String(summary.onLeaveEmployees)} helper="Statut collaborateur" />
    </section>
  );
}

function EmployeesSection(props: {
  departmentFilter: string;
  departments: readonly HrDepartment[];
  employees: readonly HrEmployee[];
  managers: Map<string, HrEmployee>;
  onArchive: (employee: HrEmployee) => void;
  onContract: (employee: HrEmployee) => void;
  onCreate: () => void;
  onEdit: (employee: HrEmployee) => void;
  onLeave: (employee: HrEmployee) => void;
  onSelect: (employee: HrEmployee) => void;
  positions: readonly HrPosition[];
  query: string;
  setDepartmentFilter: (value: string) => void;
  setQuery: (value: string) => void;
  setStatusFilter: (value: HrEmployeeStatus | "all") => void;
  statusFilter: HrEmployeeStatus | "all";
}) {
  const departmentById = new Map(props.departments.map((department) => [department.id, department]));
  const positionById = new Map(props.positions.map((position) => [position.id, position]));
  return (
    <SectionCard className="mt-4 overflow-hidden">
      <Toolbar title="Employés" actionLabel="Nouvel employé" onAction={props.onCreate}>
        <SearchInput value={props.query} onChange={props.setQuery} />
        <select className={filterClassName} value={props.statusFilter} onChange={(event) => props.setStatusFilter(event.target.value as HrEmployeeStatus | "all")}>
          <option value="all">Tous les statuts</option>
          {Object.entries(HR_EMPLOYEE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className={filterClassName} value={props.departmentFilter} onChange={(event) => props.setDepartmentFilter(event.target.value)}>
          <option value="all">Tous les départements</option>
          {props.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
      </Toolbar>
      <TableShell isEmpty={props.employees.length === 0} emptyMessage="Aucun employé. Cliquez sur Nouvel employé pour créer le premier collaborateur.">
        <thead className={tableHeadClassName}><tr><th>Matricule</th><th>Employé</th><th>Département</th><th>Poste</th><th>Manager</th><th>Statut</th><th>Date d&apos;entrée</th><th className="text-right">Actions</th></tr></thead>
        <tbody>
          {props.employees.map((employee) => (
            <tr key={employee.id} className={rowClassName} onClick={() => props.onSelect(employee)}>
              <td>{employee.employeeNumber}</td>
              <td><p className="font-bold text-hicotech-navy dark:text-white">{employee.displayName}</p><p className="text-xs text-slate-500">{employee.email || employee.phone || "-"}</p></td>
              <td>{employee.departmentId ? departmentById.get(employee.departmentId)?.name ?? "-" : "-"}</td>
              <td>{employee.positionId ? positionById.get(employee.positionId)?.name ?? "-" : "-"}</td>
              <td>{employee.managerEmployeeId ? props.managers.get(employee.managerEmployeeId)?.displayName ?? "-" : "-"}</td>
              <td><StatusBadge label={HR_EMPLOYEE_STATUS_LABELS[employee.status]} tone={employee.status === "active" ? "ok" : employee.status === "archived" ? "muted" : "warning"} /></td>
              <td>{formatDate(employee.hireDate)}</td>
              <td className="text-right"><RowActions onEdit={() => props.onEdit(employee)} onArchive={() => props.onArchive(employee)} onContract={() => props.onContract(employee)} onLeave={() => props.onLeave(employee)} /></td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </SectionCard>
  );
}

function DepartmentSection({ departments, employees, onCreate, onEdit }: { departments: readonly HrDepartment[]; employees: readonly HrEmployee[]; onCreate: () => void; onEdit: (department: HrDepartment) => void }) {
  return (
    <SimpleCardTable title="Départements" actionLabel="Nouveau département" empty="Aucun département RH." onAction={onCreate} headers={["Code", "Nom", "Responsable", "Actif", "Employés", "Actions"]}>
      {departments.map((department) => (
        <tr key={department.id} className={rowClassName}>
          <td>{department.code || "-"}</td><td className="font-bold">{department.name}</td><td>{employees.find((employee) => employee.id === department.managerId)?.displayName ?? "-"}</td><td>{department.active ? "Oui" : "Non"}</td><td>{employees.filter((employee) => employee.departmentId === department.id && !employee.archivedAt).length}</td>
          <td className="text-right"><IconButton label="Modifier le département" onClick={() => onEdit(department)}><Edit3 size={15} /></IconButton></td>
        </tr>
      ))}
    </SimpleCardTable>
  );
}

function PositionSection({ departments, onCreate, onEdit, positions }: { departments: Map<string, HrDepartment>; onCreate: () => void; onEdit: (position: HrPosition) => void; positions: readonly HrPosition[] }) {
  return (
    <SimpleCardTable title="Postes" actionLabel="Nouveau poste" empty="Aucun poste RH." onAction={onCreate} headers={["Code", "Poste", "Département", "Actif", "Actions"]}>
      {positions.map((position) => (
        <tr key={position.id} className={rowClassName}>
          <td>{position.code || "-"}</td><td className="font-bold">{position.name}</td><td>{departments.get(position.departmentId ?? "")?.name ?? "-"}</td><td>{position.active ? "Oui" : "Non"}</td>
          <td className="text-right"><IconButton label="Modifier le poste" onClick={() => onEdit(position)}><Edit3 size={15} /></IconButton></td>
        </tr>
      ))}
    </SimpleCardTable>
  );
}

function ContractsSection({ contracts, employees, onCreate, positions }: { contracts: readonly HrEmploymentContract[]; employees: Map<string, HrEmployee>; onCreate: () => void; positions: Map<string, HrPosition> }) {
  return (
    <SimpleCardTable title="Contrats" actionLabel="Nouveau contrat" empty="Aucun contrat RH." onAction={onCreate} headers={["Employé", "Type", "Poste", "Début", "Fin", "Statut"]}>
      {contracts.map((contract) => (
        <tr key={contract.id} className={rowClassName}>
          <td>{employees.get(contract.employeeId)?.displayName ?? "-"}</td><td>{HR_CONTRACT_TYPE_LABELS[contract.contractType]}</td><td>{positions.get(contract.positionId ?? "")?.name ?? contract.jobTitle}</td><td>{formatDate(contract.startDate)}</td><td>{contract.endDate ? formatDate(contract.endDate) : "-"}</td><td>{HR_CONTRACT_STATUS_LABELS[contract.status]}</td>
        </tr>
      ))}
    </SimpleCardTable>
  );
}

function LeavesSection({ employees, leaveTypes, leaves, onCreate }: { employees: Map<string, HrEmployee>; leaveTypes: Map<string, HrLeaveType>; leaves: readonly HrLeaveRequest[]; onCreate: () => void }) {
  return (
    <SimpleCardTable title="Congés" actionLabel="Nouvelle demande" empty="Aucune demande de congé." onAction={onCreate} headers={["Employé", "Type", "Début", "Fin", "Statut", "Motif"]}>
      {leaves.map((leave) => (
        <tr key={leave.id} className={rowClassName}>
          <td>{employees.get(leave.employeeId)?.displayName ?? "-"}</td><td>{leaveTypes.get(leave.leaveTypeId ?? "")?.name ?? "Congé"}</td><td>{formatDate(leave.startDate)}</td><td>{formatDate(leave.endDate)}</td><td>{HR_LEAVE_REQUEST_STATUS_LABELS[leave.status]}</td><td>{leave.reason || "-"}</td>
        </tr>
      ))}
    </SimpleCardTable>
  );
}

function EmployeeDetail({ contracts, departments, employee, leaves, managers, onEdit, positions }: { contracts: readonly HrEmploymentContract[]; departments: Map<string, HrDepartment>; employee: HrEmployee; leaves: readonly HrLeaveRequest[]; managers: Map<string, HrEmployee>; onEdit: () => void; positions: Map<string, HrPosition> }) {
  return (
    <SectionCard className="mt-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-hicotech-blue">Fiche collaborateur</p>
          <h2 className="mt-1 font-display text-xl font-black text-hicotech-navy dark:text-white">{employee.displayName}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{employee.employeeNumber} · {departments.get(employee.departmentId ?? "")?.name ?? "Département non affecté"} · {positions.get(employee.positionId ?? "")?.name ?? "Poste non renseigné"}</p>
        </div>
        <button type="button" onClick={onEdit} className={secondaryButtonClassName}><Edit3 size={15} /> Modifier</button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Info label="Statut" value={HR_EMPLOYEE_STATUS_LABELS[employee.status]} />
        <Info label="Date d'entrée" value={formatDate(employee.hireDate)} />
        <Info label="Manager" value={managers.get(employee.managerEmployeeId ?? "")?.displayName ?? "-"} />
        <Info label="Contrats" value={String(contracts.length)} />
        <Info label="Email" value={employee.email || "-"} />
        <Info label="Téléphone" value={employee.phone || "-"} />
        <Info label="Congés" value={String(leaves.length)} />
        <Info label="Notes" value={employee.notes || "-"} />
      </div>
    </SectionCard>
  );
}

function EmployeeDialog({ departments, editing, employees, form, onChange, onClose, onSubmit, open, positions, saving }: { departments: readonly HrDepartment[]; editing: boolean; employees: readonly HrEmployee[]; form: EmployeeForm; onChange: (form: EmployeeForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; positions: readonly HrPosition[]; saving: boolean }) {
  const update = (key: keyof EmployeeForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <EntityDialog open={open} eyebrow="RH" title={editing ? "Modifier l'employé" : "Nouvel employé"} description="Un employé RH peut exister sans compte utilisateur BOSIACO." onClose={onClose} onSubmit={onSubmit} size="lg" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel={editing ? "Enregistrer" : "Créer l'employé"} />}>
      <FormSection title="Identité">
        <FormField label="Matricule" required><input className={entityInputClassName} value={form.employeeNumber} onChange={(event) => update("employeeNumber", event.target.value)} /></FormField>
        <FormField label="Statut"><select className={entityInputClassName} value={form.status} onChange={(event) => update("status", event.target.value)}>{Object.entries(HR_EMPLOYEE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
        <FormField label="Prénom" required><input className={entityInputClassName} value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></FormField>
        <FormField label="Nom" required><input className={entityInputClassName} value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></FormField>
        <FormField label="Email"><input className={entityInputClassName} value={form.email} onChange={(event) => update("email", event.target.value)} /></FormField>
        <FormField label="Téléphone"><input className={entityInputClassName} value={form.phone} onChange={(event) => update("phone", event.target.value)} /></FormField>
      </FormSection>
      <FormSection title="Affectation">
        <FormField label="Département"><Select value={form.departmentId} onChange={(value) => update("departmentId", value)} placeholder="Non affecté" options={departments.map((department) => [department.id, department.name])} /></FormField>
        <FormField label="Poste"><Select value={form.positionId} onChange={(value) => update("positionId", value)} placeholder="Non renseigné" options={positions.map((position) => [position.id, position.name])} /></FormField>
        <FormField label="Manager"><Select value={form.managerEmployeeId} onChange={(value) => update("managerEmployeeId", value)} placeholder="Aucun manager" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField>
        <FormField label="Date d'entrée" required><input type="date" className={entityInputClassName} value={form.hireDate} onChange={(event) => update("hireDate", event.target.value)} /></FormField>
        <FormField label="Date de sortie"><input type="date" className={entityInputClassName} value={form.terminationDate} onChange={(event) => update("terminationDate", event.target.value)} /></FormField>
        <FormField label="Notes"><textarea className={entityInputClassName} value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} /></FormField>
      </FormSection>
    </EntityDialog>
  );
}

function DepartmentDialog({ editing, employees, form, onChange, onClose, onSubmit, open, saving }: { editing: boolean; employees: readonly HrEmployee[]; form: DepartmentForm; onChange: (form: DepartmentForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} eyebrow="RH" title={editing ? "Modifier le département" : "Nouveau département"} description="Structure simple utilisée pour classer les collaborateurs." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Enregistrer" />}>
    <FormSection title="Département"><FormField label="Code"><input className={entityInputClassName} value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} /></FormField><FormField label="Nom" required><input className={entityInputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></FormField><FormField label="Manager"><Select value={form.managerId} onChange={(managerId) => onChange({ ...form, managerId })} placeholder="Aucun manager" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Description"><textarea className={entityInputClassName} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function PositionDialog({ departments, editing, form, onChange, onClose, onSubmit, open, saving }: { departments: readonly HrDepartment[]; editing: boolean; form: PositionForm; onChange: (form: PositionForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} eyebrow="RH" title={editing ? "Modifier le poste" : "Nouveau poste"} description="Intitulé de poste réutilisable dans les fiches employés et contrats." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Enregistrer" />}>
    <FormSection title="Poste"><FormField label="Code"><input className={entityInputClassName} value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} /></FormField><FormField label="Nom" required><input className={entityInputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></FormField><FormField label="Département"><Select value={form.departmentId} onChange={(departmentId) => onChange({ ...form, departmentId })} placeholder="Aucun département" options={departments.map((department) => [department.id, department.name])} /></FormField><FormField label="Description"><textarea className={entityInputClassName} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function ContractDialog({ employees, form, onChange, onClose, onSubmit, open, positions, saving }: { employees: readonly HrEmployee[]; form: ContractForm; onChange: (form: ContractForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; positions: readonly HrPosition[]; saving: boolean }) {
  return <EntityDialog open={open} eyebrow="RH" title="Nouveau contrat" description="Fondation contractuelle sans calcul de paie." onClose={onClose} onSubmit={onSubmit} size="lg" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Créer le contrat" />}>
    <FormSection title="Contrat"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Type"><Select value={form.contractType} onChange={(contractType) => onChange({ ...form, contractType: contractType as HrContractType })} options={Object.entries(HR_CONTRACT_TYPE_LABELS)} /></FormField><FormField label="Poste"><Select value={form.positionId} onChange={(positionId) => onChange({ ...form, positionId, jobTitle: positions.find((position) => position.id === positionId)?.name ?? form.jobTitle })} placeholder="Aucun poste" options={positions.map((position) => [position.id, position.name])} /></FormField><FormField label="Intitulé" required><input className={entityInputClassName} value={form.jobTitle} onChange={(event) => onChange({ ...form, jobTitle: event.target.value })} /></FormField><FormField label="Début" required><input type="date" className={entityInputClassName} value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} /></FormField><FormField label="Fin"><input type="date" className={entityInputClassName} value={form.endDate} onChange={(event) => onChange({ ...form, endDate: event.target.value })} /></FormField><FormField label="Temps de travail"><Select value={form.workingTimeType} onChange={(workingTimeType) => onChange({ ...form, workingTimeType: workingTimeType as HrWorkingTimeType })} options={Object.entries(HR_WORKING_TIME_TYPE_LABELS)} /></FormField><FormField label="Notes"><textarea className={entityInputClassName} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} rows={3} /></FormField></FormSection>
  </EntityDialog>;
}

function LeaveDialog({ employees, form, leaveTypes, onChange, onClose, onSubmit, open, saving }: { employees: readonly HrEmployee[]; form: LeaveForm; leaveTypes: readonly HrLeaveType[]; onChange: (form: LeaveForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} eyebrow="RH" title="Nouvelle demande de congé" description="Fondation simple sans calcul automatique de droits." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Créer la demande" />}>
    <FormSection title="Demande"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Type"><Select value={form.leaveTypeId} onChange={(leaveTypeId) => onChange({ ...form, leaveTypeId })} placeholder="Congé payé par défaut" options={leaveTypes.map((type) => [type.id, type.name])} /></FormField><FormField label="Titre"><input className={entityInputClassName} value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} /></FormField><FormField label="Statut"><Select value={form.status} onChange={(status) => onChange({ ...form, status: status as HrLeaveRequestStatus })} options={Object.entries(HR_LEAVE_REQUEST_STATUS_LABELS)} /></FormField><FormField label="Début" required><input type="date" className={entityInputClassName} value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} /></FormField><FormField label="Fin" required><input type="date" className={entityInputClassName} value={form.endDate} onChange={(event) => onChange({ ...form, endDate: event.target.value })} /></FormField><FormField label="Motif"><textarea className={entityInputClassName} value={form.reason} onChange={(event) => onChange({ ...form, reason: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function Toolbar({ actionLabel, children, onAction, title }: { actionLabel: string; children?: ReactNode; onAction: () => void; title: string }) {
  return <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-hicotech-dark-border lg:flex-row lg:items-center lg:justify-between"><h2 className="font-display text-lg font-black text-hicotech-navy dark:text-white">{title}</h2><div className="flex flex-col gap-2 sm:flex-row sm:items-center">{children}<button type="button" onClick={onAction} className={primaryButtonClassName}><Plus size={15} /> {actionLabel}</button></div></div>;
}

function SimpleCardTable({ actionLabel, children, empty, headers, onAction, title }: { actionLabel: string; children: ReactNode; empty: string; headers: readonly string[]; onAction: () => void; title: string }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <SectionCard className="mt-4 overflow-hidden"><Toolbar title={title} actionLabel={actionLabel} onAction={onAction} /><TableShell isEmpty={!hasChildren} emptyMessage={empty}><thead className={tableHeadClassName}><tr>{headers.map((header) => <th key={header} className={header === "Actions" ? "text-right" : undefined}>{header}</th>)}</tr></thead><tbody>{children}</tbody></TableShell></SectionCard>;
}

function TableShell({ children, emptyMessage, isEmpty }: { children: ReactNode; emptyMessage: string; isEmpty: boolean }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">{children}</table>{isEmpty && <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">{emptyMessage}</p>}</div>;
}

function SearchInput({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input className={`${filterClassName} pl-9`} placeholder="Rechercher..." value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ onChange, options, placeholder, value }: { onChange: (value: string) => void; options: readonly (readonly [string, string])[]; placeholder?: string; value: string }) {
  return <select className={entityInputClassName} value={value} onChange={(event) => onChange(event.target.value)}>{placeholder && <option value="">{placeholder}</option>}{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>;
}

function RowActions({ onArchive, onContract, onEdit, onLeave }: { onArchive: () => void; onContract: () => void; onEdit: () => void; onLeave: () => void }) {
  return <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}><IconButton label="Modifier l'employé" onClick={onEdit}><Edit3 size={15} /></IconButton><IconButton label="Créer un contrat" onClick={onContract}><FileText size={15} /></IconButton><IconButton label="Créer une demande de congé" onClick={onLeave}><CalendarDays size={15} /></IconButton><IconButton label="Archiver l'employé" onClick={onArchive}><ContactRound size={15} /></IconButton></div>;
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={iconButtonClassName} aria-label={label} title={label}>{children}</button>;
}

function StatusBadge({ label, tone }: { label: string; tone: "ok" | "warning" | "muted" }) {
  const toneClassName = tone === "ok" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : tone === "warning" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-slate-50 text-slate-600 ring-slate-200";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${toneClassName}`}>{label}</span>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-hicotech-navy dark:text-white">{value}</p></div>;
}

function employeeFormToCreate(form: EmployeeForm) {
  return {
    employeeNumber: form.employeeNumber,
    firstName: form.firstName,
    lastName: form.lastName,
    email: optionalId(form.email),
    phone: optionalId(form.phone),
    hireDate: new Date(form.hireDate || today()).toISOString(),
    terminationDate: form.terminationDate ? new Date(form.terminationDate).toISOString() : undefined,
    status: form.status,
    departmentId: optionalId(form.departmentId) as never,
    positionId: optionalId(form.positionId) as never,
    managerEmployeeId: optionalId(form.managerEmployeeId) as never,
    linkedUserId: optionalId(form.linkedUserId) as never,
    notes: optionalId(form.notes)
  };
}

function employeeFormToUpdate(employee: HrEmployee, form: EmployeeForm) {
  return { id: employee.id, ...employeeFormToCreate(form) };
}

function employeeToForm(employee: HrEmployee): EmployeeForm {
  return { employeeNumber: employee.employeeNumber, firstName: employee.firstName, lastName: employee.lastName, email: employee.email ?? "", phone: employee.phone ?? "", hireDate: employee.hireDate.slice(0, 10), terminationDate: employee.terminationDate?.slice(0, 10) ?? "", status: employee.status, departmentId: employee.departmentId ?? "", positionId: employee.positionId ?? "", managerEmployeeId: employee.managerEmployeeId ?? "", linkedUserId: employee.linkedUserId ?? "", notes: employee.notes ?? "" };
}

function departmentToForm(department: HrDepartment): DepartmentForm {
  return { code: department.code ?? "", name: department.name, description: department.description ?? "", managerId: department.managerId ?? "", active: department.active };
}

function positionToForm(position: HrPosition): PositionForm {
  return { code: position.code ?? "", name: position.name, departmentId: position.departmentId ?? "", description: position.description ?? "", active: position.active };
}

function nextEmployeeNumber(employees: readonly HrEmployee[]) {
  return `EMP-${String(employees.length + 1).padStart(4, "0")}`;
}

function optionalId(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(value));
}

const primaryButtonClassName = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white";
const iconButtonClassName = "grid size-9 place-items-center rounded-lg border border-slate-200 text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white";
const filterClassName = "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-hicotech-navy outline-none transition focus:border-hicotech-blue focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white";
const tableHeadClassName = "bg-slate-50 text-xs uppercase text-slate-500 [&_th]:px-4 [&_th]:py-3 dark:bg-hicotech-dark-page/40";
const rowClassName = "border-t border-slate-100 text-slate-600 transition hover:bg-hicotech-sky/30 [&_td]:px-4 [&_td]:py-3 dark:border-hicotech-dark-border dark:text-slate-300";
