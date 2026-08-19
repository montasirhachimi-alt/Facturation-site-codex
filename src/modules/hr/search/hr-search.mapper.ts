import type { SearchResult } from "@/runtime/search";
import { scoreSearchFields } from "@/runtime/search";
import type { HrDepartment, HrEmployee, HrPosition } from "@/modules/hr";
import { HR_EMPLOYEE_STATUS_LABELS } from "@/modules/hr";

export function mapHrEmployeeToSearchResult(
  employee: HrEmployee,
  queryText: string,
  departments: ReadonlyMap<string, HrDepartment>,
  positions: ReadonlyMap<string, HrPosition>
): SearchResult | undefined {
  const department = employee.departmentId ? departments.get(employee.departmentId) : undefined;
  const position = employee.positionId ? positions.get(employee.positionId) : undefined;
  const score = scoreSearchFields(queryText, [
    { value: employee.id, weight: "identifier" },
    { value: employee.employeeNumber, weight: "identifier" },
    { value: employee.displayName, weight: "title" },
    { value: employee.firstName, weight: "title" },
    { value: employee.lastName, weight: "title" },
    { value: employee.email, weight: "secondary" },
    { value: employee.phone, weight: "secondary" },
    { value: department?.name, weight: "secondary" },
    { value: position?.name, weight: "secondary" },
    { value: employee.status, weight: "metadata" },
    { value: HR_EMPLOYEE_STATUS_LABELS[employee.status], weight: "metadata" }
  ]);

  if (score <= 0) return undefined;

  return {
    id: `hr:employee:${employee.id}`,
    entityType: "hr.employee",
    entityId: employee.id,
    moduleId: "hr.employees",
    title: employee.displayName,
    subtitle: department?.name,
    description: [employee.employeeNumber, position?.name, HR_EMPLOYEE_STATUS_LABELS[employee.status]].filter(Boolean).join(" · "),
    keywords: [
      employee.id,
      employee.employeeNumber,
      employee.displayName,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.phone,
      department?.name,
      position?.name,
      employee.status
    ].filter(Boolean) as string[],
    icon: "UserRoundCheck",
    url: "/rh",
    score,
    metadata: {
      status: employee.status,
      departmentId: employee.departmentId,
      positionId: employee.positionId
    }
  };
}
