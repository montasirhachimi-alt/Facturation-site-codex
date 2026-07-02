import type { CompanyId, UserId } from "../../companies/company.types";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "../../companies/ui/companies.seed";
import type { ContactId } from "../../contacts/contact.types";
import type { MeetingId } from "../../meetings";
import type { Task, TaskId } from "../task.types";

export const CRM_TASKS_WORKSPACE_ID = CRM_COMPANIES_WORKSPACE_ID;
export const CRM_TASKS_USER_ID = CRM_COMPANIES_USER_ID as UserId;

export const crmTaskSeed = Object.freeze([
  {
    id: "task-alhikma-followup" as TaskId,
    workspaceId: CRM_TASKS_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-sara-amrani" as ContactId,
    meetingId: "meeting-alhikma-strategy" as MeetingId,
    title: "Préparer proposition consolidée",
    description: "Regrouper les options réseau et CRM avant la revue stratégique.",
    taskType: "follow_up",
    priority: "urgent",
    status: "open",
    assignedTo: CRM_TASKS_USER_ID,
    dueDate: "2026-07-04T17:00:00.000Z",
    tags: Object.freeze(["meeting-follow-up", "proposal"]),
    createdAt: "2026-07-02T09:00:00.000Z",
    updatedAt: "2026-07-02T09:00:00.000Z"
  },
  {
    id: "task-alhikma-email" as TaskId,
    workspaceId: CRM_TASKS_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-sara-amrani" as ContactId,
    title: "Envoyer compte rendu",
    description: "Partager les décisions et prochaines étapes.",
    taskType: "email",
    priority: "medium",
    status: "in_progress",
    assignedTo: CRM_TASKS_USER_ID,
    dueDate: "2026-07-05T12:00:00.000Z",
    tags: Object.freeze(["email"]),
    createdAt: "2026-07-01T16:00:00.000Z",
    updatedAt: "2026-07-02T10:00:00.000Z"
  },
  {
    id: "task-alhikma-documents" as TaskId,
    workspaceId: CRM_TASKS_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-sara-amrani" as ContactId,
    title: "Vérifier documents envoyés",
    description: "Confirmer que la présentation commerciale a été reçue.",
    taskType: "document",
    priority: "low",
    status: "completed",
    assignedTo: CRM_TASKS_USER_ID,
    dueDate: "2026-06-30T15:00:00.000Z",
    completedAt: "2026-06-30T14:20:00.000Z",
    tags: Object.freeze(["documents"]),
    createdAt: "2026-06-28T09:00:00.000Z",
    updatedAt: "2026-06-30T14:20:00.000Z"
  },
  {
    id: "task-alhikma-technical-call" as TaskId,
    workspaceId: CRM_TASKS_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-youssef-hakimi" as ContactId,
    title: "Appel technique réseau",
    taskType: "call",
    priority: "high",
    status: "waiting",
    assignedTo: CRM_TASKS_USER_ID,
    dueDate: "2026-07-03T10:00:00.000Z",
    tags: Object.freeze(["technical"]),
    createdAt: "2026-07-01T13:00:00.000Z",
    updatedAt: "2026-07-01T13:00:00.000Z"
  },
  {
    id: "task-ibnsina-reminder" as TaskId,
    workspaceId: CRM_TASKS_WORKSPACE_ID,
    companyId: "company-ibn-sina" as CompanyId,
    contactId: "contact-nadia-bennani" as ContactId,
    title: "Relancer documents administratifs",
    taskType: "reminder",
    priority: "medium",
    status: "open",
    assignedTo: CRM_TASKS_USER_ID,
    dueDate: "2026-07-06T11:00:00.000Z",
    tags: Object.freeze(["administration"]),
    createdAt: "2026-07-01T11:00:00.000Z",
    updatedAt: "2026-07-01T11:00:00.000Z"
  }
] satisfies readonly Task[]);
