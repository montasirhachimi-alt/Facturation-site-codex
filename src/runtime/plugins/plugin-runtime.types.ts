import type { ModuleDescriptor } from "@/core/module-loader";
import type { PermissionDecision } from "@/runtime/permissions";

export type PluginStatus = "registered" | "loaded" | "enabled" | "disabled" | "unloaded" | "failed";

export type PluginMetadata = Readonly<Record<string, string | number | boolean | null | undefined>>;

export type PluginLifecycle = Readonly<{
  registeredAt: string;
  loadedAt?: string;
  enabledAt?: string;
  disabledAt?: string;
  unloadedAt?: string;
  failedAt?: string;
}>;

export type PluginDescriptor = Readonly<{
  id: string;
  name: string;
  version: string;
  status: PluginStatus;
  module: ModuleDescriptor;
  lifecycle: PluginLifecycle;
  permissionDecisions: readonly PermissionDecision[];
  metadata?: PluginMetadata;
}>;

export type PluginRegistration = Readonly<{
  descriptor: PluginDescriptor;
  status: PluginStatus;
}>;

export type PluginRuntimeState = Readonly<{
  plugins: readonly PluginDescriptor[];
  enabledPluginIds: readonly string[];
  disabledPluginIds: readonly string[];
  loadedPluginIds: readonly string[];
}>;

export type PluginRuntimeOptions = Readonly<{
  now?: () => string;
}>;

