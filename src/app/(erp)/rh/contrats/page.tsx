import { HrRecordsModule } from "@/components/hr-records-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, employeeContracts, employees } from "@/lib/demo-data";

const rows = employeeContracts.map((contract) => {
  const employee = employees.find((item) => item.id === contract.employeeId);
  return { ...contract, employee: employee ? `${employee.firstName} ${employee.lastName}` : contract.employeeId };
});

export default function HrContractsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="RH" title="Contrats" description="Types de contrats, dates, salaires, fonctions, PDF et contrats signés." />
      <HrRecordsModule
        title="Contrats"
        companyId={activeCompanyId}
        records={rows}
        fields={[
          { key: "employee", label: "Employé" },
          { key: "type", label: "Type", type: "select", options: ["CDI", "CDD", "stage", "freelance"] },
          { key: "startDate", label: "Date début", type: "date" },
          { key: "endDate", label: "Date fin", type: "date" },
          { key: "salary", label: "Salaire", type: "number" },
          { key: "position", label: "Fonction" },
          { key: "signedFileUrl", label: "Contrat signé" }
        ]}
        columns={[
          { key: "employee", label: "Employé" },
          { key: "type", label: "Type" },
          { key: "startDate", label: "Début" },
          { key: "endDate", label: "Fin" },
          { key: "salary", label: "Salaire" },
          { key: "position", label: "Fonction" }
        ]}
        emptyTitle="Aucun contrat"
        emptyDescription="Aucun contrat RH n'est enregistré."
      />
    </div>
  );
}
