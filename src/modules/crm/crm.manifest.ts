import { createManifest } from "@/core/manifests";
import {
  CRM_MODULE_DISPLAY_NAME,
  CRM_MODULE_ID,
  CRM_MODULE_NAME,
  CRM_MODULE_VERSION,
  CRM_PLATFORM_VERSION
} from "./crm.constants";
import { crmCapabilities } from "./crm.capabilities";
import { crmPermissions } from "./crm.permissions";

export const crmManifest = createManifest({
  id: CRM_MODULE_ID,
  name: CRM_MODULE_NAME,
  displayName: CRM_MODULE_DISPLAY_NAME,
  description: "CRM business application foundation for customers, companies, contacts, activities, meetings, tasks, notes and opportunities.",
  author: "HicoPilot",
  vendor: "HicoPilot",
  version: CRM_MODULE_VERSION,
  platformVersion: CRM_PLATFORM_VERSION,
  category: "application",
  capabilities: crmCapabilities,
  permissions: crmPermissions,
  dependencies: [],
  compatibility: {
    minimumPlatformVersion: CRM_PLATFORM_VERSION,
    requiredCapabilities: crmCapabilities.map((capability) => capability.id)
  },
  workspaceAware: true,
  enabledByDefault: false,
  entry: "src/modules/crm/index.ts",
  metadata: {
    visibility: "internal-foundation",
    navigation: "crm",
    phase: "business-suite"
  }
});
