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
    <article className="group rounded-[1.35rem] border border-violet-100 bg-white p-5 shadow-[0_18px_55px_rgba(91,33,182,0.08)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_22px_65px_rgba(91,33,182,0.12)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-300">{label}</p>
          <p className={`mt-3 font-display text-2xl font-bold ${warning ? "text-hicotech-red" : "text-hicotech-navy dark:text-white"}`}>{value}</p>
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100 transition group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/20">
          <Icon size={19} />
        </div>
      </div>
    </article>
  );
}
