import type { Activity, ActivityId } from "../activity.types";
import type { CompanyId, UserId } from "../../companies/company.types";
import type { ContactId } from "../../contacts/contact.types";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "../../companies/ui/companies.seed";

export const CRM_ACTIVITIES_WORKSPACE_ID = CRM_COMPANIES_WORKSPACE_ID;
export const CRM_ACTIVITIES_USER_ID = CRM_COMPANIES_USER_ID as UserId;

export const crmActivitySeed = Object.freeze([
  {
    id: "activity-alhikma-meeting" as ActivityId,
    workspaceId: CRM_ACTIVITIES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-sara-amrani" as ContactId,
    type: "meeting",
    title: "Revue du compte",
    description: "Discussion autour des prochaines opportunités et besoins IT.",
    performedBy: CRM_ACTIVITIES_USER_ID,
    performedAt: "2026-07-02T09:30:00.000Z",
    status: "completed",
    priority: "high",
    tags: Object.freeze(["meeting", "opportunity"]),
    metadata: Object.freeze({ source: "company_workspace" }),
    createdAt: "2026-07-02T09:30:00.000Z",
    updatedAt: "2026-07-02T09:30:00.000Z"
  },
  {
    id: "activity-alhikma-call" as ActivityId,
    workspaceId: CRM_ACTIVITIES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-youssef-hakimi" as ContactId,
    type: "call",
    title: "Appel technique",
    description: "Qualification des besoins réseau et maintenance.",
    performedBy: CRM_ACTIVITIES_USER_ID,
    performedAt: "2026-07-01T16:20:00.000Z",
    status: "completed",
    priority: "normal",
    tags: Object.freeze(["call", "technical"]),
    createdAt: "2026-07-01T16:20:00.000Z",
    updatedAt: "2026-07-01T16:20:00.000Z"
  },
  {
    id: "activity-alhikma-email" as ActivityId,
    workspaceId: CRM_ACTIVITIES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-sara-amrani" as ContactId,
    type: "email",
    title: "Documents envoyés",
    description: "Présentation commerciale et conditions de service envoyées.",
    performedBy: CRM_ACTIVITIES_USER_ID,
    performedAt: "2026-07-01T10:45:00.000Z",
    status: "completed",
    priority: "normal",
    tags: Object.freeze(["email"]),
    createdAt: "2026-07-01T10:45:00.000Z",
    updatedAt: "2026-07-01T10:45:00.000Z"
  },
  {
    id: "activity-alhikma-task" as ActivityId,
    workspaceId: CRM_ACTIVITIES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    type: "task",
    title: "Préparer proposition",
    description: "Préparer une proposition pour le prochain cycle.",
    performedBy: CRM_ACTIVITIES_USER_ID,
    performedAt: "2026-07-03T08:00:00.000Z",
    status: "open",
    priority: "high",
    tags: Object.freeze(["task", "proposal"]),
    createdAt: "2026-07-02T12:00:00.000Z",
    updatedAt: "2026-07-02T12:00:00.000Z"
  },
  {
    id: "activity-ibnsina-note" as ActivityId,
    workspaceId: CRM_ACTIVITIES_WORKSPACE_ID,
    companyId: "company-ibn-sina" as CompanyId,
    contactId: "contact-nadia-bennani" as ContactId,
    type: "note",
    title: "Note de qualification",
    description: "Compte à suivre pour futurs devis éducation.",
    performedBy: CRM_ACTIVITIES_USER_ID,
    performedAt: "2026-06-29T11:00:00.000Z",
    status: "completed",
    priority: "normal",
    tags: Object.freeze(["note"]),
    createdAt: "2026-06-29T11:00:00.000Z",
    updatedAt: "2026-06-29T11:00:00.000Z"
  }
] satisfies readonly Activity[]);
