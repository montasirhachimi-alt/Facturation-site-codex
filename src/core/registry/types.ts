import type { CorePermissionRequirement, CoreStatus } from "../types";
import type { CoreModuleCategory } from "../constants";

export type CoreModuleId =
  | "dashboard"
  | "clients"
  | "suppliers"
  | "products"
  | "documents"
  | "quotes"
  | "invoices"
  | "delivery_notes"
  | "purchases"
  | "cash"
  | "payments"
  | "employees"
  | "contracts"
  | "attendance"
  | "absences"
  | "leaves"
  | "payroll"
  | "advances"
  | "hr_documents"
  | "reports"
  | "statistics"
  | "pdf"
  | "ai_assistant"
  | "settings"
  | "users"
  | (string & {});

export type CoreModuleWidgetReference = {
  id: string;
  area?: string;
  defaultEnabled?: boolean;
};

export type CoreModuleDefinition = {
  id: CoreModuleId;
  name: string;
  category: CoreModuleCategory;
  icon: string;
  route: string;
  aliases?: string[];
  permissions: CorePermissionRequirement[];
  searchable: boolean;
  favorite: boolean;
  widgets: CoreModuleWidgetReference[];
  enabled: boolean;
  status?: CoreStatus;
  description?: string;
};
