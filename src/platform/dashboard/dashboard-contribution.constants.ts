import type { DashboardContributionZone } from "./dashboard-contribution.types";

export const DASHBOARD_CONTRIBUTION_ZONES = Object.freeze([
  "hero",
  "summary",
  "primary",
  "secondary",
  "sidebar",
  "footer"
] satisfies readonly DashboardContributionZone[]);
