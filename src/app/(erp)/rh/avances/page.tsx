import { HrRecordsModule } from "@/components/hr-records-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, employees, salaryAdvances } from "@/lib/demo-data";

const rows = salaryAdvances.map((advance) => {
  const employee = employees.find((item) => item.id === advance.employeeId);
  return { ...advance, employee: employee ? `${employee.firstName} ${employee.lastName}` : advance.employeeId, deductedLabel: advance.deducted ? "Oui" : "Non" };
});

export default function HrAdvancesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="RH" title="Avances" description="Avances salariales, modes de paiement et déduction automatique du salaire." />
      <HrRecordsModule
        title="Avances"
        companyId={activeCompanyId}
        records={rows}
        fields={[
          { key: "employee", label: "Employé" },
          { key: "amount", label: "Montant", type: "number" },
          { key: "date", label: "Date", type: "date" },
          { key: "mode", label: "Mode de paiement", type: "select", options: ["Espèces", "Chèque", "Virement", "Carte bancaire"] },
          { key: "deductedLabel", label: "Déduit du salaire", type: "select", options: ["Oui", "Non"] }
        ]}
        columns={[
          { key: "employee", label: "Employé" },
          { key: "amount", label: "Montant" },
          { key: "date", label: "Date" },
          { key: "mode", label: "Mode" },
          { key: "deductedLabel", label: "Déduit" }
        ]}
        emptyTitle="Aucune avance"
        emptyDescription="Aucune avance salariale n'est enregistrée."
      />
    </div>
  );
}
