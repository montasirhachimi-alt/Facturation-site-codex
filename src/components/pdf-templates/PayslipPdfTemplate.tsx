import type { CompanyProfile } from "@/lib/types";

export type PayslipPdfData = {
  number: string;
  date: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  bonuses: number;
  advances: number;
  deductions: number;
  unpaidAbsences?: number;
  netSalary: number;
  company?: CompanyProfile;
  filename?: string;
};

export function PayslipPdfTemplate(data: PayslipPdfData, company?: CompanyProfile): PayslipPdfData {
  return {
    ...data,
    company: company ?? data.company,
    filename: data.filename || data.number
  };
}

