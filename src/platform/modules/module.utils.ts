import { MODULE_STATUSES } from "./module.constants";
import type { ModuleDescriptor, ModuleId, ModuleStatus, ModuleValidationIssue, ModuleValidationResult } from "./module.types";

const statusSet = new Set<ModuleStatus>(MODULE_STATUSES);

export function compareModulesByOrder(first: ModuleDescriptor, second: ModuleDescriptor) {
  return first.order - second.order || first.id.localeCompare(second.id);
}

export function cloneModuleDescriptor(descriptor: ModuleDescriptor): ModuleDescriptor {
  return Object.freeze({
    ...descriptor,
    dependencies: descriptor.dependencies ? Object.freeze([...descriptor.dependencies]) : undefined,
    optionalDependencies: descriptor.optionalDependencies ? Object.freeze([...descriptor.optionalDependencies]) : undefined,
    features: descriptor.features ? Object.freeze([...descriptor.features]) : undefined,
    navigation: descriptor.navigation ? Object.freeze({ ...descriptor.navigation }) : undefined,
    commandCenter: descriptor.commandCenter
      ? Object.freeze({
          ...descriptor.commandCenter,
          navigationKeywords: descriptor.commandCenter.navigationKeywords ? Object.freeze([...descriptor.commandCenter.navigationKeywords]) : undefined,
          quickCreateKeys: descriptor.commandCenter.quickCreateKeys ? Object.freeze([...descriptor.commandCenter.quickCreateKeys]) : undefined,
          recordSearchKeys: descriptor.commandCenter.recordSearchKeys ? Object.freeze([...descriptor.commandCenter.recordSearchKeys]) : undefined
        })
      : undefined,
    dashboard: descriptor.dashboard
      ? Object.freeze({
          ...descriptor.dashboard,
          widgetKeys: descriptor.dashboard.widgetKeys ? Object.freeze([...descriptor.dashboard.widgetKeys]) : undefined
        })
      : undefined
  });
}

export function validateModuleDescriptors(descriptors: readonly ModuleDescriptor[]): ModuleValidationResult {
  const issues: ModuleValidationIssue[] = [];
  const seenIds = new Set<ModuleId>();
  const descriptorsById = new Map<ModuleId, ModuleDescriptor>();
  const routeOwners = new Map<string, ModuleId>();

  for (const descriptor of descriptors) {
    if (seenIds.has(descriptor.id)) {
      issues.push({
        code: "duplicate-id",
        severity: "error",
        moduleId: descriptor.id,
        message: `Module id "${descriptor.id}" is registered more than once.`
      });
      continue;
    }

    seenIds.add(descriptor.id);
    descriptorsById.set(descriptor.id, descriptor);

    if (!statusSet.has(descriptor.status)) {
      issues.push({
        code: "invalid-status",
        severity: "error",
        moduleId: descriptor.id,
        message: `Module "${descriptor.id}" has an invalid status "${descriptor.status}".`
      });
    }

    if (!descriptor.name.trim() || !descriptor.description.trim()) {
      issues.push({
        code: "missing-label",
        severity: "error",
        moduleId: descriptor.id,
        message: `Module "${descriptor.id}" must declare a user-facing name and description.`
      });
    }

    if (descriptor.navigation && !descriptor.navigation.label.trim()) {
      issues.push({
        code: "missing-label",
        severity: "error",
        moduleId: descriptor.id,
        message: `Module "${descriptor.id}" has navigation metadata without a label.`
      });
    }

    if (descriptor.hidden && descriptor.defaultEnabled) {
      issues.push({
        code: "hidden-default-enabled",
        severity: "error",
        moduleId: descriptor.id,
        message: `Hidden module "${descriptor.id}" must not be enabled by default.`
      });
    }

    if (descriptor.route) {
      const owner = routeOwners.get(descriptor.route);
      if (owner) {
        issues.push({
          code: "duplicate-route",
          severity: "error",
          moduleId: descriptor.id,
          message: `Modules "${owner}" and "${descriptor.id}" both declare route "${descriptor.route}".`
        });
      } else {
        routeOwners.set(descriptor.route, descriptor.id);
      }
    }
  }

  for (const descriptor of descriptors) {
    const dependencies = [...(descriptor.dependencies ?? []), ...(descriptor.optionalDependencies ?? [])];

    for (const dependencyId of dependencies) {
      if (dependencyId === descriptor.id) {
        issues.push({
          code: "self-dependency",
          severity: "error",
          moduleId: descriptor.id,
          message: `Module "${descriptor.id}" cannot depend on itself.`
        });
      }

      if (!descriptorsById.has(dependencyId)) {
        issues.push({
          code: "unknown-dependency",
          severity: "error",
          moduleId: descriptor.id,
          message: `Module "${descriptor.id}" depends on unknown module "${dependencyId}".`
        });
      }
    }
  }

  issues.push(...detectCircularDependencies(descriptorsById));

  return Object.freeze({
    valid: issues.every((issue) => issue.severity !== "error"),
    issues: Object.freeze(issues)
  });
}

function detectCircularDependencies(descriptorsById: ReadonlyMap<ModuleId, ModuleDescriptor>) {
  const issues: ModuleValidationIssue[] = [];
  const visiting = new Set<ModuleId>();
  const visited = new Set<ModuleId>();

  function visit(moduleId: ModuleId, path: ModuleId[]) {
    if (visiting.has(moduleId)) {
      const cycleStart = path.indexOf(moduleId);
      const cycle = [...path.slice(Math.max(0, cycleStart)), moduleId].join(" -> ");
      issues.push({
        code: "circular-dependency",
        severity: "error",
        moduleId,
        message: `Circular module dependency detected: ${cycle}.`
      });
      return;
    }

    if (visited.has(moduleId)) return;

    const descriptor = descriptorsById.get(moduleId);
    if (!descriptor) return;

    visiting.add(moduleId);
    for (const dependencyId of descriptor.dependencies ?? []) {
      visit(dependencyId, [...path, moduleId]);
    }
    visiting.delete(moduleId);
    visited.add(moduleId);
  }

  for (const moduleId of descriptorsById.keys()) {
    visit(moduleId, []);
  }

  return issues;
}
