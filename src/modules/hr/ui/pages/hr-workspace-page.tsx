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
  HR_DOCUMENT_CATEGORY_OPTIONS,
  HR_DOCUMENT_STATUS_LABELS,
  HR_TEMPLATE_VARIABLES,
  HR_EMPLOYEE_STATUS_LABELS,
  HR_ATTENDANCE_STATUS_LABELS,
  HR_LEAVE_REQUEST_STATUS_LABELS,
  HR_WORKFORCE_STATE_LABELS,
  HR_WORKING_TIME_TYPE_LABELS,
  hrLocalService,
  subscribeToHrStore,
  summarizeHr,
  type HrContractStatus,
  type HrContractType,
  type HrDepartment,
  type HrDocumentStatus,
  type HrDocumentTemplate,
  type HrDocumentType,
  type HrEmployee,
  type HrEmployeeDocument,
  type HrEmployeeId,
  type HrEmployeeStatus,
  type HrEmploymentContract,
  type HrAttendanceRecord,
  type HrAttendanceStatus,
  type HrAbsence,
  type HrLeaveBalance,
  type HrLeaveRequest,
  type HrLeaveRequestStatus,
  type HrLeaveType,
  type HrPosition,
  type HrWorkingTimeType
} from "@/modules/hr";

type HrTab = "overview" | "employees" | "departments" | "positions" | "contracts" | "leaves" | "absences" | "attendance" | "documents";
type Notice = { tone: "success" | "error"; message: string };
type HrDialogKey = "employee" | "department" | "position" | "contract" | "leave" | "leaveBalance" | "absence" | "attendance" | "documentType" | "documentTemplate" | "employeeDocument" | "generateDocument" | "uploadDocument";
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
type LeaveBalanceForm = { employeeId: string; leaveTypeId: string; periodYear: string; entitledDays: string; adjustmentDays: string; adjustmentReason: string };
type AbsenceForm = { employeeId: string; startDate: string; endDate: string; type: string; justified: boolean; notes: string };
type AttendanceForm = { employeeId: string; date: string; status: HrAttendanceStatus; note: string };
type DocumentTypeForm = { code: string; name: string; category: string; requiredByDefault: boolean; active: boolean; description: string };
type DocumentTemplateForm = { code: string; name: string; documentTypeId: string; body: string; active: boolean; description: string };
type EmployeeDocumentForm = { employeeId: string; documentTypeId: string; title: string; category: string; status: HrDocumentStatus; required: boolean; expiryDate: string; notes: string };
type GenerateDocumentForm = { employeeId: string; templateId: string; contractId: string; title: string; required: boolean; notes: string };
type UploadDocumentForm = { documentId: string; filename: string; mimeType: string; sizeBytes: string; signedFinal: boolean; notes: string };

const tabs = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "employees", label: "Employés" },
  { id: "departments", label: "Départements" },
  { id: "positions", label: "Postes" },
  { id: "contracts", label: "Contrats" },
  { id: "leaves", label: "Congés" },
  { id: "absences", label: "Absences" },
  { id: "attendance", label: "Présences" },
  { id: "documents", label: "Documents" }
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
const emptyLeaveBalanceForm: LeaveBalanceForm = { employeeId: "", leaveTypeId: "", periodYear: String(new Date().getFullYear()), entitledDays: "18.00", adjustmentDays: "0.00", adjustmentReason: "" };
const emptyAbsenceForm: AbsenceForm = { employeeId: "", startDate: today(), endDate: today(), type: "Absence", justified: false, notes: "" };
const emptyAttendanceForm: AttendanceForm = { employeeId: "", date: today(), status: "present", note: "" };
const emptyDocumentTypeForm: DocumentTypeForm = { code: "", name: "", category: "Autre", requiredByDefault: false, active: true, description: "" };
const emptyDocumentTemplateForm: DocumentTemplateForm = { code: "", name: "", documentTypeId: "", body: "Contrat établi entre {{company.name}} et {{employee.displayName}} pour le poste {{position.name}} à compter du {{contract.startDate}}.", active: true, description: "" };
const emptyEmployeeDocumentForm: EmployeeDocumentForm = { employeeId: "", documentTypeId: "", title: "", category: "Autre", status: "missing", required: true, expiryDate: "", notes: "" };
const emptyGenerateDocumentForm: GenerateDocumentForm = { employeeId: "", templateId: "", contractId: "", title: "", required: true, notes: "" };
const emptyUploadDocumentForm: UploadDocumentForm = { documentId: "", filename: "document.pdf", mimeType: "application/pdf", sizeBytes: "1024", signedFinal: true, notes: "" };
const emptyDialogErrors: Record<HrDialogKey, string | null> = {
  employee: null,
  department: null,
  position: null,
  contract: null,
  leave: null,
  leaveBalance: null,
  absence: null,
  attendance: null,
  documentType: null,
  documentTemplate: null,
  employeeDocument: null,
  generateDocument: null,
  uploadDocument: null
};

