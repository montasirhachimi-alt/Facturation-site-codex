import type { CorePermissionRequirement } from "@/core/types";

export type PlatformCapabilityType =
  | "application"
  | "command"
  | "widget"
  | "navigation"
  | "service"
  | "runtime"
  | "plugin"
  | "ai_skill"
  | "ai_agent"
  | "workflow_action"
  | "api_endpoint"
  | (string & {});

export type PlatformCapabilityCategory =
  | "business"
  | "command"
  | "widget"
  | "navigation"
  | "service"
  | "runtime"
  | "plugin"
  | "ai"
  | "workflow"
  | "api"
  | "system"
  | (string & {});

export type PlatformCapabilityMetadata = Readonly<Record<string, string | number | boolean | null | undefined>>;

export type PlatformCapability = Readonly<{
  id: string;
  name: string;
  category: PlatformCapabilityCategory;
  type: PlatformCapabilityType;
  description?: string;
  version: string;
  permissions: readonly CorePermissionRequirement[];
  workspaceAware: boolean;
  enabled: boolean;
  metadata?: PlatformCapabilityMetadata;
}>;

export type PlatformCapabilityInput = Omit<PlatformCapability, "version" | "permissions" | "workspaceAware" | "enabled"> & {
  version?: string;
  permissions?: readonly CorePermissionRequirement[];
  workspaceAware?: boolean;
  enabled?: boolean;
};

export type PlatformCapabilityRegistryApi = {
  register: (capability: PlatformCapabilityInput) => PlatformCapability;
  registerMany: (capabilities: readonly PlatformCapabilityInput[]) => PlatformCapability[];
  find: (id: string) => PlatformCapability | undefined;
  findByCategory: (category: PlatformCapabilityCategory) => PlatformCapability[];
  findByType: (type: PlatformCapabilityType) => PlatformCapability[];
  exists: (id: string) => boolean;
  remove: (id: string) => PlatformCapability | undefined;
  clear: () => void;
  list: () => PlatformCapability[];
};

