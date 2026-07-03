import type { SalesModuleDefinition } from "./sales.types";
import {
  SALES_MODULE_DISPLAY_NAME,
  SALES_MODULE_ID,
  SALES_MODULE_NAME,
  SALES_MODULE_VERSION
} from "./sales.constants";
import { salesCapabilities } from "./sales.capabilities";
import { salesManifest } from "./sales.manifest";
import { salesNavigation } from "./sales.navigation";
import { salesPermissions } from "./sales.permissions";
import { salesRoutes } from "./sales.routes";

export const salesModule = Object.freeze({
  id: SALES_MODULE_ID,
  name: SALES_MODULE_NAME,
  displayName: SALES_MODULE_DISPLAY_NAME,
  description: "Sales module foundation for quotes, invoices and future payment workflows.",
  version: SALES_MODULE_VERSION,
  manifest: salesManifest,
  capabilities: salesCapabilities,
  permissions: salesPermissions,
  routes: salesRoutes,
  navigation: salesNavigation
} satisfies SalesModuleDefinition);

export function registerSalesModule() {
  return salesModule;
}
