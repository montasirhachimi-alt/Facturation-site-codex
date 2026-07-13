import type { ModuleId } from "../modules/module.types";
import type {
  DashboardContribution,
  DashboardContributionValidationResult,
  DashboardContributionZone
} from "./dashboard-contribution.types";
import { validateDashboardContributions } from "./dashboard-contribution.validation";

export class DashboardContributionRegistry {
  private readonly contributions = new Map<string, DashboardContribution>();

  constructor(contributions: readonly DashboardContribution[] = []) {
    this.registerMany(contributions);
  }

  register(contribution: DashboardContribution) {
    if (this.contributions.has(contribution.id)) {
      throw new Error(`Dashboard contribution "${contribution.id}" is already registered.`);
    }

    this.contributions.set(contribution.id, cloneContribution(contribution));
    return this;
  }

  registerMany(contributions: readonly DashboardContribution[]) {
    contributions.forEach((contribution) => this.register(contribution));
    return this;
  }

  get(id: string) {
    return this.contributions.get(id);
  }

  list() {
    return Object.freeze([...this.contributions.values()].sort(compareDashboardContributions));
  }

  listByModule(moduleId: ModuleId) {
    return Object.freeze(this.list().filter((contribution) => contribution.moduleId === moduleId));
  }

  listByZone(zone: DashboardContributionZone) {
    return Object.freeze(this.list().filter((contribution) => contribution.zone === zone));
  }

  validate(): DashboardContributionValidationResult {
    return validateDashboardContributions(this.list());
  }
}

export function createDashboardContributionRegistry(contributions: readonly DashboardContribution[]) {
  return new DashboardContributionRegistry(contributions);
}

export function compareDashboardContributions(first: DashboardContribution, second: DashboardContribution) {
  return first.priority - second.priority || first.order - second.order || first.id.localeCompare(second.id);
}

function cloneContribution(contribution: DashboardContribution): DashboardContribution {
  return Object.freeze({
    ...contribution,
    metadata: contribution.metadata ? Object.freeze({ ...contribution.metadata }) : undefined
  });
}
