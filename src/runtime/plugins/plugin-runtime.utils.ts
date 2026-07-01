import type { ModuleDescriptor } from "@/core/module-loader";
import type { PermissionDecision } from "@/runtime/permissions";
import type { PluginDescriptor, PluginLifecycle, PluginMetadata, PluginRuntimeState, PluginStatus } from "./plugin-runtime.types";

export function createPluginDescriptor(
  module: ModuleDescriptor,
  status: PluginStatus,
  lifecycle: PluginLifecycle,
  permissionDecisions: readonly PermissionDecision[] = [],
  metadata?: PluginMetadata
): PluginDescriptor {
  return freezePluginDescriptor({
    id: module.id,
    name: module.name,
    version: module.version,
    status,
    module,
    lifecycle,
    permissionDecisions,
    metadata
  });
}

export function updatePluginStatus(plugin: PluginDescriptor, status: PluginStatus, timestamp: string): PluginDescriptor {
  return freezePluginDescriptor({
    ...plugin,
    status,
    lifecycle: {
      ...plugin.lifecycle,
      ...(status === "loaded" ? { loadedAt: timestamp } : {}),
      ...(status === "enabled" ? { enabledAt: timestamp } : {}),
      ...(status === "disabled" ? { disabledAt: timestamp } : {}),
      ...(status === "unloaded" ? { unloadedAt: timestamp } : {}),
      ...(status === "failed" ? { failedAt: timestamp } : {})
    }
  });
}

export function freezePluginDescriptor(plugin: PluginDescriptor): PluginDescriptor {
  return Object.freeze({
    ...plugin,
    lifecycle: Object.freeze({ ...plugin.lifecycle }),
    permissionDecisions: Object.freeze([...plugin.permissionDecisions]),
    metadata: plugin.metadata ? Object.freeze({ ...plugin.metadata }) : undefined
  });
}

export function createPluginRuntimeState(plugins: readonly PluginDescriptor[]): PluginRuntimeState {
  const sortedPlugins = sortPlugins(plugins);
  return Object.freeze({
    plugins: Object.freeze(sortedPlugins),
    enabledPluginIds: Object.freeze(sortedPlugins.filter((plugin) => plugin.status === "enabled").map((plugin) => plugin.id)),
    disabledPluginIds: Object.freeze(sortedPlugins.filter((plugin) => plugin.status === "disabled").map((plugin) => plugin.id)),
    loadedPluginIds: Object.freeze(sortedPlugins.filter((plugin) => plugin.status !== "unloaded").map((plugin) => plugin.id))
  });
}

export function sortPlugins(plugins: readonly PluginDescriptor[]) {
  return [...plugins].sort((first, second) => first.id.localeCompare(second.id));
}

