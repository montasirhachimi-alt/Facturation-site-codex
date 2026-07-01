import type { ManifestValidationIssue } from "@/core/manifests";
import type {
  ModuleCompatibility,
  ModuleDependency,
  ModuleDescriptor,
  ModuleLoadIssue,
  ModuleLoadResult
} from "./module-loader.types";

export function compareSemanticVersions(left: string, right: string) {
  const leftParts = parseStableVersion(left);
  const rightParts = parseStableVersion(right);

  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index] - rightParts[index];
    if (difference !== 0) return difference;
  }

  return 0;
}

export function parseStableVersion(version: string) {
  return version.split("-")[0].split(".").map((part) => Number(part));
}

export function createModuleLoadResult(
  loaded: boolean,
  issues: readonly ModuleLoadIssue[],
  manifestIssues: readonly ManifestValidationIssue[] = [],
  descriptor?: ModuleDescriptor
): ModuleLoadResult {
  return Object.freeze({
    loaded,
    descriptor,
    manifest: descriptor?.manifest,
    issues: Object.freeze([...issues]),
    manifestIssues: Object.freeze([...manifestIssues])
  });
}

export function freezeDependencies(dependencies: readonly ModuleDependency[]) {
  return Object.freeze(dependencies.map((dependency) => Object.freeze({ ...dependency })));
}

export function freezeModuleCompatibility(compatibility: ModuleCompatibility): ModuleCompatibility {
  return Object.freeze({
    ...compatibility,
    requiredCapabilities: Object.freeze([...compatibility.requiredCapabilities]),
    optionalCapabilities: Object.freeze([...compatibility.optionalCapabilities])
  });
}

export function freezeDescriptor(descriptor: ModuleDescriptor): ModuleDescriptor {
  return Object.freeze({
    ...descriptor,
    capabilities: Object.freeze([...descriptor.capabilities]),
    dependencies: freezeDependencies(descriptor.dependencies),
    compatibility: freezeModuleCompatibility(descriptor.compatibility),
    metadata: descriptor.metadata ? Object.freeze({ ...descriptor.metadata }) : undefined
  });
}

export function hasCircularDependency(moduleId: string, graph: Readonly<Record<string, readonly string[]>> = {}) {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;

    visiting.add(id);
    for (const dependencyId of graph[id] ?? []) {
      if (visit(dependencyId)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return visit(moduleId);
}
