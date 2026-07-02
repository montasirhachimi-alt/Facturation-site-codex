import type { ContactRole, ContactSort, ContactStatus } from "./contact.types";

export const CONTACT_STATUSES = Object.freeze(["active", "inactive", "archived"] satisfies ContactStatus[]);

export const CONTACT_ROLES = Object.freeze([
  "primary",
  "decision_maker",
  "influencer",
  "technical",
  "finance",
  "operations",
  "other"
] satisfies ContactRole[]);

export const DEFAULT_CONTACT_STATUS: ContactStatus = "active";
export const DEFAULT_CONTACT_LANGUAGE = "fr";
export const DEFAULT_CONTACT_TIMEZONE = "Africa/Casablanca";
export const DEFAULT_CONTACT_SORT: ContactSort = Object.freeze({ field: "fullName", direction: "asc" });

export const CRM_CONTACT_READ_PERMISSION = Object.freeze({ module: "crm.contact", action: "read" as const });
export const CRM_CONTACT_WRITE_PERMISSION = Object.freeze({ module: "crm.contact", action: "write" as const });
