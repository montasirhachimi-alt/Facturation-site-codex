import type { HicoPilotManifest } from "@/core/manifests";
import type { PlatformCapabilityInput } from "@/core/capabilities";
import type { CorePermissionRequirement } from "@/core/types";

export type CrmRouteId =
  | "crm"
  | "crm.customers"
  | "crm.companies"
  | "crm.contacts"
  | "crm.contact.details"
  | "crm.activities"
  | "crm.opportunities"
  | "crm.notes";

export type CrmNavigationItem = Readonly<{
  id: CrmRouteId;
  label: string;
  route: string;
  permission: string;
  children?: readonly CrmNavigationItem[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
}>;

export type CrmRouteDefinition = Readonly<{
  id: CrmRouteId;
  path: string;
  lazy: boolean;
  permission: string;
  description: string;
}>;

export type CrmModuleDefinition = Readonly<{
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  manifest: HicoPilotManifest;
  capabilities: readonly PlatformCapabilityInput[];
  permissions: readonly CorePermissionRequirement[];
  routes: readonly CrmRouteDefinition[];
  navigation: CrmNavigationItem;
}>;
