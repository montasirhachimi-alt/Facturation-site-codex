import { HrRecordsModule } from "@/components/hr-records-module";
import { SectionHeader } from "@/components/section-header";
import { activeCompanyId, employees, hrDocuments } from "@/lib/demo-data";

const rows = hrDocuments.map((document) => {
  const employee = employees.find((item) => item.id === document.employeeId);
  return { ...document, employee: employee ? `${employee.firstName} ${employee.lastName}` : document.employeeId };
});

export default function HrDocumentsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="RH" title="Documents RH" description="CIN, contrats, attestations, certificats et documents scannés." />
      <HrRecordsModule
        title="Documents RH"
        companyId={activeCompanyId}
        records={rows}
        fields={[
          { key: "employee", label: "Employé" },
          { key: "type", label: "Type", type: "select", options: ["CIN", "Contrat", "Attestation de travail", "Certificat de salaire", "Document scanné"] },
          { key: "title", label: "Titre" },
          { key: "fileUrl", label: "Fichier scanné" },
          { key: "issuedAt", label: "Date", type: "date" }
        ]}
        columns={[
          { key: "employee", label: "Employé" },
          { key: "type", label: "Type" },
          { key: "title", label: "Titre" },
          { key: "issuedAt", label: "Date" },
          { key: "fileUrl", label: "Fichier" }
        ]}
        emptyTitle="Aucun document RH"
        emptyDescription="Aucun document RH n'est enregistré."
      />
    </div>
  );
}
