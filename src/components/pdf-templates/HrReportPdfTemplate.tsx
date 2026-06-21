import type { CompanyProfile } from "@/lib/types";
import type { PdfLayoutDocument, PdfLineItem } from "@/components/pdf-templates/PdfLayout";

export type HrReportPdfData = {
  number: string;
  date: string;
  title?: string;
  period: string;
  rows: Array<{
    reference: string;
    label: string;
    value: number;
  }>;
};

export function HrReportPdfTemplate(data: HrReportPdfData, company?: CompanyProfile): PdfLayoutDocument {
  const lines: PdfLineItem[] = data.rows.map((row) => ({
    reference: row.reference,
    designation: row.label,
    quantity: 1,
    unitPrice: row.value,
    vat: 0
  }));

  return {
    title: "RAPPORT RH",
    number: data.number,
    date: data.date,
    recipient: {
      label: "RAPPORT",
      name: data.title || "Rapport Ressources Humaines",
      company: `Période : ${data.period}`
    },
    lines,
    notes: "Rapport généré par HICOTECH ERP.",
    filename: data.number,
    company
  };
}

