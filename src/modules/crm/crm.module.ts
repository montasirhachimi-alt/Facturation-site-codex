import type { CrmModuleDefinition } from "./crm.types";
import {
  CRM_MODULE_DISPLAY_NAME,
  CRM_MODULE_ID,
  CRM_MODULE_NAME,
  CRM_MODULE_VERSION
} from "./crm.constants";
import { crmCapabilities } from "./crm.capabilities";
import { crmManifest } from "./crm.manifest";
import { crmNavigation } from "./crm.navigation";
import { crmPermissions } from "./crm.permissions";
import { crmRoutes } from "./crm.routes";

export const crmModule = Object.freeze({
  id: CRM_MODULE_ID,
  name: CRM_MODULE_NAME,
  displayName: CRM_MODULE_DISPLAY_NAME,
  description: "CRM module foundation for future customer relationship management features.",
  version: CRM_MODULE_VERSION,
  manifest: crmManifest,
  capabilities: crmCapabilities,
  permissions: crmPermissions,
  routes: crmRoutes,
  navigation: crmNavigation
} satisfies CrmModuleDefinition);

export function registerCrmModule() {
  return crmModule;
}