export function HrWorkspacePage() {
  const [version, setVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<HrTab>("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<HrEmployeeStatus | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dialogErrors, setDialogErrors] = useState<Record<HrDialogKey, string | null>>(emptyDialogErrors);
  const [saving, setSaving] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveBalanceDialogOpen, setLeaveBalanceDialogOpen] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [documentTypeDialogOpen, setDocumentTypeDialogOpen] = useState(false);
  const [documentTemplateDialogOpen, setDocumentTemplateDialogOpen] = useState(false);
  const [employeeDocumentDialogOpen, setEmployeeDocumentDialogOpen] = useState(false);
  const [generateDocumentDialogOpen, setGenerateDocumentDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<HrEmployee | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<HrDepartment | null>(null);
  const [editingPosition, setEditingPosition] = useState<HrPosition | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(emptyEmployeeForm);
  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>(emptyDepartmentForm);
  const [positionForm, setPositionForm] = useState<PositionForm>(emptyPositionForm);
  const [contractForm, setContractForm] = useState<ContractForm>(emptyContractForm);
  const [leaveForm, setLeaveForm] = useState<LeaveForm>(emptyLeaveForm);
  const [leaveBalanceForm, setLeaveBalanceForm] = useState<LeaveBalanceForm>(emptyLeaveBalanceForm);
  const [absenceForm, setAbsenceForm] = useState<AbsenceForm>(emptyAbsenceForm);
  const [attendanceForm, setAttendanceForm] = useState<AttendanceForm>(emptyAttendanceForm);
  const [documentTypeForm, setDocumentTypeForm] = useState<DocumentTypeForm>(emptyDocumentTypeForm);
  const [documentTemplateForm, setDocumentTemplateForm] = useState<DocumentTemplateForm>(emptyDocumentTemplateForm);
  const [employeeDocumentForm, setEmployeeDocumentForm] = useState<EmployeeDocumentForm>(emptyEmployeeDocumentForm);
  const [generateDocumentForm, setGenerateDocumentForm] = useState<GenerateDocumentForm>(emptyGenerateDocumentForm);
  const [uploadDocumentForm, setUploadDocumentForm] = useState<UploadDocumentForm>(emptyUploadDocumentForm);
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

  function clearDialogError(dialog: HrDialogKey) {
    setDialogErrors((current) => current[dialog] ? { ...current, [dialog]: null } : current);
  }

  function setDialogError(dialog: HrDialogKey, error: unknown, fallback: string) {
    setDialogErrors((current) => ({ ...current, [dialog]: error instanceof Error ? error.message : fallback }));
  }

  function openEmployee(employee?: HrEmployee) {
    setEditingEmployee(employee ?? null);
    setEmployeeForm(employee ? employeeToForm(employee) : { ...emptyEmployeeForm, employeeNumber: nextEmployeeNumber(snapshot.employees), hireDate: today() });
    setEmployeeDialogOpen(true);
    clearDialogError("employee");
    setNotice(null);
  }

  function openDepartment(department?: HrDepartment) {
    setEditingDepartment(department ?? null);
    setDepartmentForm(department ? departmentToForm(department) : emptyDepartmentForm);
    setDepartmentDialogOpen(true);
    clearDialogError("department");
    setNotice(null);
  }

  function openPosition(position?: HrPosition) {
    setEditingPosition(position ?? null);
    setPositionForm(position ? positionToForm(position) : emptyPositionForm);
    setPositionDialogOpen(true);
    clearDialogError("position");
    setNotice(null);
  }

  function openContract(employeeId?: HrEmployeeId) {
    const employee = employeeId ? employeeById.get(employeeId) : undefined;
    const position = employee?.positionId ? positionById.get(employee.positionId) : undefined;
    setContractForm({ ...emptyContractForm, employeeId: employeeId ?? "", positionId: employee?.positionId ?? "", jobTitle: position?.name ?? "", startDate: today() });
    setContractDialogOpen(true);
    clearDialogError("contract");
    setNotice(null);
  }

  function openLeave(employeeId?: HrEmployeeId) {
    setLeaveForm({ ...emptyLeaveForm, employeeId: employeeId ?? "", startDate: today(), endDate: today() });
    setLeaveDialogOpen(true);
    clearDialogError("leave");
    setNotice(null);
  }

  function openLeaveBalance(employeeId?: HrEmployeeId) {
    setLeaveBalanceForm({ ...emptyLeaveBalanceForm, employeeId: employeeId ?? "", leaveTypeId: snapshot.leaveTypes[0]?.id ?? "" });
    setLeaveBalanceDialogOpen(true);
    clearDialogError("leaveBalance");
    setNotice(null);
  }

  function openAbsence(employeeId?: HrEmployeeId) {
    setAbsenceForm({ ...emptyAbsenceForm, employeeId: employeeId ?? "", startDate: today(), endDate: today() });
    setAbsenceDialogOpen(true);
    clearDialogError("absence");
    setNotice(null);
  }

  function openAttendance(employeeId?: HrEmployeeId) {
    setAttendanceForm({ ...emptyAttendanceForm, employeeId: employeeId ?? "", date: today() });
    setAttendanceDialogOpen(true);
    clearDialogError("attendance");
    setNotice(null);
  }

  function openDocumentType() {
    setDocumentTypeForm(emptyDocumentTypeForm);
    setDocumentTypeDialogOpen(true);
    clearDialogError("documentType");
    setNotice(null);
  }

  function openDocumentTemplate() {
    setDocumentTemplateForm({ ...emptyDocumentTemplateForm, documentTypeId: snapshot.documentTypes[0]?.id ?? "" });
    setDocumentTemplateDialogOpen(true);
    clearDialogError("documentTemplate");
    setNotice(null);
  }

  function openEmployeeDocument(employeeId?: HrEmployeeId) {
    const type = snapshot.documentTypes[0];
    setEmployeeDocumentForm({ ...emptyEmployeeDocumentForm, employeeId: employeeId ?? "", documentTypeId: type?.id ?? "", title: type?.name ?? "", category: type?.category ?? "Autre", required: type?.requiredByDefault ?? true });
    setEmployeeDocumentDialogOpen(true);
    clearDialogError("employeeDocument");
    setNotice(null);
  }

  function openGenerateDocument(employeeId?: HrEmployeeId) {
    const employeeContracts = snapshot.contracts.filter((contract) => !employeeId || contract.employeeId === employeeId);
    setGenerateDocumentForm({ ...emptyGenerateDocumentForm, employeeId: employeeId ?? "", templateId: snapshot.documentTemplates[0]?.id ?? "", contractId: employeeContracts[0]?.id ?? "" });
    setGenerateDocumentDialogOpen(true);
    clearDialogError("generateDocument");
    setNotice(null);
  }

  function openUploadDocument(document?: HrEmployeeDocument) {
    setUploadDocumentForm({ ...emptyUploadDocumentForm, documentId: document?.id ?? "" });
    setUploadDocumentDialogOpen(true);
    clearDialogError("uploadDocument");
    setNotice(null);
  }

  async function saveEmployee() {
    setSaving(true);
    setNotice(null);
    clearDialogError("employee");
    try {
      const result = editingEmployee
        ? hrLocalService.updateEmployee(employeeFormToUpdate(editingEmployee, employeeForm))
        : hrLocalService.createEmployee(employeeFormToCreate(employeeForm));
      if (!result.employee) throw new Error(result.error ?? "Employé non enregistré.");
      await persistHrRecord("employee", result.employee);
      setSelectedEmployeeId(result.employee.id);
      setEmployeeDialogOpen(false);
      clearDialogError("employee");
      setNotice({ tone: "success", message: editingEmployee ? "Employé enregistré." : "Employé créé." });
      return true;
    } catch (error) {
      setDialogError("employee", error, "Employé non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveDepartment() {
    setSaving(true);
    setNotice(null);
    clearDialogError("department");
    try {
      const result = editingDepartment
        ? hrLocalService.updateDepartment({ id: editingDepartment.id, ...departmentForm, managerId: optionalId(departmentForm.managerId) as never })
        : hrLocalService.createDepartment({ ...departmentForm, managerId: optionalId(departmentForm.managerId) as never });
      if (!result.department) throw new Error(result.error ?? "Département non enregistré.");
      await persistHrRecord("department", result.department);
      setDepartmentDialogOpen(false);
      clearDialogError("department");
      setNotice({ tone: "success", message: editingDepartment ? "Département enregistré." : "Département créé." });
      return true;
    } catch (error) {
      setDialogError("department", error, "Département non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function savePosition() {
    setSaving(true);
    setNotice(null);
    clearDialogError("position");
    try {
      const result = editingPosition
        ? hrLocalService.updatePosition({ id: editingPosition.id, ...positionForm, departmentId: optionalId(positionForm.departmentId) as never })
        : hrLocalService.createPosition({ ...positionForm, departmentId: optionalId(positionForm.departmentId) as never });
      if (!result.position) throw new Error(result.error ?? "Poste non enregistré.");
      await persistHrRecord("position", result.position);
      setPositionDialogOpen(false);
      clearDialogError("position");
      setNotice({ tone: "success", message: editingPosition ? "Poste enregistré." : "Poste créé." });
      return true;
    } catch (error) {
      setDialogError("position", error, "Poste non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveContract() {
    setSaving(true);
    setNotice(null);
    clearDialogError("contract");
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
      clearDialogError("contract");
      setNotice({ tone: "success", message: "Contrat créé." });
      return true;
    } catch (error) {
      setDialogError("contract", error, "Contrat non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveLeave() {
    setSaving(true);
    setNotice(null);
    clearDialogError("leave");
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
      clearDialogError("leave");
      setNotice({ tone: "success", message: "Demande de congé créée." });
      return true;
    } catch (error) {
      setDialogError("leave", error, "Demande de congé non enregistrée.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveLeaveBalance() {
    setSaving(true);
    setNotice(null);
    clearDialogError("leaveBalance");
    try {
      await ensureDefaultLeaveType();
      const leaveTypeId = leaveBalanceForm.leaveTypeId || hrLocalService.listLeaveTypes().leaveTypes[0]?.id;
      const result = hrLocalService.createLeaveBalance({
        employeeId: leaveBalanceForm.employeeId as never,
        leaveTypeId: leaveTypeId as never,
        periodYear: Number(leaveBalanceForm.periodYear),
        entitledDays: leaveBalanceForm.entitledDays,
        adjustmentDays: leaveBalanceForm.adjustmentDays,
        adjustmentReason: leaveBalanceForm.adjustmentReason
      });
      if (!result.leaveBalance) throw new Error(result.error ?? "Droit de congé non enregistré.");
      await persistHrRecord("leaveBalance", result.leaveBalance);
      setLeaveBalanceDialogOpen(false);
      clearDialogError("leaveBalance");
      setNotice({ tone: "success", message: "Droit de congé enregistré." });
      return true;
    } catch (error) {
      setDialogError("leaveBalance", error, "Droit de congé non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAbsence() {
    setSaving(true);
    setNotice(null);
    clearDialogError("absence");
    try {
      const result = hrLocalService.createAbsence({
        employeeId: absenceForm.employeeId as never,
        startDate: new Date(absenceForm.startDate || today()).toISOString(),
        endDate: new Date(absenceForm.endDate || today()).toISOString(),
        type: absenceForm.type,
        source: "manual",
        justified: absenceForm.justified,
        notes: absenceForm.notes
      });
      if (!result.absence) throw new Error(result.error ?? "Absence non enregistrée.");
      await persistHrRecord("absence", result.absence);
      setAbsenceDialogOpen(false);
      clearDialogError("absence");
      setNotice({ tone: "success", message: "Absence enregistrée." });
      return true;
    } catch (error) {
      setDialogError("absence", error, "Absence non enregistrée.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAttendance() {
    setSaving(true);
    setNotice(null);
    clearDialogError("attendance");
    try {
      const result = hrLocalService.createAttendanceRecord({
        employeeId: attendanceForm.employeeId as never,
        date: new Date(attendanceForm.date || today()).toISOString(),
        status: attendanceForm.status,
        note: attendanceForm.note
      });
      if (!result.attendanceRecord) throw new Error(result.error ?? "Présence non enregistrée.");
      await persistHrRecord("attendanceRecord", result.attendanceRecord);
      setAttendanceDialogOpen(false);
      clearDialogError("attendance");
      setNotice({ tone: "success", message: "Présence enregistrée." });
      return true;
    } catch (error) {
      setDialogError("attendance", error, "Présence non enregistrée.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveDocumentType() {
    setSaving(true);
    setNotice(null);
    clearDialogError("documentType");
    try {
      const result = hrLocalService.createDocumentType(documentTypeForm);
      if (!result.documentType) throw new Error(result.error ?? "Type de document non enregistré.");
      await persistHrRecord("documentType", result.documentType);
      setDocumentTypeDialogOpen(false);
      setNotice({ tone: "success", message: "Type de document créé." });
      return true;
    } catch (error) {
      setDialogError("documentType", error, "Type de document non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveDocumentTemplate() {
    setSaving(true);
    setNotice(null);
    clearDialogError("documentTemplate");
    try {
      const result = hrLocalService.createDocumentTemplate({ ...documentTemplateForm, documentTypeId: optionalId(documentTemplateForm.documentTypeId) as never, templateFormat: "plain_text" });
      if (!result.documentTemplate) throw new Error(result.error ?? "Modèle RH non enregistré.");
      await persistHrRecord("documentTemplate", result.documentTemplate);
      setDocumentTemplateDialogOpen(false);
      setNotice({ tone: "success", message: "Modèle RH créé." });
      return true;
    } catch (error) {
      setDialogError("documentTemplate", error, "Modèle RH non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveEmployeeDocument() {
    setSaving(true);
    setNotice(null);
    clearDialogError("employeeDocument");
    try {
      const type = snapshot.documentTypes.find((item) => item.id === employeeDocumentForm.documentTypeId);
      const result = hrLocalService.createEmployeeDocument({
        employeeId: employeeDocumentForm.employeeId as never,
        documentTypeId: optionalId(employeeDocumentForm.documentTypeId) as never,
        title: employeeDocumentForm.title || type?.name || "Document RH",
        category: employeeDocumentForm.category || type?.category || "Autre",
        status: employeeDocumentForm.status,
        source: "manual",
        required: employeeDocumentForm.required,
        expiryDate: employeeDocumentForm.expiryDate ? new Date(employeeDocumentForm.expiryDate).toISOString() : undefined,
        notes: employeeDocumentForm.notes
      });
      if (!result.employeeDocument) throw new Error(result.error ?? "Document employé non enregistré.");
      await persistHrRecord("employeeDocument", result.employeeDocument);
      setEmployeeDocumentDialogOpen(false);
      setNotice({ tone: "success", message: "Document requis ajouté." });
      return true;
    } catch (error) {
      setDialogError("employeeDocument", error, "Document employé non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveGeneratedDocument() {
    setSaving(true);
    setNotice(null);
    clearDialogError("generateDocument");
    try {
      const result = hrLocalService.generateEmployeeDocument({
        employeeId: generateDocumentForm.employeeId as never,
        templateId: generateDocumentForm.templateId as never,
        contractId: optionalId(generateDocumentForm.contractId) as never,
        title: generateDocumentForm.title,
        required: generateDocumentForm.required,
        notes: generateDocumentForm.notes,
        company: { name: "HICOTECH" }
      });
      if (!result.employeeDocument) throw new Error(result.error ?? "Document non généré.");
      await persistHrRecord("employeeDocument", result.employeeDocument);
      setGenerateDocumentDialogOpen(false);
      setNotice({ tone: "success", message: "Document généré." });
      return true;
    } catch (error) {
      setDialogError("generateDocument", error, "Document non généré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveUploadedDocument() {
    setSaving(true);
    setNotice(null);
    clearDialogError("uploadDocument");
    try {
      const result = hrLocalService.uploadEmployeeDocument({
        id: uploadDocumentForm.documentId as never,
        filename: uploadDocumentForm.filename,
        mimeType: uploadDocumentForm.mimeType,
        sizeBytes: Number(uploadDocumentForm.sizeBytes),
        signedFinal: uploadDocumentForm.signedFinal,
        notes: uploadDocumentForm.notes
      });
      if (!result.employeeDocument) throw new Error(result.error ?? "Fichier final non enregistré.");
      await persistHrRecord("employeeDocument", result.employeeDocument);
      setUploadDocumentDialogOpen(false);
      setNotice({ tone: "success", message: "Version finale enregistrée." });
      return true;
    } catch (error) {
      setDialogError("uploadDocument", error, "Fichier final non enregistré.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function decideLeave(leave: HrLeaveRequest, status: "approved" | "rejected" | "cancelled") {
    const result = status === "approved" ? hrLocalService.approveLeaveRequest(leave.id) : status === "rejected" ? hrLocalService.rejectLeaveRequest(leave.id) : hrLocalService.cancelLeaveRequest(leave.id);
    if (!result.leaveRequest) {
      setNotice({ tone: "error", message: result.error ?? "Décision impossible." });
      return;
    }
    try {
      await persistHrRecord("leaveRequest", result.leaveRequest);
      setNotice({ tone: "success", message: "Demande mise à jour." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Décision impossible." });
    }
  }

  async function ensureDefaultLeaveType() {
    if (hrLocalService.listLeaveTypes().leaveTypes.length > 0) return;
    const result = hrLocalService.createLeaveType({ code: "CP", name: "Congé payé", paid: true, approvalRequired: true, balanceTracked: true, defaultAnnualEntitlement: "18.00", active: true });
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
      {activeTab === "leaves" && <LeavesSection balances={snapshot.leaveBalances} leaves={snapshot.leaveRequests} employees={employeeById} leaveTypes={new Map(snapshot.leaveTypes.map((type) => [type.id, type]))} onCreate={() => openLeave(selectedEmployee?.id)} onBalance={() => openLeaveBalance(selectedEmployee?.id)} onApprove={(leave) => void decideLeave(leave, "approved")} onReject={(leave) => void decideLeave(leave, "rejected")} onCancel={(leave) => void decideLeave(leave, "cancelled")} />}
      {activeTab === "absences" && <AbsencesSection absences={hrLocalService.listOperationalAbsences().absences} employees={employeeById} onCreate={() => openAbsence(selectedEmployee?.id)} />}
      {activeTab === "attendance" && <AttendanceSection records={snapshot.attendanceRecords} employees={employeeById} onCreate={() => openAttendance(selectedEmployee?.id)} />}
      {activeTab === "documents" && <DocumentsSection documents={snapshot.employeeDocuments} documentTypes={snapshot.documentTypes} employees={employeeById} templates={snapshot.documentTemplates} onCreateType={openDocumentType} onCreateTemplate={openDocumentTemplate} onGenerate={() => openGenerateDocument(selectedEmployee?.id)} onRequire={() => openEmployeeDocument(selectedEmployee?.id)} onUpload={openUploadDocument} />}

      {selectedEmployee && <EmployeeDetail employee={selectedEmployee} departments={departmentById} positions={positionById} managers={employeeById} contracts={snapshot.contracts.filter((contract) => contract.employeeId === selectedEmployee.id)} leaves={snapshot.leaveRequests.filter((leave) => leave.employeeId === selectedEmployee.id)} operational={hrLocalService.getEmployeeOperationalSummary(selectedEmployee.id)} onEdit={() => openEmployee(selectedEmployee)} />}

      <EmployeeDialog departments={snapshot.departments} editing={Boolean(editingEmployee)} employees={snapshot.employees} error={dialogErrors.employee} form={employeeForm} onChange={(form) => { clearDialogError("employee"); setEmployeeForm(form); }} onClose={() => setEmployeeDialogOpen(false)} onSubmit={saveEmployee} open={employeeDialogOpen} positions={snapshot.positions} saving={saving} />
      <DepartmentDialog employees={snapshot.employees} editing={Boolean(editingDepartment)} error={dialogErrors.department} form={departmentForm} onChange={(form) => { clearDialogError("department"); setDepartmentForm(form); }} onClose={() => setDepartmentDialogOpen(false)} onSubmit={saveDepartment} open={departmentDialogOpen} saving={saving} />
      <PositionDialog departments={snapshot.departments} editing={Boolean(editingPosition)} error={dialogErrors.position} form={positionForm} onChange={(form) => { clearDialogError("position"); setPositionForm(form); }} onClose={() => setPositionDialogOpen(false)} onSubmit={savePosition} open={positionDialogOpen} saving={saving} />
      <ContractDialog employees={snapshot.employees} error={dialogErrors.contract} form={contractForm} onChange={(form) => { clearDialogError("contract"); setContractForm(form); }} onClose={() => setContractDialogOpen(false)} onSubmit={saveContract} open={contractDialogOpen} positions={snapshot.positions} saving={saving} />
      <LeaveDialog employees={snapshot.employees} error={dialogErrors.leave} form={leaveForm} leaveTypes={snapshot.leaveTypes} onChange={(form) => { clearDialogError("leave"); setLeaveForm(form); }} onClose={() => setLeaveDialogOpen(false)} onSubmit={saveLeave} open={leaveDialogOpen} saving={saving} />
      <LeaveBalanceDialog employees={snapshot.employees} error={dialogErrors.leaveBalance} form={leaveBalanceForm} leaveTypes={snapshot.leaveTypes} onChange={(form) => { clearDialogError("leaveBalance"); setLeaveBalanceForm(form); }} onClose={() => setLeaveBalanceDialogOpen(false)} onSubmit={saveLeaveBalance} open={leaveBalanceDialogOpen} saving={saving} />
      <AbsenceDialog employees={snapshot.employees} error={dialogErrors.absence} form={absenceForm} onChange={(form) => { clearDialogError("absence"); setAbsenceForm(form); }} onClose={() => setAbsenceDialogOpen(false)} onSubmit={saveAbsence} open={absenceDialogOpen} saving={saving} />
      <AttendanceDialog employees={snapshot.employees} error={dialogErrors.attendance} form={attendanceForm} onChange={(form) => { clearDialogError("attendance"); setAttendanceForm(form); }} onClose={() => setAttendanceDialogOpen(false)} onSubmit={saveAttendance} open={attendanceDialogOpen} saving={saving} />
      <DocumentTypeDialog error={dialogErrors.documentType} form={documentTypeForm} onChange={(form) => { clearDialogError("documentType"); setDocumentTypeForm(form); }} onClose={() => setDocumentTypeDialogOpen(false)} onSubmit={saveDocumentType} open={documentTypeDialogOpen} saving={saving} />
      <DocumentTemplateDialog documentTypes={snapshot.documentTypes} error={dialogErrors.documentTemplate} form={documentTemplateForm} onChange={(form) => { clearDialogError("documentTemplate"); setDocumentTemplateForm(form); }} onClose={() => setDocumentTemplateDialogOpen(false)} onSubmit={saveDocumentTemplate} open={documentTemplateDialogOpen} saving={saving} />
      <EmployeeDocumentDialog documentTypes={snapshot.documentTypes} employees={snapshot.employees} error={dialogErrors.employeeDocument} form={employeeDocumentForm} onChange={(form) => { clearDialogError("employeeDocument"); setEmployeeDocumentForm(form); }} onClose={() => setEmployeeDocumentDialogOpen(false)} onSubmit={saveEmployeeDocument} open={employeeDocumentDialogOpen} saving={saving} />
      <GenerateDocumentDialog contracts={snapshot.contracts} employees={snapshot.employees} error={dialogErrors.generateDocument} form={generateDocumentForm} onChange={(form) => { clearDialogError("generateDocument"); setGenerateDocumentForm(form); }} onClose={() => setGenerateDocumentDialogOpen(false)} onSubmit={saveGeneratedDocument} open={generateDocumentDialogOpen} saving={saving} templates={snapshot.documentTemplates} />
      <UploadDocumentDialog documents={snapshot.employeeDocuments} error={dialogErrors.uploadDocument} form={uploadDocumentForm} onChange={(form) => { clearDialogError("uploadDocument"); setUploadDocumentForm(form); }} onClose={() => setUploadDocumentDialogOpen(false)} onSubmit={saveUploadedDocument} open={uploadDocumentDialogOpen} saving={saving} />
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
      <MetricCard icon={UserRoundCheck} label="État du jour" value={String(summary.employeesOnLeaveToday)} helper={`${summary.absencesToday} absence(s), ${summary.attendanceRecordedToday} présence(s)`} />
      <div className="md:col-span-2 xl:col-span-6">
        <CalendarAgenda items={hrLocalService.listCalendarItems(today(), addDays(today(), 14))} employees={new Map(employees.map((employee) => [employee.id, employee]))} />
      </div>
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

function LeavesSection({ balances, employees, leaveTypes, leaves, onApprove, onBalance, onCancel, onCreate, onReject }: { balances: readonly HrLeaveBalance[]; employees: Map<string, HrEmployee>; leaveTypes: Map<string, HrLeaveType>; leaves: readonly HrLeaveRequest[]; onApprove: (leave: HrLeaveRequest) => void; onBalance: () => void; onCancel: (leave: HrLeaveRequest) => void; onCreate: () => void; onReject: (leave: HrLeaveRequest) => void }) {
  const projections = hrLocalService.listLeaveBalanceProjections().leaveBalances;
  return (
    <SectionCard className="mt-4 overflow-hidden">
      <Toolbar title="Congés" actionLabel="Nouvelle demande" onAction={onCreate}><button type="button" onClick={onBalance} className={secondaryButtonClassName}><Plus size={15} /> Droit annuel</button></Toolbar>
      <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3 dark:border-hicotech-dark-border">
        {projections.slice(0, 6).map((balance) => (
          <Info key={`${balance.employeeId}-${balance.leaveTypeId}-${balance.periodYear}`} label={`${employees.get(balance.employeeId)?.displayName ?? "Employé"} · ${leaveTypes.get(balance.leaveTypeId)?.name ?? "Congé"}`} value={`${balance.remainingDays} j restants · ${balance.pendingDays} j en attente`} />
        ))}
        {balances.length === 0 && <p className="text-sm font-semibold text-slate-500">Aucun droit configuré. Ajoutez un droit annuel pour suivre les soldes.</p>}
      </div>
      <TableShell isEmpty={leaves.length === 0} emptyMessage="Aucune demande de congé.">
        <thead className={tableHeadClassName}><tr><th>Employé</th><th>Type</th><th>Début</th><th>Fin</th><th>Statut</th><th>Motif</th><th className="text-right">Décision</th></tr></thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id} className={rowClassName}>
              <td>{employees.get(leave.employeeId)?.displayName ?? "-"}</td><td>{leaveTypes.get(leave.leaveTypeId ?? "")?.name ?? "Congé"}</td><td>{formatDate(leave.startDate)}</td><td>{formatDate(leave.endDate)}</td><td>{HR_LEAVE_REQUEST_STATUS_LABELS[leave.status]}</td><td>{leave.reason || "-"}</td>
              <td className="text-right"><div className="flex justify-end gap-2">{leave.status === "requested" && <><SmallButton label="Approuver" onClick={() => onApprove(leave)} /><SmallButton label="Refuser" onClick={() => onReject(leave)} /></>}{["requested", "approved"].includes(leave.status) && <SmallButton label="Annuler" onClick={() => onCancel(leave)} />}</div></td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </SectionCard>
  );
}

function AbsencesSection({ absences, employees, onCreate }: { absences: readonly HrAbsence[]; employees: Map<string, HrEmployee>; onCreate: () => void }) {
  return (
    <SimpleCardTable title="Absences" actionLabel="Nouvelle absence" empty="Aucune absence." onAction={onCreate} headers={["Employé", "Début", "Fin", "Type", "Source", "Justifiée"]}>
      {absences.map((absence) => (
        <tr key={absence.id} className={rowClassName}>
          <td>{employees.get(absence.employeeId)?.displayName ?? "-"}</td><td>{formatDate(absence.startDate)}</td><td>{formatDate(absence.endDate)}</td><td>{absence.type}</td><td>{absence.source === "leave" ? "Congé approuvé" : "Manuelle"}</td><td>{absence.justified ? "Oui" : "Non"}</td>
        </tr>
      ))}
    </SimpleCardTable>
  );
}

function AttendanceSection({ employees, onCreate, records }: { employees: Map<string, HrEmployee>; onCreate: () => void; records: readonly HrAttendanceRecord[] }) {
  return (
    <SimpleCardTable title="Présences" actionLabel="Déclarer présence" empty="Aucune présence déclarée." onAction={onCreate} headers={["Employé", "Date", "Statut", "Note"]}>
      {records.map((record) => (
        <tr key={record.id} className={rowClassName}>
          <td>{employees.get(record.employeeId)?.displayName ?? "-"}</td><td>{formatDate(record.date)}</td><td>{HR_ATTENDANCE_STATUS_LABELS[record.status]}</td><td>{record.note || "-"}</td>
        </tr>
      ))}
    </SimpleCardTable>
  );
}

function DocumentsSection({ documents, documentTypes, employees, onCreateTemplate, onCreateType, onGenerate, onRequire, onUpload, templates }: { documents: readonly HrEmployeeDocument[]; documentTypes: readonly HrDocumentType[]; employees: Map<string, HrEmployee>; onCreateTemplate: () => void; onCreateType: () => void; onGenerate: () => void; onRequire: () => void; onUpload: (document: HrEmployeeDocument) => void; templates: readonly HrDocumentTemplate[] }) {
  const selectedEmployee = [...employees.values()][0];
  const dossier = selectedEmployee ? hrLocalService.getEmployeeDossierSummary(selectedEmployee.id) : undefined;
  return (
    <SectionCard className="mt-4 overflow-hidden">
      <Toolbar title="Dossier administratif" actionLabel="Générer document" onAction={onGenerate}>
        <button type="button" onClick={onRequire} className={secondaryButtonClassName}><Plus size={15} /> Document requis</button>
        <button type="button" onClick={onCreateTemplate} className={secondaryButtonClassName}><Plus size={15} /> Modèle RH</button>
        <button type="button" onClick={onCreateType} className={secondaryButtonClassName}><Plus size={15} /> Type</button>
      </Toolbar>
      <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-4 dark:border-hicotech-dark-border">
        <Info label="Types actifs" value={String(documentTypes.filter((type) => type.active).length)} />
        <Info label="Modèles actifs" value={String(templates.filter((template) => template.active).length)} />
        <Info label="Documents requis" value={String(dossier?.requiredDocuments ?? documents.filter((document) => document.required).length)} />
        <Info label="Complétude dossier" value={dossier ? `${dossier.completionPercent}%` : "0%"} />
      </div>
      <TableShell isEmpty={documents.length === 0} emptyMessage="Aucun document RH. Ajoutez un type, un modèle ou un document requis.">
        <thead className={tableHeadClassName}><tr><th>Employé</th><th>Document</th><th>Catégorie</th><th>Statut</th><th>Échéance</th><th>Référence</th><th className="text-right">Action</th></tr></thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className={rowClassName}>
              <td>{employees.get(document.employeeId)?.displayName ?? "-"}</td>
              <td>{document.title}{document.required ? <span className="ml-2 text-xs font-black text-hicotech-blue">Requis</span> : null}</td>
              <td>{document.category}</td>
              <td>{HR_DOCUMENT_STATUS_LABELS[document.status]}</td>
              <td>{document.expiryDate ? formatDate(document.expiryDate) : "-"}</td>
              <td>{document.storageFilename ?? document.generatedFromTemplateName ?? "-"}</td>
              <td className="text-right"><SmallButton label="Finaliser" onClick={() => onUpload(document)} /></td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </SectionCard>
  );
}

function CalendarAgenda({ employees, items }: { employees: Map<string, HrEmployee>; items: readonly { id: string; employeeId: HrEmployeeId; date: string; label: string; status: string; kind: string }[] }) {
  return (
    <SectionCard className="p-4">
      <h2 className="font-display text-lg font-black text-hicotech-navy dark:text-white">Agenda RH</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 12).map((item) => <Info key={item.id} label={formatDate(item.date)} value={`${employees.get(item.employeeId)?.displayName ?? "-"} · ${item.label}`} />)}
        {items.length === 0 && <p className="text-sm font-semibold text-slate-500">Aucun congé ou absence sur la période affichée.</p>}
      </div>
    </SectionCard>
  );
}

function EmployeeDetail({ contracts, departments, employee, leaves, managers, onEdit, operational, positions }: { contracts: readonly HrEmploymentContract[]; departments: Map<string, HrDepartment>; employee: HrEmployee; leaves: readonly HrLeaveRequest[]; managers: Map<string, HrEmployee>; operational: ReturnType<typeof hrLocalService.getEmployeeOperationalSummary>; onEdit: () => void; positions: Map<string, HrPosition> }) {
  const dossier = hrLocalService.getEmployeeDossierSummary(employee.id);
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
        <Info label="État du jour" value={HR_WORKFORCE_STATE_LABELS[operational.workforceState]} />
        <Info label="Solde congé" value={operational.leaveBalances[0]?.remainingDays ? `${operational.leaveBalances[0].remainingDays} j` : "-"} />
        <Info label="Email" value={employee.email || "-"} />
        <Info label="Téléphone" value={employee.phone || "-"} />
        <Info label="Congés" value={String(leaves.length)} />
        <Info label="Dossier administratif" value={`${dossier.completionPercent}% · ${dossier.missingDocuments} manquant(s)`} />
        <Info label="Notes" value={employee.notes || "-"} />
      </div>
    </SectionCard>
  );
}

function EmployeeDialog({ departments, editing, employees, error, form, onChange, onClose, onSubmit, open, positions, saving }: { departments: readonly HrDepartment[]; editing: boolean; employees: readonly HrEmployee[]; error?: string | null; form: EmployeeForm; onChange: (form: EmployeeForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; positions: readonly HrPosition[]; saving: boolean }) {
  const update = (key: keyof EmployeeForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <EntityDialog open={open} error={error} eyebrow="RH" title={editing ? "Modifier l'employé" : "Nouvel employé"} description="Un employé RH peut exister sans compte utilisateur BOSIACO." onClose={onClose} onSubmit={onSubmit} size="lg" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel={editing ? "Enregistrer" : "Créer l'employé"} />}>
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

function DepartmentDialog({ editing, employees, error, form, onChange, onClose, onSubmit, open, saving }: { editing: boolean; employees: readonly HrEmployee[]; error?: string | null; form: DepartmentForm; onChange: (form: DepartmentForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title={editing ? "Modifier le département" : "Nouveau département"} description="Structure simple utilisée pour classer les collaborateurs." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Enregistrer" />}>
    <FormSection title="Département"><FormField label="Code"><input className={entityInputClassName} value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} /></FormField><FormField label="Nom" required><input className={entityInputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></FormField><FormField label="Manager"><Select value={form.managerId} onChange={(managerId) => onChange({ ...form, managerId })} placeholder="Aucun manager" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Description"><textarea className={entityInputClassName} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function PositionDialog({ departments, editing, error, form, onChange, onClose, onSubmit, open, saving }: { departments: readonly HrDepartment[]; editing: boolean; error?: string | null; form: PositionForm; onChange: (form: PositionForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title={editing ? "Modifier le poste" : "Nouveau poste"} description="Intitulé de poste réutilisable dans les fiches employés et contrats." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Enregistrer" />}>
    <FormSection title="Poste"><FormField label="Code"><input className={entityInputClassName} value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} /></FormField><FormField label="Nom" required><input className={entityInputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></FormField><FormField label="Département"><Select value={form.departmentId} onChange={(departmentId) => onChange({ ...form, departmentId })} placeholder="Aucun département" options={departments.map((department) => [department.id, department.name])} /></FormField><FormField label="Description"><textarea className={entityInputClassName} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function ContractDialog({ employees, error, form, onChange, onClose, onSubmit, open, positions, saving }: { employees: readonly HrEmployee[]; error?: string | null; form: ContractForm; onChange: (form: ContractForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; positions: readonly HrPosition[]; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Nouveau contrat" description="Fondation contractuelle sans calcul de paie." onClose={onClose} onSubmit={onSubmit} size="lg" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Créer le contrat" />}>
    <FormSection title="Contrat"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Type"><Select value={form.contractType} onChange={(contractType) => onChange({ ...form, contractType: contractType as HrContractType })} options={Object.entries(HR_CONTRACT_TYPE_LABELS)} /></FormField><FormField label="Poste"><Select value={form.positionId} onChange={(positionId) => onChange({ ...form, positionId, jobTitle: positions.find((position) => position.id === positionId)?.name ?? form.jobTitle })} placeholder="Aucun poste" options={positions.map((position) => [position.id, position.name])} /></FormField><FormField label="Intitulé" required><input className={entityInputClassName} value={form.jobTitle} onChange={(event) => onChange({ ...form, jobTitle: event.target.value })} /></FormField><FormField label="Début" required><input type="date" className={entityInputClassName} value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} /></FormField><FormField label="Fin"><input type="date" className={entityInputClassName} value={form.endDate} onChange={(event) => onChange({ ...form, endDate: event.target.value })} /></FormField><FormField label="Temps de travail"><Select value={form.workingTimeType} onChange={(workingTimeType) => onChange({ ...form, workingTimeType: workingTimeType as HrWorkingTimeType })} options={Object.entries(HR_WORKING_TIME_TYPE_LABELS)} /></FormField><FormField label="Notes"><textarea className={entityInputClassName} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} rows={3} /></FormField></FormSection>
  </EntityDialog>;
}

function LeaveDialog({ employees, error, form, leaveTypes, onChange, onClose, onSubmit, open, saving }: { employees: readonly HrEmployee[]; error?: string | null; form: LeaveForm; leaveTypes: readonly HrLeaveType[]; onChange: (form: LeaveForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Nouvelle demande de congé" description="Fondation simple sans calcul automatique de droits." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Créer la demande" />}>
    <FormSection title="Demande"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Type"><Select value={form.leaveTypeId} onChange={(leaveTypeId) => onChange({ ...form, leaveTypeId })} placeholder="Congé payé par défaut" options={leaveTypes.map((type) => [type.id, type.name])} /></FormField><FormField label="Titre"><input className={entityInputClassName} value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} /></FormField><FormField label="Statut"><Select value={form.status} onChange={(status) => onChange({ ...form, status: status as HrLeaveRequestStatus })} options={Object.entries(HR_LEAVE_REQUEST_STATUS_LABELS)} /></FormField><FormField label="Début" required><input type="date" className={entityInputClassName} value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} /></FormField><FormField label="Fin" required><input type="date" className={entityInputClassName} value={form.endDate} onChange={(event) => onChange({ ...form, endDate: event.target.value })} /></FormField><FormField label="Motif"><textarea className={entityInputClassName} value={form.reason} onChange={(event) => onChange({ ...form, reason: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function LeaveBalanceDialog({ employees, error, form, leaveTypes, onChange, onClose, onSubmit, open, saving }: { employees: readonly HrEmployee[]; error?: string | null; form: LeaveBalanceForm; leaveTypes: readonly HrLeaveType[]; onChange: (form: LeaveBalanceForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Droit annuel de congé" description="Droit manuel Alpha. Le restant est recalculé depuis les demandes approuvées." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Enregistrer le droit" />}>
    <FormSection title="Solde"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Type" required><Select value={form.leaveTypeId} onChange={(leaveTypeId) => onChange({ ...form, leaveTypeId })} placeholder="Choisir un type" options={leaveTypes.map((type) => [type.id, type.name])} /></FormField><FormField label="Année" required><input className={entityInputClassName} value={form.periodYear} onChange={(event) => onChange({ ...form, periodYear: event.target.value })} /></FormField><FormField label="Droit"><input className={entityInputClassName} value={form.entitledDays} onChange={(event) => onChange({ ...form, entitledDays: event.target.value })} /></FormField><FormField label="Ajustement"><input className={entityInputClassName} value={form.adjustmentDays} onChange={(event) => onChange({ ...form, adjustmentDays: event.target.value })} /></FormField><FormField label="Raison"><textarea className={entityInputClassName} value={form.adjustmentReason} onChange={(event) => onChange({ ...form, adjustmentReason: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function AbsenceDialog({ employees, error, form, onChange, onClose, onSubmit, open, saving }: { employees: readonly HrEmployee[]; error?: string | null; form: AbsenceForm; onChange: (form: AbsenceForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Nouvelle absence" description="Absence manuelle RH. Les congés approuvés apparaissent automatiquement dans la visibilité absence." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Enregistrer l'absence" />}>
    <FormSection title="Absence"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Début" required><input type="date" className={entityInputClassName} value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} /></FormField><FormField label="Fin" required><input type="date" className={entityInputClassName} value={form.endDate} onChange={(event) => onChange({ ...form, endDate: event.target.value })} /></FormField><FormField label="Type"><input className={entityInputClassName} value={form.type} onChange={(event) => onChange({ ...form, type: event.target.value })} /></FormField><FormField label="Justifiée"><select className={entityInputClassName} value={form.justified ? "yes" : "no"} onChange={(event) => onChange({ ...form, justified: event.target.value === "yes" })}><option value="no">Non</option><option value="yes">Oui</option></select></FormField><FormField label="Notes"><textarea className={entityInputClassName} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function AttendanceDialog({ employees, error, form, onChange, onClose, onSubmit, open, saving }: { employees: readonly HrEmployee[]; error?: string | null; form: AttendanceForm; onChange: (form: AttendanceForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Déclaration de présence" description="Statut journalier simple, sans badgeuse ni calcul de paie." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Enregistrer la présence" />}>
    <FormSection title="Présence"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Date" required><input type="date" className={entityInputClassName} value={form.date} onChange={(event) => onChange({ ...form, date: event.target.value })} /></FormField><FormField label="Statut"><Select value={form.status} onChange={(status) => onChange({ ...form, status: status as HrAttendanceStatus })} options={Object.entries(HR_ATTENDANCE_STATUS_LABELS)} /></FormField><FormField label="Note"><textarea className={entityInputClassName} value={form.note} onChange={(event) => onChange({ ...form, note: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function DocumentTypeDialog({ error, form, onChange, onClose, onSubmit, open, saving }: { error?: string | null; form: DocumentTypeForm; onChange: (form: DocumentTypeForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Type de document" description="Référentiel configurable des pièces RH." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Créer le type" />}>
    <FormSection title="Type"><FormField label="Code"><input className={entityInputClassName} value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} /></FormField><FormField label="Nom" required><input className={entityInputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></FormField><FormField label="Catégorie"><Select value={form.category} onChange={(category) => onChange({ ...form, category })} options={HR_DOCUMENT_CATEGORY_OPTIONS.map((item) => [item, item])} /></FormField><FormField label="Requis par défaut"><select className={entityInputClassName} value={form.requiredByDefault ? "yes" : "no"} onChange={(event) => onChange({ ...form, requiredByDefault: event.target.value === "yes" })}><option value="no">Non</option><option value="yes">Oui</option></select></FormField><FormField label="Description"><textarea className={entityInputClassName} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function DocumentTemplateDialog({ documentTypes, error, form, onChange, onClose, onSubmit, open, saving }: { documentTypes: readonly HrDocumentType[]; error?: string | null; form: DocumentTemplateForm; onChange: (form: DocumentTemplateForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Modèle RH" description="Modèle texte déterministe. Les variables inconnues sont refusées." onClose={onClose} onSubmit={onSubmit} size="lg" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Créer le modèle" />}>
    <FormSection title="Modèle"><FormField label="Code"><input className={entityInputClassName} value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} /></FormField><FormField label="Nom" required><input className={entityInputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></FormField><FormField label="Type"><Select value={form.documentTypeId} onChange={(documentTypeId) => onChange({ ...form, documentTypeId })} placeholder="Aucun type" options={documentTypes.map((type) => [type.id, type.name])} /></FormField><FormField label="Actif"><select className={entityInputClassName} value={form.active ? "yes" : "no"} onChange={(event) => onChange({ ...form, active: event.target.value === "yes" })}><option value="yes">Oui</option><option value="no">Non</option></select></FormField><FormField label="Contenu"><textarea rows={8} className={entityInputClassName} value={form.body} onChange={(event) => onChange({ ...form, body: event.target.value })} /></FormField><FormField label="Variables"><textarea readOnly rows={8} className={entityInputClassName} value={HR_TEMPLATE_VARIABLES.map((item) => `{{${item}}}`).join("\n")} /></FormField><FormField label="Description"><textarea className={entityInputClassName} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function EmployeeDocumentDialog({ documentTypes, employees, error, form, onChange, onClose, onSubmit, open, saving }: { documentTypes: readonly HrDocumentType[]; employees: readonly HrEmployee[]; error?: string | null; form: EmployeeDocumentForm; onChange: (form: EmployeeDocumentForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Document requis" description="Ajout simple au dossier administratif de l'employé." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Ajouter" />}>
    <FormSection title="Document"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Type"><Select value={form.documentTypeId} onChange={(documentTypeId) => { const type = documentTypes.find((item) => item.id === documentTypeId); onChange({ ...form, documentTypeId, title: form.title || type?.name || "", category: type?.category ?? form.category }); }} placeholder="Aucun type" options={documentTypes.map((type) => [type.id, type.name])} /></FormField><FormField label="Titre" required><input className={entityInputClassName} value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} /></FormField><FormField label="Statut"><Select value={form.status} onChange={(status) => onChange({ ...form, status: status as HrDocumentStatus })} options={Object.entries(HR_DOCUMENT_STATUS_LABELS)} /></FormField><FormField label="Échéance"><input type="date" className={entityInputClassName} value={form.expiryDate} onChange={(event) => onChange({ ...form, expiryDate: event.target.value })} /></FormField><FormField label="Requis"><select className={entityInputClassName} value={form.required ? "yes" : "no"} onChange={(event) => onChange({ ...form, required: event.target.value === "yes" })}><option value="yes">Oui</option><option value="no">Non</option></select></FormField><FormField label="Notes"><textarea className={entityInputClassName} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function GenerateDocumentDialog({ contracts, employees, error, form, onChange, onClose, onSubmit, open, saving, templates }: { contracts: readonly HrEmploymentContract[]; employees: readonly HrEmployee[]; error?: string | null; form: GenerateDocumentForm; onChange: (form: GenerateDocumentForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean; templates: readonly HrDocumentTemplate[] }) {
  const scopedContracts = contracts.filter((contract) => !form.employeeId || contract.employeeId === form.employeeId);
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Générer un document" description="BOSIACO remplit le modèle; l'entreprise reste responsable de son contenu." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Générer" />}>
    <FormSection title="Génération"><FormField label="Employé" required><Select value={form.employeeId} onChange={(employeeId) => onChange({ ...form, employeeId, contractId: contracts.find((contract) => contract.employeeId === employeeId)?.id ?? "" })} placeholder="Choisir un employé" options={employees.map((employee) => [employee.id, employee.displayName])} /></FormField><FormField label="Modèle" required><Select value={form.templateId} onChange={(templateId) => onChange({ ...form, templateId })} placeholder="Choisir un modèle" options={templates.map((template) => [template.id, template.name])} /></FormField><FormField label="Contrat"><Select value={form.contractId} onChange={(contractId) => onChange({ ...form, contractId })} placeholder="Contrat actif par défaut" options={scopedContracts.map((contract) => [contract.id, `${HR_CONTRACT_TYPE_LABELS[contract.contractType]} · ${formatDate(contract.startDate)}`])} /></FormField><FormField label="Titre"><input className={entityInputClassName} value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} /></FormField><FormField label="Requis"><select className={entityInputClassName} value={form.required ? "yes" : "no"} onChange={(event) => onChange({ ...form, required: event.target.value === "yes" })}><option value="yes">Oui</option><option value="no">Non</option></select></FormField><FormField label="Notes"><textarea className={entityInputClassName} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} /></FormField></FormSection>
  </EntityDialog>;
}

function UploadDocumentDialog({ documents, error, form, onChange, onClose, onSubmit, open, saving }: { documents: readonly HrEmployeeDocument[]; error?: string | null; form: UploadDocumentForm; onChange: (form: UploadDocumentForm) => void; onClose: () => void; onSubmit: () => Promise<boolean>; open: boolean; saving: boolean }) {
  return <EntityDialog open={open} error={error} eyebrow="RH" title="Version signée / finale" description="V1 enregistre une référence de fichier et ses métadonnées, sans signature électronique." onClose={onClose} onSubmit={onSubmit} size="md" footer={<FormActions onCancel={onClose} submitBusy={saving} submitLabel="Enregistrer la version finale" />}>
    <FormSection title="Fichier"><FormField label="Document" required><Select value={form.documentId} onChange={(documentId) => onChange({ ...form, documentId })} placeholder="Choisir un document" options={documents.map((document) => [document.id, document.title])} /></FormField><FormField label="Nom du fichier" required><input className={entityInputClassName} value={form.filename} onChange={(event) => onChange({ ...form, filename: event.target.value })} /></FormField><FormField label="Type MIME"><Select value={form.mimeType} onChange={(mimeType) => onChange({ ...form, mimeType })} options={[["application/pdf", "PDF"], ["image/png", "PNG"], ["image/jpeg", "JPG"]]} /></FormField><FormField label="Taille octets"><input className={entityInputClassName} value={form.sizeBytes} onChange={(event) => onChange({ ...form, sizeBytes: event.target.value })} /></FormField><FormField label="Signé / final"><select className={entityInputClassName} value={form.signedFinal ? "yes" : "no"} onChange={(event) => onChange({ ...form, signedFinal: event.target.value === "yes" })}><option value="yes">Oui</option><option value="no">Non</option></select></FormField><FormField label="Notes"><textarea className={entityInputClassName} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} /></FormField></FormSection>
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

function SmallButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-hicotech-navy transition hover:bg-hicotech-sky/40 dark:border-hicotech-dark-border dark:text-white">{label}</button>;
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

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
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
