import { CRM_MODULE_ROUTE } from "./crm.constants";
import type { CrmRouteDefinition } from "./crm.types";

export const crmRoutes = Object.freeze([
  defineRoute("crm", CRM_MODULE_ROUTE, "crm.read", "CRM module entry route."),
  defineRoute("crm.customers", `${CRM_MODULE_ROUTE}/customers`, "crm.customer.read", "Future CRM customers route."),
  defineRoute("crm.companies", `${CRM_MODULE_ROUTE}/companies`, "crm.company.read", "Future CRM companies route."),
  defineRoute("crm.contacts", `${CRM_MODULE_ROUTE}/contacts`, "crm.contact.read", "Future CRM contacts route."),
  defineRoute("crm.contact.details", `${CRM_MODULE_ROUTE}/contacts/[contactId]`, "crm.contact.read", "CRM contact details workspace route."),
  defineRoute("crm.activities", `${CRM_MODULE_ROUTE}/activities`, "crm.activity.read", "Future CRM activities route."),
  defineRoute("crm.opportunities", `${CRM_MODULE_ROUTE}/opportunities`, "crm.opportunity.read", "CRM sales pipeline workspace route."),
  defineRoute("crm.notes", `${CRM_MODULE_ROUTE}/notes`, "crm.note.read", "Future CRM notes route.")
] satisfies CrmRouteDefinition[]);

function defineRoute(id: CrmRouteDefinition["id"], path: string, permission: string, description: string): CrmRouteDefinition {
  return Object.freeze({
    id,
    path,
    permission,
    description,
    lazy: true
  });
}
