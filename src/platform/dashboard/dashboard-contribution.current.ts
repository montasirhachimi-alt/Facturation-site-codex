import { bosiacoDashboardContributions } from "./dashboard-contributions";
import { DashboardContributionRegistry } from "./dashboard-contribution.registry";

export const bosiacoDashboardContributionRegistry = new DashboardContributionRegistry(
  bosiacoDashboardContributions
);

export function getDashboardContributionRegistry() {
  return bosiacoDashboardContributionRegistry;
}
