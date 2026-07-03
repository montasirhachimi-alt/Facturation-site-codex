import type { HicoPilotManifest } from "@/core/manifests";
import type { PlatformCapabilityInput } from "@/core/capabilities";
import type { CorePermissionRequirement } from "@/core/types";

export type SalesRouteId =
  | "sales"
  | "sales.quotes"
  | "sales.quote.details"
  | "sales.invoices"
  | "sales.invoice.details";

export type SalesNavigationId = "sales" | "sales.quotes" | "sales.invoices";

export type SalesNavigationItem = Readonly<{
  id: SalesNavigationId;
  label: string;
  route: string;
  permission: string;
  children?: readonly SalesNavigationItem[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
}>;

export type SalesRouteDefinition = Readonly<{
  id: SalesRouteId;
  path: string;
  lazy: boolean;
  permission: string;
  description: string;
}>;

export type SalesModuleDefinition = Readonly<{
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  manifest: HicoPilotManifest;
  capabilities: readonly PlatformCapabilityInput[];
  permissions: readonly CorePermissionRequirement[];
  routes: readonly SalesRouteDefinition[];
  navigation: SalesNavigationItem;
}>;
