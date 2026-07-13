import type { ModuleActivationResult } from "../modules/module-activation.types";
import { getCurrentAlphaActivation } from "../modules/module-activation.current";
import { DASHBOARD_CONTRIBUTION_ZONES } from "./dashboard-contribution.constants";
import { bosiacoDashboardContributionRegistry } from "./dashboard-contribution.current";
import { compareDashboardContributions } from "./dashboard-contribution.registry";
import type {
  DashboardContribution,
  DashboardContributionLayout,
  DashboardContributionZone
} from "./dashboard-contribution.types";

export function resolveDashboardContributions({
  activation = getCurrentAlphaActivation(),
  contributions = bosiacoDashboardContributionRegistry.list()
}: {
  activation?: ModuleActivationResult;
  contributions?: readonly DashboardContribution[];
} = {}): DashboardContributionLayout {
  const activeContributions = contributions
    .filter((contribution) => isContributionActive(contribution, activation))
    .sort(compareDashboardContributions);

  const zones = Object.fromEntries(
    DASHBOARD_CONTRIBUTION_ZONES.map((zone) => [
      zone,
      Object.freeze(activeContributions.filter((contribution) => contribution.zone === zone))
    ])
  ) as Record<DashboardContributionZone, readonly DashboardContribution[]>;

  return Object.freeze({
    contributions: Object.freeze(activeContributions),
    zones: Object.freeze(zones)
  });
}

export function isContributionActive(
  contribution: DashboardContribution,
  activation: Pick<ModuleActivationResult, "activeModuleIdSet">
) {
  return Boolean(
    contribution.defaultVisible &&
    contribution.alphaReady &&
    ["active", "alpha"].includes(contribution.status) &&
    activation.activeModuleIdSet.has(contribution.moduleId)
  );
}
