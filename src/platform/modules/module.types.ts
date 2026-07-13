import type { MODULE_CATEGORIES, MODULE_STATUSES, MODULE_VALIDATION_SEVERITIES } from "./module.constants";

export type ModuleCategory = (typeof MODULE_CATEGORIES)[number];

export type ModuleStatus = (typeof MODULE_STATUSES)[number];

export type ModuleValidationSeverity = (typeof MODULE_VALIDATION_SEVERITIES)[number];

export type ModuleId =
  | "core.dashboard"
  | "core.settings"
  | "platform.command-center"
  | "platform.keyboard"
  | "platform.persistence"
  | "crm.overview"
  | "crm.companies"
  | "crm.contacts"
  | "crm.meetings"
  | "crm.tasks"
  | "crm.notes"
  | "crm.opportunities"
  | "sales.quotes"
  | "sales.invoices"
  | "sales.payments"
  | "sales.products"
  | "inventory.stock"
  | "purchasing.orders"
  | "purchasing.suppliers"
  | "finance.cash"
  | "finance.reports"
  | "hr.employees"
  | "platform.notifications"
  | "platform.audit"
  | "ai.assistant"
  | (string & {});

export type ModuleNavigationDescriptor = Readonly<{
  label: string;
  href: string;
  iconKey: string;
  group: string;
  order?: number;
  exactMatch?: boolean;
  hidden?: boolean;
  badgeKey?: string;
  parentModuleId?: ModuleId;
  mobileLabel?: string;
  searchKeywords?: readonly string[];
}>;

export type ModuleCommandCenterDescriptor = Readonly<{
  navigationKeywords?: readonly string[];
  quickCreateKeys?: readonly string[];
  recordSearchKeys?: readonly string[];
  hidden?: boolean;
}>;

export type ModuleDashboardDescriptor = Readonly<{
  dashboardSectionKey?: string;
  widgetKeys?: readonly string[];
  priority?: number;
  hidden?: boolean;
}>;

export type ModuleDescriptor = Readonly<{
  id: ModuleId;
  name: string;
  shortName?: string;
  description: string;
  category: ModuleCategory;
  iconKey: string;
  route?: string;
  status: ModuleStatus;
  version: string;
  dependencies?: readonly ModuleId[];
  optionalDependencies?: readonly ModuleId[];
  features?: readonly string[];
  navigation?: ModuleNavigationDescriptor;
  commandCenter?: ModuleCommandCenterDescriptor;
  dashboard?: ModuleDashboardDescriptor;
  defaultEnabled: boolean;
  alphaReady: boolean;
  hidden: boolean;
  order: number;
}>;

export type ModuleValidationCode =
  | "duplicate-id"
  | "duplicate-route"
  | "hidden-default-enabled"
  | "invalid-status"
  | "missing-label"
  | "self-dependency"
  | "unknown-dependency"
  | "circular-dependency";

export type ModuleValidationIssue = Readonly<{
  code: ModuleValidationCode;
  severity: ModuleValidationSeverity;
  moduleId?: ModuleId;
  message: string;
}>;

export type ModuleValidationResult = Readonly<{
  valid: boolean;
  issues: readonly ModuleValidationIssue[];
}>;
