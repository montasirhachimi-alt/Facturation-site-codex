import { HrRecordsModule } from "@/components/hr-records-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, employees, hrLeaves } from "@/lib/demo-data";

const rows = hrLeaves.filter((leave) => leave.type === "congé").map((leave) => {
  const employee = employees.find((item) => item.id === leave.employeeId);
  return { ...leave, employee: employee ? `${employee.firstName} ${employee.lastName}` : leave.employeeId };
});

export default function HrLeavesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="RH" title="Congés" description="Demandes de congé, validation admin, nombre de jours et solde." />
      <HrRecordsModule
        title="Congés"
        companyId={activeCompanyId}
        records={rows}
        fields={[
          { key: "employee", label: "Employé" },
          { key: "reason", label: "Motif" },
          { key: "startDate", label: "Date début", type: "date" },
          { key: "endDate", label: "Date fin", type: "date" },
          { key: "days", label: "Nombre de jours", type: "number" },
          { key: "balance", label: "Solde congé", type: "number" },
          { key: "status", label: "Statut", type: "select", options: ["en attente", "validé", "refusé"] }
        ]}
        columns={[
          { key: "employee", label: "Employé" },
          { key: "reason", label: "Motif" },
          { key: "startDate", label: "Début" },
          { key: "endDate", label: "Fin" },
          { key: "days", label: "Jours" },
          { key: "balance", label: "Solde" },
          { key: "status", label: "Statut" }
        ]}
        emptyTitle="Aucun congé"
        emptyDescription="Aucune demande de congé n'est enregistrée."
      />
    </div>
  );
}
