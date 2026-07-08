import { HrDashboard } from "@/components/hr-dashboard";
import { activeCompanyId, attendances, employees, hrLeaves, salaryAdvances, salarySlips } from "@/lib/demo-data";
import { ProductHero } from "@/ui";
import { CalendarClock, UserRoundCheck, Users } from "lucide-react";

export default function HrPage() {
  const scopedEmployees = employees.filter((employee) => employee.companyId === activeCompanyId);
  const scopedLeaves = hrLeaves.filter((leave) => leave.companyId === activeCompanyId);
  const scopedAttendances = attendances.filter((attendance) => attendance.companyId === activeCompanyId);
  const activeEmployees = scopedEmployees.filter((employee) => employee.status === "actif").length;
  const absentToday = scopedLeaves.filter((leave) => leave.status === "validé" && leave.startDate <= "2026-06-14" && leave.endDate >= "2026-06-14").length;
  const pendingLeaves = scopedLeaves.filter((leave) => leave.status === "en attente").length;
  const lateMinutes = scopedAttendances.reduce((sum, attendance) => sum + attendance.lateMinutes, 0);

  return (
    <div className="space-y-6">
      <ProductHero
        eyebrow="Ressources humaines / Équipe"
        icon={Users}
        personality="hr"
        title="Prendre le pouls de l'équipe avant la journée."
        subtitle={`${activeEmployees} collaborateurs actifs, ${pendingLeaves} demande(s) de congé à arbitrer et ${lateMinutes} minutes de retard à suivre.`}
        actions={[
          { href: "/rh/employes", icon: UserRoundCheck, label: "Voir les employés" },
          { href: "/rh/conges", icon: CalendarClock, label: "Suivre les congés", tone: "secondary" }
        ]}
        signals={[
          { label: "Équipe active", value: String(activeEmployees), helper: "collaborateurs" },
          { label: "Absences", value: String(absentToday), helper: "aujourd'hui" },
          { label: "Congés", value: String(pendingLeaves), helper: "en attente" },
          { label: "Retards", value: `${lateMinutes} min`, helper: "ce mois" }
        ]}
      />
      <HrDashboard employees={employees} attendances={attendances} leaves={hrLeaves} salarySlips={salarySlips} advances={salaryAdvances} scope={{ companyId: activeCompanyId, userId: "demo-user", role: "COMPANY_ADMIN" }} />
    </div>
  );
}
