import { CRM_MODULE_ROUTE } from "./crm.constants";
import type { CrmNavigationItem } from "./crm.types";

export const crmNavigation = Object.freeze({
  id: "crm",
  label: "CRM",
  route: CRM_MODULE_ROUTE,
  permission: "crm.read",
  metadata: {
    module: "crm",
    placement: "business-suite"
  },
  children: Object.freeze([
    { id: "crm.customers", label: "Customers", route: `${CRM_MODULE_ROUTE}/customers`, permission: "crm.customer.read" },
    { id: "crm.companies", label: "Companies", route: `${CRM_MODULE_ROUTE}/companies`, permission: "crm.company.read" },
    { id: "crm.contacts", label: "Contacts", route: `${CRM_MODULE_ROUTE}/contacts`, permission: "crm.contact.read" },
    { id: "crm.activities", label: "Activities", route: `${CRM_MODULE_ROUTE}/activities`, permission: "crm.activity.read" },
    { id: "crm.notes", label: "Notes", route: `${CRM_MODULE_ROUTE}/notes`, permission: "crm.note.read" }
  ] satisfies CrmNavigationItem[])
} satisfies CrmNavigationItem);

