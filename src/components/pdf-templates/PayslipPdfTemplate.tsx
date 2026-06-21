import type { CompanyProfile } from "@/lib/types";
import type { PdfLayoutDocument } from "@/components/pdf-templates/PdfLayout";

export type PayslipPdfData = {
  number: string;
  date: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  bonuses: number;
  advances: number;
  deductions: number;
  netSalary: number;
};

export function PayslipPdfTemplate(data: PayslipPdfData, company?: CompanyProfile): PdfLayoutDocument {
  return {
    title: "FICHE DE PAIE",
    number: data.number,
    date: data.date,
    recipient: {
      label: "EMPLOYÉ",
      name: data.employeeName,
      company: `Période : ${data.period}`
    },
    lines: [
      { reference: "BASE", designation: "Salaire de base", quantity: 1, unitPrice: data.baseSalary, vat: 0 },
      { reference: "PRIME", designation: "Primes", quantity: 1, unitPrice: data.bonuses, vat: 0 },
      { reference: "AVANCE", designation: "Avances", quantity: 1, unitPrice: -data.advances, vat: 0 },
      { reference: "RETENUE", designation: "Retenues", quantity: 1, unitPrice: -data.deductions, vat: 0 },
      { reference: "NET", designation: "Salaire net", quantity: 1, unitPrice: data.netSalary, vat: 0 }
    ],
    notes: "Fiche de paie générée depuis le module Ressources Humaines.",
    filename: data.number,
    company
  };
}

