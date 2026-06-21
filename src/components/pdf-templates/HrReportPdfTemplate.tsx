import type { CompanyProfile } from "@/lib/types";

export type HrReportSection = "contrats" | "presences" | "absences" | "conges" | "general";

export type HrReportSummary = {
  activeEmployees: number;
  contracts: number;
  monthlyAttendances: number;
  monthlyAbsences: number;
  pendingLeaves: number;
  payrollMass: number;
};

export type HrReportColumn = {
  key: string;
  label: string;
  width?: number;
  align?: "left" | "right" | "center";
};

export type HrReportRow = Record<string, string | number | boolean>;

export type HrReportPdfData = {
  number: string;
  date: string;
  period: string;
  section: HrReportSection;
  sectionLabel: string;
  summary: HrReportSummary;
  columns: HrReportColumn[];
  rows: HrReportRow[];
  company?: CompanyProfile;
  filename?: string;
};

export function HrReportPdfTemplate(data: HrReportPdfData, company?: CompanyProfile): HrReportPdfData {
  return {
    ...data,
    company: company ?? data.company,
    filename: data.filename || data.number
  };
}

