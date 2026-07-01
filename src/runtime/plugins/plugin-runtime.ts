import type { ModuleDescriptor } from "@/core/module-loader";
import { PermissionEnforcement, type PermissionDecision } from "@/runtime/permissions";
import {
  createPluginDescriptor,
  createPluginRuntimeState,
  updatePluginStatus
} from "./plugin-runtime.utils";
import type { PluginDescriptor, PluginRuntimeOptions, PluginRuntimeState } from "./plugin-runtime.types";

export class PluginRuntime {
  private readonly plugins = new Map<string, PluginDescriptor>();
  private readonly now: () => string;
  private readonly permissions = new PermissionEnforcement();

  constructor(options: PluginRuntimeOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  register(module: ModuleDescriptor) {
    if (this.plugins.has(module.id)) {
      throw new Error(`Plugin already registered: ${module.id}`);
    }

    const descriptor = createPluginDescriptor(
      module,
      "registered",
      { registeredAt: this.now() },
      this.evaluatePluginPermissions(module),
      module.metadata
    );

    this.plugins.set(descriptor.id, descriptor);
    return Object.freeze({ descriptor, status: descriptor.status });
  }

  enable(pluginId: string) {
    return this.transition(pluginId, "enabled");
  }

  disable(pluginId: string) {
    return this.transition(pluginId, "disabled");
  }

  markLoaded(pluginId: string) {
    return this.transition(pluginId, "loaded");
  }

  markFailed(pluginId: string) {
    return this.transition(pluginId, "failed");
  }

  remove(pluginId: string) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return undefined;

    const unloaded = updatePluginStatus(plugin, "unloaded", this.now());
    this.plugins.delete(pluginId);
    return unloaded;
  }

  find(pluginId: string) {
    return this.plugins.get(pluginId);
  }

  findAll() {
    return this.list();
  }

  list() {
    return createPluginRuntimeState([...this.plugins.values()]).plugins;
  }

  getState(): PluginRuntimeState {
    return createPluginRuntimeState([...this.plugins.values()]);
  }

  isEnabled(pluginId: string) {
    return this.plugins.get(pluginId)?.status === "enabled";
  }

  isLoaded(pluginId: string) {
    const status = this.plugins.get(pluginId)?.status;
    return Boolean(status && status !== "unloaded" && status !== "failed");
  }

  clear() {
    this.plugins.clear();
  }

  private transition(pluginId: string, status: PluginDescriptor["status"]) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return undefined;

    const updated = updatePluginStatus(plugin, status, this.now());
    this.plugins.set(pluginId, updated);
    return updated;
  }

  private evaluatePluginPermissions(module: ModuleDescriptor): readonly PermissionDecision[] {
    return Object.freeze(
      module.manifest.permissions.map((permission) =>
        this.permissions.evaluate({
          subject: {
            userId: "plugin-runtime",
            role: "COMPANY_ADMIN"
          },
          resource: {
            id: module.id,
            type: "plugin",
            module: permission.module,
            enabled: module.status === "ready"
          },
          action: permission.action,
          permission
        })
      )
    );
  }
}

export const pluginRuntime = new PluginRuntime();

