import { branding } from "@/lib/branding";
import type { CompanyProfile } from "@/lib/types";
import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";

export type EmployeeContractPdfData = {
  number: string;
  date: string;
  employeeName: string;
  position: string;
  contractType: string;
  salary: number;
  startDate: string;
  endDate?: string;
};

export function EmployeeContractPdfTemplate(data: EmployeeContractPdfData, company?: CompanyProfile): PdfLayoutDocument {
  return {
    title: "CONTRAT DE TRAVAIL",
    number: data.number,
    date: data.date,
    recipient: {
      label: "EMPLOYÉ",
      name: data.employeeName,
      company: data.position
    },
    lines: [
      { reference: data.contractType, designation: `Fonction : ${data.position}`, quantity: 1, unitPrice: data.salary, vat: 0 },
      { reference: data.startDate, designation: `Date début${data.endDate ? ` - Date fin : ${data.endDate}` : ""}`, quantity: 1, unitPrice: 0, vat: 0 }
    ],
    notes: branding.pdf.employeeContractNote,
    filename: data.number,
    company
  };
}
