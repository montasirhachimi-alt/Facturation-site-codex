import { HrDashboard } from "@/components/hr-dashboard";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, attendances, employees, hrLeaves, salaryAdvances, salarySlips } from "@/lib/demo-data";

export default function HrPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Ressources humaines" title="Dashboard RH" description="Vue synthétique des employés, présences, congés, salaires, avances et retards." />
      <HrDashboard employees={employees} attendances={attendances} leaves={hrLeaves} salarySlips={salarySlips} advances={salaryAdvances} scope={{ companyId: activeCompanyId, userId: "demo-user", role: "COMPANY_ADMIN" }} />
    </div>
  );
}
