import { HrRecordsModule } from "@/components/hr-records-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, employees, salarySlips } from "@/lib/demo-data";

const rows = salarySlips.map((slip) => {
  const employee = employees.find((item) => item.id === slip.employeeId);
  return { ...slip, employee: employee ? `${employee.firstName} ${employee.lastName}` : slip.employeeId };
});

export default function HrPayrollPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="RH" title="Salaires" description="Fiches de paie, primes, avances, retenues, absences non payées et salaire net." />
      <HrRecordsModule
        title="Salaires"
        companyId={activeCompanyId}
        records={rows}
        fields={[
          { key: "employee", label: "Employé" },
          { key: "month", label: "Mois" },
          { key: "baseSalary", label: "Salaire de base", type: "number" },
          { key: "bonuses", label: "Primes", type: "number" },
          { key: "advances", label: "Avances", type: "number" },
          { key: "deductions", label: "Retenues", type: "number" },
          { key: "unpaidAbsences", label: "Absences non payées", type: "number" },
          { key: "netSalary", label: "Salaire net", type: "number" }
        ]}
        columns={[
          { key: "employee", label: "Employé" },
          { key: "month", label: "Mois" },
          { key: "baseSalary", label: "Base" },
          { key: "bonuses", label: "Primes" },
          { key: "advances", label: "Avances" },
          { key: "deductions", label: "Retenues" },
          { key: "netSalary", label: "Net" }
        ]}
        emptyTitle="Aucune fiche de paie"
        emptyDescription="Aucune fiche de paie n'est enregistrée."
      />
    </div>
  );
}
