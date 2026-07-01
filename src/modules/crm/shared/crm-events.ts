export const crmEventNames = Object.freeze({
  customerCreated: "crm.customer.created",
  customerUpdated: "crm.customer.updated",
  customerArchived: "crm.customer.archived",
  companyCreated: "crm.company.created",
  companyUpdated: "crm.company.updated",
  companyArchived: "crm.company.archived",
  contactCreated: "crm.contact.created",
  contactUpdated: "crm.contact.updated",
  contactArchived: "crm.contact.archived",
  activityCreated: "crm.activity.created",
  activityUpdated: "crm.activity.updated",
  noteCreated: "crm.note.created",
  noteUpdated: "crm.note.updated"
} as const);

export type CrmEventName = (typeof crmEventNames)[keyof typeof crmEventNames];

export type CrmEventContract = Readonly<{
  name: CrmEventName;
  entityType: "customer" | "company" | "contact" | "activity" | "note";
  action: "created" | "updated" | "archived";
}>;

export const crmEventContracts = Object.freeze([
  { name: crmEventNames.customerCreated, entityType: "customer", action: "created" },
  { name: crmEventNames.customerUpdated, entityType: "customer", action: "updated" },
  { name: crmEventNames.customerArchived, entityType: "customer", action: "archived" },
  { name: crmEventNames.companyCreated, entityType: "company", action: "created" },
  { name: crmEventNames.companyUpdated, entityType: "company", action: "updated" },
  { name: crmEventNames.companyArchived, entityType: "company", action: "archived" },
  { name: crmEventNames.contactCreated, entityType: "contact", action: "created" },
  { name: crmEventNames.contactUpdated, entityType: "contact", action: "updated" },
  { name: crmEventNames.contactArchived, entityType: "contact", action: "archived" },
  { name: crmEventNames.activityCreated, entityType: "activity", action: "created" },
  { name: crmEventNames.activityUpdated, entityType: "activity", action: "updated" },
  { name: crmEventNames.noteCreated, entityType: "note", action: "created" },
  { name: crmEventNames.noteUpdated, entityType: "note", action: "updated" }
] satisfies CrmEventContract[]);

