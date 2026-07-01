import type { CustomerSort, CustomerSource, CustomerStatus, CustomerType } from "./customer.types";

export const CUSTOMER_STATUSES = Object.freeze(["lead", "active", "inactive", "archived"] satisfies CustomerStatus[]);
export const CUSTOMER_TYPES = Object.freeze(["individual", "company"] satisfies CustomerType[]);
export const CUSTOMER_SOURCES = Object.freeze(["manual", "import", "website", "referral", "campaign", "unknown"] satisfies CustomerSource[]);

export const DEFAULT_CUSTOMER_STATUS: CustomerStatus = "lead";
export const DEFAULT_CUSTOMER_TYPE: CustomerType = "individual";
export const DEFAULT_CUSTOMER_SOURCE: CustomerSource = "manual";
export const DEFAULT_CUSTOMER_SORT: CustomerSort = Object.freeze({ field: "displayName", direction: "asc" });

export const CRM_CUSTOMER_READ_PERMISSION = Object.freeze({ module: "crm.customer", action: "read" as const });
export const CRM_CUSTOMER_WRITE_PERMISSION = Object.freeze({ module: "crm.customer", action: "write" as const });

