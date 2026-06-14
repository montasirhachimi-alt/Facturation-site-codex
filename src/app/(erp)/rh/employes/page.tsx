import { HrEmployeesModule } from "@/components/hr-employees-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, employees } from "@/lib/demo-data";

export default function HrEmployeesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="RH" title="Employés" description="Liste, ajout, modification, suppression et suivi des informations employés." />
      <HrEmployeesModule initialEmployees={employees} scope={{ companyId: activeCompanyId, userId: "demo-user", role: "COMPANY_ADMIN" }} />
    </div>
  );
}
