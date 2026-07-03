import { CRM_MODULE_ROUTE } from "./crm.constants";
import type { CrmNavigationItem } from "./crm.types";

export const crmNavigation = Object.freeze({
  id: "crm",
  label: "CRM",
  route: CRM_MODULE_ROUTE,
  permission: "crm.read",
  metadata: {
    module: "crm",
    placement: "business-suite",
    icon: "ContactRound",
    permissionModule: "clients",
    activePath: CRM_MODULE_ROUTE,
    sidebarRoot: true
  },
  children: Object.freeze([
    {
      id: "crm.companies",
      label: "Sociétés",
      route: `${CRM_MODULE_ROUTE}/companies`,
      permission: "crm.company.read",
      metadata: { icon: "Building2", permissionModule: "clients", activePath: `${CRM_MODULE_ROUTE}/companies` }
    },
    {
      id: "crm.customers",
      label: "Clients",
      route: "/clients",
      permission: "crm.customer.read",
      metadata: { icon: "Users", permissionModule: "clients", activePath: "/clients" }
    },
    {
      id: "crm.opportunities",
      label: "Opportunités",
      route: `${CRM_MODULE_ROUTE}/opportunities`,
      permission: "crm.opportunity.read",
      metadata: { icon: "HandCoins", permissionModule: "clients", activePath: `${CRM_MODULE_ROUTE}/opportunities` }
    },
    {
      id: "crm.contacts",
      label: "Contacts",
      route: `${CRM_MODULE_ROUTE}/companies`,
      permission: "crm.contact.read",
      metadata: { icon: "ContactRound", permissionModule: "clients", badge: "via société", contextual: true }
    },
    {
      id: "crm.activities",
      label: "Activités / Timeline",
      route: `${CRM_MODULE_ROUTE}/companies`,
      permission: "crm.activity.read",
      metadata: { icon: "ClipboardList", permissionModule: "clients", badge: "via société", contextual: true }
    },
    {
      id: "crm.meetings",
      label: "Réunions",
      route: `${CRM_MODULE_ROUTE}/companies`,
      permission: "crm.meeting.read",
      metadata: { icon: "CalendarCheck", permissionModule: "clients", badge: "via contact", contextual: true }
    },
    {
      id: "crm.tasks",
      label: "Tâches",
      route: `${CRM_MODULE_ROUTE}/companies`,
      permission: "crm.task.read",
      metadata: { icon: "ScrollText", permissionModule: "clients", badge: "via contact", contextual: true }
    },
    {
      id: "crm.notes",
      label: "Notes",
      route: `${CRM_MODULE_ROUTE}/companies`,
      permission: "crm.note.read",
      metadata: { icon: "FileText", permissionModule: "clients", badge: "via contact", contextual: true }
    }
  ] satisfies CrmNavigationItem[])
} satisfies CrmNavigationItem);
