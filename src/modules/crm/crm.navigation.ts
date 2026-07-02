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
    { id: "crm.customers", label: "Clients", route: "/clients", permission: "crm.customer.read" },
    { id: "crm.companies", label: "Sociétés", route: `${CRM_MODULE_ROUTE}/companies`, permission: "crm.company.read" },
    { id: "crm.contacts", label: "Contacts", route: `${CRM_MODULE_ROUTE}/companies`, permission: "crm.contact.read" },
    { id: "crm.activities", label: "Activités", route: `${CRM_MODULE_ROUTE}/companies`, permission: "crm.activity.read" },
    { id: "crm.meetings", label: "Réunions", route: `${CRM_MODULE_ROUTE}/companies`, permission: "crm.meeting.read" },
    { id: "crm.tasks", label: "Tâches", route: `${CRM_MODULE_ROUTE}/companies`, permission: "crm.task.read" },
    { id: "crm.opportunities", label: "Opportunités", route: `${CRM_MODULE_ROUTE}/opportunities`, permission: "crm.opportunity.read" },
    { id: "crm.notes", label: "Notes", route: `${CRM_MODULE_ROUTE}/companies`, permission: "crm.note.read" }
  ] satisfies CrmNavigationItem[])
} satisfies CrmNavigationItem);
