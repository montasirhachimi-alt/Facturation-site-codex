import type { ModuleId } from "../modules/module.types";

export type DashboardContributionZone =
  | "hero"
  | "summary"
  | "primary"
  | "secondary"
  | "sidebar"
  | "footer";

export type DashboardContributionSize = "sm" | "md" | "lg" | "xl" | "full";

export type DashboardContributionStatus = "active" | "alpha" | "preview" | "planned" | "deprecated";

export type DashboardContribution = Readonly<{
  id: string;
  moduleId: ModuleId;
  widgetId: string;
  title: string;
  priority: number;
  order: number;
  zone: DashboardContributionZone;
  size: DashboardContributionSize;
  status: DashboardContributionStatus;
  defaultVisible: boolean;
  alphaReady: boolean;
  renderKey: string;
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type DashboardContributionValidationCode =
  | "duplicate-contribution-id"
  | "duplicate-widget-id"
  | "duplicate-render-key"
  | "unknown-module"
  | "unknown-zone"
  | "invalid-priority"
  | "missing-title"
  | "inactive-widget-visible";

export type DashboardContributionValidationIssue = Readonly<{
  code: DashboardContributionValidationCode;
  contributionId?: string;
  moduleId?: ModuleId;
  message: string;
}>;

export type DashboardContributionValidationResult = Readonly<{
  valid: boolean;
  issues: readonly DashboardContributionValidationIssue[];
}>;

export type DashboardContributionLayout = Readonly<{
  contributions: readonly DashboardContribution[];
  zones: Readonly<Record<DashboardContributionZone, readonly DashboardContribution[]>>;
}>;
