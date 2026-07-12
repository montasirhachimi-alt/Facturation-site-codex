import type { ModuleRegistry } from "./module.registry";
import type { ModuleActivationIssue, ModuleActivationRequest, ModuleActivationResult } from "./module-activation.types";
import type { ModuleDescriptor, ModuleId } from "./module.types";
import { compareModulesByOrder } from "./module.utils";

type MutableResolution = {
  activeIds: Set<ModuleId>;
  autoEnabledIds: Set<ModuleId>;
  blocked: Map<ModuleId, string>;
  warnings: ModuleActivationIssue[];
  errors: ModuleActivationIssue[];
};

export class ModuleActivationEngine {
  constructor(private readonly registry: ModuleRegistry) {}

  resolve(request: ModuleActivationRequest = {}): ModuleActivationResult {
    const profileKey = request.profileKey ?? "default";
    const requestedEnabledModuleIds = Object.freeze([...(request.enabledModuleIds ?? [])]);
    const requestedDisabledModuleIds = Object.freeze([...(request.disabledModuleIds ?? [])]);
    const disabledIds = new Set<ModuleId>(requestedDisabledModuleIds);
    const seedIds = new Set<ModuleId>();
    const mutable: MutableResolution = {
      activeIds: new Set<ModuleId>(),
      autoEnabledIds: new Set<ModuleId>(),
      blocked: new Map<ModuleId, string>(),
      warnings: [],
      errors: []
    };

    if (request.includeDefaults ?? true) {
      this.registry
        .list()
        .filter((descriptor) => descriptor.defaultEnabled)
        .forEach((descriptor) => seedIds.add(descriptor.id));
    }

    requestedEnabledModuleIds.forEach((moduleId) => seedIds.add(moduleId));

    for (const moduleId of [...seedIds].sort()) {
      this.activate(moduleId, request, disabledIds, mutable, []);
    }

    const activeModules = this.registry
      .list()
      .filter((descriptor) => mutable.activeIds.has(descriptor.id))
      .sort(compareModulesByOrder);
    const activationOrder = orderByDependencies(activeModules);
    const activeModuleIds = Object.freeze(activationOrder);
    const activeModuleIdSet = new Set<ModuleId>(activeModuleIds);
    const orderedActiveModules = Object.freeze(
      activationOrder.map((moduleId) => activeModules.find((descriptor) => descriptor.id === moduleId)).filter((descriptor): descriptor is ModuleDescriptor => Boolean(descriptor))
    );

    return Object.freeze({
      profileKey,
      requestedEnabledModuleIds,
      requestedDisabledModuleIds,
      activeModuleIds,
      activeModules: orderedActiveModules,
      activeModuleIdSet,
      automaticallyEnabledModuleIds: Object.freeze([...mutable.autoEnabledIds].sort()),
      blockedModules: Object.freeze([...mutable.blocked.entries()].map(([moduleId, reason]) => ({ moduleId, reason }))),
      warnings: Object.freeze(mutable.warnings),
      errors: Object.freeze(mutable.errors),
      activationOrder: activeModuleIds
    });
  }

