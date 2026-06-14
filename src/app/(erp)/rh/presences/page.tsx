import { HrRecordsModule } from "@/components/hr-records-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, attendances, employees } from "@/lib/demo-data";

const rows = attendances.map((attendance) => {
  const employee = employees.find((item) => item.id === attendance.employeeId);
  return { ...attendance, employee: employee ? `${employee.firstName} ${employee.lastName}` : attendance.employeeId };
});

export default function HrAttendancePage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="RH" title="Présences" description="Pointage entrée/sortie, retards, heures travaillées et historique." />
      <HrRecordsModule
        title="Présences"
        companyId={activeCompanyId}
        records={rows}
        fields={[
          { key: "employee", label: "Employé" },
          { key: "date", label: "Date", type: "date" },
          { key: "checkIn", label: "Pointage entrée" },
          { key: "checkOut", label: "Pointage sortie" },
          { key: "lateMinutes", label: "Retard minutes", type: "number" },
          { key: "workedHours", label: "Heures travaillées", type: "number" }
        ]}
        columns={[
          { key: "employee", label: "Employé" },
          { key: "date", label: "Date" },
          { key: "checkIn", label: "Entrée" },
          { key: "checkOut", label: "Sortie" },
          { key: "lateMinutes", label: "Retard" },
          { key: "workedHours", label: "Heures" }
        ]}
        emptyTitle="Aucune présence"
        emptyDescription="Aucun pointage ne correspond aux critères."
      />
    </div>
  );
}
