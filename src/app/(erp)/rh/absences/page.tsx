import { HrRecordsModule } from "@/components/hr-records-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, employees, hrLeaves } from "@/lib/demo-data";

const rows = hrLeaves.filter((leave) => leave.type === "absence").map((leave) => {
  const employee = employees.find((item) => item.id === leave.employeeId);
  return { ...leave, employee: employee ? `${employee.firstName} ${employee.lastName}` : leave.employeeId };
});

export default function HrAbsencesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="RH" title="Absences" description="Demandes, motifs, périodes, validation et suivi des absences." />
      <HrRecordsModule
        title="Absences"
        companyId={activeCompanyId}
        records={rows}
        fields={[
          { key: "employee", label: "Employé" },
          { key: "reason", label: "Motif" },
          { key: "startDate", label: "Date début", type: "date" },
          { key: "endDate", label: "Date fin", type: "date" },
          { key: "days", label: "Nombre de jours", type: "number" },
          { key: "status", label: "Statut", type: "select", options: ["en attente", "validé", "refusé"] }
        ]}
        columns={[
          { key: "employee", label: "Employé" },
          { key: "reason", label: "Motif" },
          { key: "startDate", label: "Début" },
          { key: "endDate", label: "Fin" },
          { key: "days", label: "Jours" },
          { key: "status", label: "Statut" }
        ]}
        emptyTitle="Aucune absence"
        emptyDescription="Aucune absence n'est enregistrée."
      />
    </div>
  );
}
