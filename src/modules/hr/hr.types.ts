export type HrWorkspaceId = string & { readonly __brand: "HrWorkspaceId" };
export type HrTenantCompanyId = string & { readonly __brand: "HrTenantCompanyId" };
export type HrUserId = string & { readonly __brand: "HrUserId" };
export type HrEmployeeId = string & { readonly __brand: "HrEmployeeId" };
export type HrDepartmentId = string & { readonly __brand: "HrDepartmentId" };
export type HrPositionId = string & { readonly __brand: "HrPositionId" };
export type HrEmploymentContractId = string & { readonly __brand: "HrEmploymentContractId" };
export type HrLeaveTypeId = string & { readonly __brand: "HrLeaveTypeId" };
export type HrLeaveRequestId = string & { readonly __brand: "HrLeaveRequestId" };

export type HrEmployeeStatus = "active" | "inactive" | "on_leave" | "terminated" | "archived";
export type HrContractStatus = "active" | "ended" | "cancelled" | "archived";
export type HrContractType = "permanent" | "fixed_term" | "internship" | "temporary" | "freelance" | "other";
export type HrWorkingTimeType = "full_time" | "part_time" | "other";
export type HrLeaveRequestStatus = "draft" | "requested" | "approved" | "rejected" | "cancelled" | "archived";

export type HrDepartment = Readonly<{
  id: HrDepartmentId;
  tenantCompanyId?: HrTenantCompanyId;
  code?: string;
  name: string;
  description?: string;
  managerId?: HrEmployeeId;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type HrPosition = Readonly<{
  id: HrPositionId;
  tenantCompanyId?: HrTenantCompanyId;
  code?: string;
  name: string;
  departmentId?: HrDepartmentId;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type HrEmployee = Readonly<{
  id: HrEmployeeId;
  tenantCompanyId?: HrTenantCompanyId;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  hireDate: string;
  terminationDate?: string;
  status: HrEmployeeStatus;
  departmentId?: HrDepartmentId;
  positionId?: HrPositionId;
  managerEmployeeId?: HrEmployeeId;
  linkedUserId?: HrUserId;
  notes?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type HrEmploymentContract = Readonly<{
  id: HrEmploymentContractId;
  tenantCompanyId?: HrTenantCompanyId;
  employeeId: HrEmployeeId;
  contractType: HrContractType;
  startDate: string;
  endDate?: string;
  positionId?: HrPositionId;
  jobTitle: string;
  workingTimeType?: HrWorkingTimeType;
  notes?: string;
  status: HrContractStatus;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type HrLeaveType = Readonly<{
  id: HrLeaveTypeId;
  tenantCompanyId?: HrTenantCompanyId;
  name: string;
  description?: string;
  paid: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type HrLeaveRequest = Readonly<{
  id: HrLeaveRequestId;
  tenantCompanyId?: HrTenantCompanyId;
  employeeId: HrEmployeeId;
  leaveTypeId?: HrLeaveTypeId;
  title: string;
  reason?: string;
  startDate: string;
  endDate: string;
  status: HrLeaveRequestStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedByEmployeeId?: HrEmployeeId;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type HrSnapshot = Readonly<{
  employees: readonly HrEmployee[];
  departments: readonly HrDepartment[];
  positions: readonly HrPosition[];
  contracts: readonly HrEmploymentContract[];
  leaveTypes: readonly HrLeaveType[];
  leaveRequests: readonly HrLeaveRequest[];
}>;

export type HrEmployeeFilters = Readonly<{
  query?: string;
  status?: HrEmployeeStatus | "all";
  departmentId?: HrDepartmentId | "all";
  positionId?: HrPositionId | "all";
  includeArchived?: boolean;
}>;

export type HrContractFilters = Readonly<{
  employeeId?: HrEmployeeId | "all";
  status?: HrContractStatus | "all";
  includeArchived?: boolean;
}>;

export type HrLeaveRequestFilters = Readonly<{
  employeeId?: HrEmployeeId | "all";
  status?: HrLeaveRequestStatus | "all";
  includeArchived?: boolean;
}>;

export type CreateHrDepartmentInput = Readonly<Omit<HrDepartment, "id" | "createdAt" | "updatedAt">>;
export type UpdateHrDepartmentInput = Readonly<Partial<Omit<CreateHrDepartmentInput, "tenantCompanyId">> & { id: HrDepartmentId }>;

export type CreateHrPositionInput = Readonly<Omit<HrPosition, "id" | "createdAt" | "updatedAt">>;
export type UpdateHrPositionInput = Readonly<Partial<Omit<CreateHrPositionInput, "tenantCompanyId">> & { id: HrPositionId }>;

export type CreateHrEmployeeInput = Readonly<Omit<HrEmployee, "id" | "displayName" | "createdAt" | "updatedAt" | "archivedAt">>;
export type UpdateHrEmployeeInput = Readonly<Partial<Omit<CreateHrEmployeeInput, "tenantCompanyId">> & { id: HrEmployeeId; archivedAt?: string }>;

export type CreateHrEmploymentContractInput = Readonly<Omit<HrEmploymentContract, "id" | "createdAt" | "updatedAt" | "archivedAt">>;
export type UpdateHrEmploymentContractInput = Readonly<Partial<Omit<CreateHrEmploymentContractInput, "tenantCompanyId">> & { id: HrEmploymentContractId; archivedAt?: string }>;

export type CreateHrLeaveTypeInput = Readonly<Omit<HrLeaveType, "id" | "createdAt" | "updatedAt">>;
export type UpdateHrLeaveTypeInput = Readonly<Partial<Omit<CreateHrLeaveTypeInput, "tenantCompanyId">> & { id: HrLeaveTypeId }>;

export type CreateHrLeaveRequestInput = Readonly<Omit<HrLeaveRequest, "id" | "createdAt" | "updatedAt" | "archivedAt">>;
export type UpdateHrLeaveRequestInput = Readonly<Partial<Omit<CreateHrLeaveRequestInput, "tenantCompanyId">> & { id: HrLeaveRequestId; archivedAt?: string }>;
