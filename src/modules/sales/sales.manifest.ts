import { createManifest } from "@/core/manifests";
import {
  SALES_MODULE_DISPLAY_NAME,
  SALES_MODULE_ID,
  SALES_MODULE_NAME,
  SALES_MODULE_VERSION,
  SALES_PLATFORM_VERSION
} from "./sales.constants";
import { salesCapabilities } from "./sales.capabilities";
import { salesPermissions } from "./sales.permissions";

export const salesManifest = createManifest({
  id: SALES_MODULE_ID,
  name: SALES_MODULE_NAME,
  displayName: SALES_MODULE_DISPLAY_NAME,
  description: "Sales business application foundation for quotes, invoices and future payments.",
  author: "HicoPilot",
  vendor: "HicoPilot",
  version: SALES_MODULE_VERSION,
  platformVersion: SALES_PLATFORM_VERSION,
  category: "application",
  capabilities: salesCapabilities,
  permissions: salesPermissions,
  dependencies: [],
  compatibility: {
    minimumPlatformVersion: SALES_PLATFORM_VERSION,
    requiredCapabilities: salesCapabilities.map((capability) => capability.id)
  },
  workspaceAware: true,
  enabledByDefault: false,
  entry: "src/modules/sales/index.ts",
  metadata: {
    visibility: "internal-foundation",
    navigation: "sales",
    phase: "sales-engine"
  }
});