  private activate(
    moduleId: ModuleId,
    request: ModuleActivationRequest,
    disabledIds: ReadonlySet<ModuleId>,
    mutable: MutableResolution,
    stack: ModuleId[],
    automatic = false
  ) {
    if (mutable.activeIds.has(moduleId)) return true;
    if (mutable.blocked.has(moduleId)) return false;

    const descriptor = this.registry.get(moduleId);
    if (!descriptor) {
      mutable.errors.push({
        code: "unknown-module",
        severity: "error",
        moduleId,
        message: `Module "${moduleId}" is not registered.`
      });
      mutable.blocked.set(moduleId, "Unknown module.");
      return false;
    }

    if (disabledIds.has(moduleId)) {
      mutable.blocked.set(moduleId, "Module was explicitly disabled.");
      return false;
    }

    if (stack.includes(moduleId)) {
      const cycle = [...stack, moduleId].join(" -> ");
      mutable.errors.push({
        code: "circular-dependency",
        severity: "error",
        moduleId,
        message: `Circular module activation dependency detected: ${cycle}.`
      });
      mutable.blocked.set(moduleId, "Circular dependency.");
      return false;
    }

    if (!this.lifecycleAllowsActivation(descriptor, request, mutable)) {
      mutable.blocked.set(moduleId, `Module status "${descriptor.status}" is not allowed by this activation request.`);
      return false;
    }

    for (const dependencyId of descriptor.dependencies ?? []) {
      if (disabledIds.has(dependencyId)) {
        mutable.errors.push({
          code: "disabled-dependency",
          severity: "error",
          moduleId,
          message: `Module "${moduleId}" requires "${dependencyId}", but that dependency was explicitly disabled.`
        });
        mutable.blocked.set(moduleId, `Required dependency "${dependencyId}" was disabled.`);
        return false;
      }

      const dependencyActivated = this.activate(dependencyId, request, disabledIds, mutable, [...stack, moduleId], true);
      if (!dependencyActivated) {
        const issue = {
          code: "unresolved-dependency" as const,
          severity: request.strictDependencies === false ? "warning" as const : "error" as const,
          moduleId,
          message: `Module "${moduleId}" could not activate required dependency "${dependencyId}".`
        };
        mutable[issue.severity === "error" ? "errors" : "warnings"].push(issue);
        if (request.strictDependencies !== false) {
          mutable.blocked.set(moduleId, `Required dependency "${dependencyId}" could not be activated.`);
          return false;
        }
      }
    }

    mutable.activeIds.add(moduleId);
    if (automatic) {
      mutable.autoEnabledIds.add(moduleId);
    }
    return true;
  }

  private lifecycleAllowsActivation(
    descriptor: ModuleDescriptor,
    request: ModuleActivationRequest,
    mutable: MutableResolution
  ) {
    if (descriptor.status === "planned" && !request.allowPlanned) {
      mutable.errors.push({
        code: "planned-module-requested",
        severity: "error",
        moduleId: descriptor.id,
        message: `Planned module "${descriptor.id}" cannot be activated by this profile.`
      });
      return false;
    }

    if (descriptor.hidden && !request.allowHidden && !descriptor.alphaReady) {
      mutable.errors.push({
        code: "hidden-module-requested",
        severity: "error",
        moduleId: descriptor.id,
        message: `Hidden module "${descriptor.id}" cannot be activated by this profile.`
      });
      return false;
    }

    if (descriptor.status === "preview" && !request.allowPreview) {
      mutable.errors.push({
        code: "preview-module-requested",
        severity: "error",
        moduleId: descriptor.id,
        message: `Preview module "${descriptor.id}" requires preview activation.`
      });
      return false;
    }

    if (descriptor.status === "deprecated") {
      const issue = {
        code: "deprecated-module-requested" as const,
        severity: request.allowDeprecated ? "warning" as const : "error" as const,
        moduleId: descriptor.id,
        message: `Deprecated module "${descriptor.id}" was requested.`
      };
      mutable[issue.severity === "error" ? "errors" : "warnings"].push(issue);
      return Boolean(request.allowDeprecated);
    }

    return true;
  }
}

function orderByDependencies(activeModules: readonly ModuleDescriptor[]) {
  const moduleById = new Map(activeModules.map((descriptor) => [descriptor.id, descriptor]));
  const visited = new Set<ModuleId>();
  const ordered: ModuleId[] = [];

  function visit(descriptor: ModuleDescriptor) {
    if (visited.has(descriptor.id)) return;
    visited.add(descriptor.id);

    for (const dependencyId of descriptor.dependencies ?? []) {
      const dependency = moduleById.get(dependencyId);
      if (dependency) visit(dependency);
    }

    ordered.push(descriptor.id);
  }

  activeModules.slice().sort(compareModulesByOrder).forEach(visit);
  return ordered;
}
