import type { PlatformCapabilityInput } from "@/core/capabilities";
import { CRM_MODULE_ID, CRM_MODULE_VERSION } from "./crm.constants";
import { crmPermissions } from "./crm.permissions";

const permission = (module: string, action: "read" | "write") => crmPermissions.find((item) => item.module === module && item.action === action);

export const crmCapabilities = Object.freeze([
  defineCrmCapability("crm.read", "Read CRM", "crm", "read"),
  defineCrmCapability("crm.write", "Write CRM", "crm", "write"),
  defineCrmCapability("crm.customer.read", "Read CRM Customers", "crm.customer", "read"),
  defineCrmCapability("crm.customer.write", "Write CRM Customers", "crm.customer", "write"),
  defineCrmCapability("crm.company.read", "Read CRM Companies", "crm.company", "read"),
  defineCrmCapability("crm.company.write", "Write CRM Companies", "crm.company", "write"),
  defineCrmCapability("crm.contact.read", "Read CRM Contacts", "crm.contact", "read"),
  defineCrmCapability("crm.contact.write", "Write CRM Contacts", "crm.contact", "write"),
  defineCrmCapability("crm.activity.read", "Read CRM Activities", "crm.activity", "read"),
  defineCrmCapability("crm.activity.write", "Write CRM Activities", "crm.activity", "write"),
  defineCrmCapability("crm.note.read", "Read CRM Notes", "crm.note", "read"),
  defineCrmCapability("crm.note.write", "Write CRM Notes", "crm.note", "write")
] satisfies PlatformCapabilityInput[]);

function defineCrmCapability(id: string, name: string, module: string, action: "read" | "write"): PlatformCapabilityInput {
  const requiredPermission = permission(module, action);

  return Object.freeze({
    id,
    name,
    category: "business",
    type: "application",
    description: `${name} capability for the CRM business module.`,
    version: CRM_MODULE_VERSION,
    permissions: requiredPermission ? [requiredPermission] : [],
    workspaceAware: true,
    enabled: true,
    metadata: {
      moduleId: CRM_MODULE_ID,
      businessModule: true
    }
  });
}

