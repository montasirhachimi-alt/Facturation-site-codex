import type { CrmEntityType, CrmSortDirection } from "./crm-types";

export const CRM_SHARED_MODULE = "crm.shared" as const;

export const CRM_ENTITY_TYPES = Object.freeze([
  "customer",
  "company",
  "contact",
  "activity",
  "note"
] satisfies CrmEntityType[]);

export const CRM_SORT_DIRECTIONS = Object.freeze(["asc", "desc"] satisfies CrmSortDirection[]);

export const CRM_DEFAULT_PAGE = 1;
export const CRM_DEFAULT_PAGE_SIZE = 20;
export const CRM_MAX_PAGE_SIZE = 100;

export const CRM_EVENT_PREFIX = "crm" as const;

export const CRM_EMPTY_SEARCH_SCORE = 0;

