import type { PlatformCapabilityInput } from "@/core/capabilities";
import { SALES_MODULE_ID, SALES_MODULE_VERSION } from "./sales.constants";
import { salesPermissions } from "./sales.permissions";

const permission = (module: string, action: "read" | "write") => salesPermissions.find((item) => item.module === module && item.action === action);

export const salesCapabilities = Object.freeze([
  defineSalesCapability("sales.read", "Read Sales", "sales", "read"),
  defineSalesCapability("sales.write", "Write Sales", "sales", "write"),
  defineSalesCapability("sales.quote.read", "Read Sales Quotes", "sales.quote", "read"),
  defineSalesCapability("sales.quote.write", "Write Sales Quotes", "sales.quote", "write"),
  defineSalesCapability("sales.invoice.read", "Read Sales Invoices", "sales.invoice", "read"),
  defineSalesCapability("sales.invoice.write", "Write Sales Invoices", "sales.invoice", "write")
] satisfies PlatformCapabilityInput[]);

function defineSalesCapability(id: string, name: string, module: string, action: "read" | "write"): PlatformCapabilityInput {
  const requiredPermission = permission(module, action);

  return Object.freeze({
    id,
    name,
    category: "business",
    type: "application",
    description: `${name} capability for the Sales business module.`,
    version: SALES_MODULE_VERSION,
    permissions: requiredPermission ? [requiredPermission] : [],
    workspaceAware: true,
    enabled: true,
    metadata: {
      moduleId: SALES_MODULE_ID,
      businessModule: true
    }
  });
}
