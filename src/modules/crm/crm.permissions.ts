import type { CorePermissionRequirement } from "@/core/types";

export const crmPermissions = Object.freeze([
  { module: "crm", action: "read" },
  { module: "crm", action: "write" },
  { module: "crm.customer", action: "read" },
  { module: "crm.customer", action: "write" },
  { module: "crm.company", action: "read" },
  { module: "crm.company", action: "write" },
  { module: "crm.contact", action: "read" },
  { module: "crm.contact", action: "write" },
  { module: "crm.activity", action: "read" },
  { module: "crm.activity", action: "write" },
  { module: "crm.meeting", action: "read" },
  { module: "crm.meeting", action: "write" },
  { module: "crm.task", action: "read" },
  { module: "crm.task", action: "write" },
  { module: "crm.note", action: "read" },
  { module: "crm.note", action: "write" },
  { module: "crm.opportunity", action: "read" },
  { module: "crm.opportunity", action: "write" }
] satisfies CorePermissionRequirement[]);

export type CrmPermission = (typeof crmPermissions)[number];
