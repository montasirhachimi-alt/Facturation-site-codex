"use client";

import { CalendarClock, Clock3, HandCoins, Hourglass, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Attendance, Employee, HrLeave, SalaryAdvance, SalarySlip, TenantScope } from "@/lib/types";

export function HrDashboard({
  employees,
  attendances,
  leaves,
  salarySlips,
  advances,
  scope
}: {
  employees: Employee[];
  attendances: Attendance[];
  leaves: HrLeave[];
  salarySlips: SalarySlip[];
  advances: SalaryAdvance[];
  scope: TenantScope;
}) {
  const scopedEmployees = employees.filter((employee) => employee.companyId === scope.companyId);
  const scopedLeaves = leaves.filter((leave) => leave.companyId === scope.companyId);
  const scopedAttendances = attendances.filter((attendance) => attendance.companyId === scope.companyId);
  const scopedSlips = salarySlips.filter((slip) => slip.companyId === scope.companyId && slip.month === "2026-06");
  const scopedAdvances = advances.filter((advance) => advance.companyId === scope.companyId && advance.date.startsWith("2026-06"));

  const activeEmployees = scopedEmployees.filter((employee) => employee.status === "actif").length;
  const absentToday = scopedLeaves.filter((leave) => leave.status === "validé" && leave.startDate <= "2026-06-14" && leave.endDate >= "2026-06-14").length;
  const pendingLeaves = scopedLeaves.filter((leave) => leave.status === "en attente").length;
  const payroll = scopedSlips.reduce((sum, slip) => sum + slip.netSalary, 0);
  const advancesTotal = scopedAdvances.reduce((sum, advance) => sum + advance.amount, 0);
  const lateMinutes = scopedAttendances.reduce((sum, attendance) => sum + attendance.lateMinutes, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <HrCard icon={Users} label="Employés actifs" value={activeEmployees.toString()} />
      <HrCard icon={CalendarClock} label="Absents aujourd'hui" value={absentToday.toString()} warning={absentToday > 0} />
      <HrCard icon={Hourglass} label="Congés en attente" value={pendingLeaves.toString()} warning={pendingLeaves > 0} />
      <HrCard icon={HandCoins} label="Masse salariale" value={formatCurrency(payroll)} />
      <HrCard icon={HandCoins} label="Avances du mois" value={formatCurrency(advancesTotal)} warning={advancesTotal > 0} />
      <HrCard icon={Clock3} label="Retards du mois" value={`${lateMinutes} min`} warning={lateMinutes > 0} />
    </div>
  );
}

function HrCard({ icon: Icon, label, value, warning }: { icon: React.ElementType; label: string; value: string; warning?: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
          <Icon size={20} />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
      </div>
      <p className={`mt-3 font-display text-2xl font-bold ${warning ? "text-hicotech-red" : "text-hicotech-navy dark:text-white"}`}>{value}</p>
    </article>
  );
}
