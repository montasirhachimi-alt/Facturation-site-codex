import { bosiacoModuleRegistry } from "../modules/module-activation.current";
import type { ModuleId } from "../modules/module.types";
import { DASHBOARD_CONTRIBUTION_ZONES } from "./dashboard-contribution.constants";
import type {
  DashboardContribution,
  DashboardContributionValidationIssue,
  DashboardContributionValidationResult
} from "./dashboard-contribution.types";

const zoneSet = new Set<string>(DASHBOARD_CONTRIBUTION_ZONES);

export function validateDashboardContributions(
  contributions: readonly DashboardContribution[]
): DashboardContributionValidationResult {
  const issues: DashboardContributionValidationIssue[] = [];
  const contributionIds = new Set<string>();
  const widgetIds = new Set<string>();
  const renderKeys = new Set<string>();

  for (const contribution of contributions) {
    if (contributionIds.has(contribution.id)) {
      issues.push(issue("duplicate-contribution-id", contribution, `Dashboard contribution "${contribution.id}" is registered more than once.`));
    }
    contributionIds.add(contribution.id);

    if (widgetIds.has(contribution.widgetId)) {
      issues.push(issue("duplicate-widget-id", contribution, `Dashboard widget "${contribution.widgetId}" is registered more than once.`));
    }
    widgetIds.add(contribution.widgetId);

    if (renderKeys.has(contribution.renderKey)) {
      issues.push(issue("duplicate-render-key", contribution, `Dashboard render key "${contribution.renderKey}" is registered more than once.`));
    }
    renderKeys.add(contribution.renderKey);

    if (!bosiacoModuleRegistry.has(contribution.moduleId)) {
      issues.push(issue("unknown-module", contribution, `Dashboard contribution "${contribution.id}" references unknown module "${contribution.moduleId}".`));
    }

    if (!zoneSet.has(contribution.zone)) {
      issues.push(issue("unknown-zone", contribution, `Dashboard contribution "${contribution.id}" uses unknown zone "${contribution.zone}".`));
    }

    if (!Number.isFinite(contribution.priority) || contribution.priority < 0) {
      issues.push(issue("invalid-priority", contribution, `Dashboard contribution "${contribution.id}" must use a non-negative finite priority.`));
    }

    if (!contribution.title.trim()) {
      issues.push(issue("missing-title", contribution, `Dashboard contribution "${contribution.id}" must have a title.`));
    }

    if (contribution.defaultVisible && (!contribution.alphaReady || ["planned", "deprecated"].includes(contribution.status))) {
      issues.push(issue("inactive-widget-visible", contribution, `Dashboard contribution "${contribution.id}" is visible by default but not active for Alpha.`));
    }
  }

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze(issues)
  });
}

function issue(
  code: DashboardContributionValidationIssue["code"],
  contribution: Pick<DashboardContribution, "id" | "moduleId">,
  message: string
): DashboardContributionValidationIssue {
  return Object.freeze({
    code,
    contributionId: contribution.id,
    moduleId: contribution.moduleId as ModuleId,
    message
  });
}
